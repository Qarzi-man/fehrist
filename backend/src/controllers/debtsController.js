const pool = require('../config/db');

const JOINS = `
  FROM debts d
  JOIN clients c ON c.id = d.client_id
  LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
    ON r.debt_id = d.id`;

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
  ${JOINS}`;

async function list(req, res, next) {
  try {
    const { status, type, search, currency, date_from, date_to } = req.query;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const params = [req.businessId];
    let whereExtra = '';

    if (type)      { params.push(type);          whereExtra += ` AND d.type = $${params.length}`; }
    if (search)    { params.push(`%${search}%`); whereExtra += ` AND c.full_name ILIKE $${params.length}`; }
    if (currency)  { params.push(currency);       whereExtra += ` AND d.currency = $${params.length}`; }
    if (date_from) { params.push(date_from);      whereExtra += ` AND d.created_at >= $${params.length}::date`; }
    if (date_to)   { params.push(date_to);        whereExtra += ` AND d.created_at < ($${params.length}::date + INTERVAL '1 day')`; }

    let statusClause = '';
    if (status === 'paid')    statusClause = ` AND d.status = 'paid'`;
    if (status === 'overdue') statusClause = ` AND d.status != 'paid' AND d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE`;
    if (status === 'active')  statusClause = ` AND d.status != 'paid' AND (d.due_date IS NULL OR d.due_date >= CURRENT_DATE)`;

    const whereClause = `WHERE d.business_id = $1 AND d.deleted_at IS NULL${whereExtra}${statusClause}`;

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total ${JOINS} ${whereClause}`, params),
      pool.query(
        `${WITH_COMPUTED} ${whereClause} ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data:       dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `${WITH_COMPUTED} WHERE d.id = $1 AND d.business_id = $2 AND d.deleted_at IS NULL`,
      [id, req.businessId]
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
      `SELECT id FROM clients WHERE id = $1 AND business_id = $2`,
      [client_id, req.businessId]
    );
    if (!owner.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const debtType = type === 'payable' ? 'payable' : 'receivable';
    const { rows } = await pool.query(
      `INSERT INTO debts (user_id, business_id, client_id, amount, currency, description, due_date, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.userId, req.businessId, client_id, amount, currency || 'TJS', description || null, due_date || null, debtType]
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
       WHERE id = $7 AND business_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [amount || null, currency || null, description ?? null, due_date || null, status || null, type || null, id, req.businessId]
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
      `UPDATE debts SET deleted_at = NOW()
       WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
      [id, req.businessId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
