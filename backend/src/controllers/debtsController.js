const pool = require('../config/db');

const WITH_COMPUTED = `
  SELECT d.*,
    c.full_name AS client_name, c.phone AS client_phone,
    COALESCE(r.paid, 0)::numeric          AS total_paid,
    (d.amount - COALESCE(r.paid, 0))::numeric AS remaining,
    CASE
      WHEN d.status = 'paid'  THEN 'paid'
      WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE AND d.status != 'paid' THEN 'overdue'
      ELSE 'active'
    END AS computed_status
  FROM debts d
  JOIN clients c ON c.id = d.client_id
  LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
    ON r.debt_id = d.id`;

async function list(req, res, next) {
  try {
    const { status, type, search } = req.query;
    const params = [req.user.userId];
    let whereExtra = '';

    if (type) { params.push(type); whereExtra += ` AND d.type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); whereExtra += ` AND c.full_name ILIKE $${params.length}`; }

    // status filter maps to computed_status logic
    let statusClause = '';
    if (status === 'paid')    statusClause = ` AND d.status = 'paid'`;
    if (status === 'overdue') statusClause = ` AND d.status != 'paid' AND d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE`;
    if (status === 'active')  statusClause = ` AND d.status != 'paid' AND (d.due_date IS NULL OR d.due_date >= CURRENT_DATE)`;

    const query = `${WITH_COMPUTED}
      WHERE d.user_id = $1 AND d.deleted_at IS NULL${whereExtra}${statusClause}
      ORDER BY d.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `${WITH_COMPUTED} WHERE d.id = $1 AND d.user_id = $2 AND d.deleted_at IS NULL`,
      [id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { client_id, amount, currency, description, due_date, type } = req.body;
    if (!client_id || !amount) return res.status(400).json({ error: 'client_id and amount required' });

    const owner = await pool.query(
      `SELECT id FROM clients WHERE id = $1 AND user_id = $2`,
      [client_id, req.user.userId]
    );
    if (!owner.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const debtType = type === 'payable' ? 'payable' : 'receivable';
    const { rows } = await pool.query(
      `INSERT INTO debts (user_id, client_id, amount, currency, description, due_date, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.userId, client_id, amount, currency || 'TJS', description || null, due_date || null, debtType]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, currency, description, due_date, status, type } = req.body;

    const { rows } = await pool.query(
      `UPDATE debts SET
         amount      = COALESCE($1, amount),
         currency    = COALESCE($2, currency),
         description = COALESCE($3, description),
         due_date    = COALESCE($4::date, due_date),
         status      = COALESCE($5, status),
         type        = COALESCE($6, type)
       WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [amount || null, currency || null, description ?? null, due_date || null, status || null, type || null, id, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      `UPDATE debts SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, req.user.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
