const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const uid = req.user.userId;
    const search = (req.query.search ?? '').trim();
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM clients
         WHERE user_id = $1 AND deleted_at IS NULL
           AND ($2 = '' OR full_name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')`,
        [uid, search]
      ),
      pool.query(
        `SELECT c.*,
           COALESCE(dstats.active_count, 0) AS active_debts_count,
           COALESCE(cstats.by_currency, '[]'::json) AS debts_by_currency
         FROM clients c
         LEFT JOIN (
           SELECT client_id, COUNT(*) AS active_count
           FROM debts
           WHERE status = 'active' AND deleted_at IS NULL
           GROUP BY client_id
         ) dstats ON dstats.client_id = c.id
         LEFT JOIN LATERAL (
           SELECT json_agg(row_to_json(cs)) AS by_currency
           FROM (
             SELECT d.currency,
               SUM(CASE WHEN d.type = 'receivable'
                   THEN GREATEST(d.amount - COALESCE(r.paid, 0), 0) ELSE 0 END) AS receivable,
               SUM(CASE WHEN d.type = 'payable'
                   THEN GREATEST(d.amount - COALESCE(r.paid, 0), 0) ELSE 0 END) AS payable
             FROM debts d
             LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
               ON r.debt_id = d.id
             WHERE d.client_id = c.id AND d.status = 'active' AND d.deleted_at IS NULL
             GROUP BY d.currency
           ) cs
         ) cstats ON true
         WHERE c.user_id = $1 AND c.deleted_at IS NULL
           AND ($2 = '' OR c.full_name ILIKE '%' || $2 || '%' OR c.phone ILIKE '%' || $2 || '%')
         ORDER BY c.full_name
         LIMIT $3 OFFSET $4`,
        [uid, search, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);
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
    const uid = req.user.userId;

    const [clientResult, debtsResult] = await Promise.all([
      pool.query(
        `SELECT * FROM clients WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [id, uid]
      ),
      pool.query(
        `SELECT d.*,
           COALESCE(r.paid, 0)::numeric           AS total_paid,
           (d.amount - COALESCE(r.paid, 0))::numeric AS remaining,
           CASE
             WHEN d.status = 'paid' THEN 'paid'
             WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE AND d.status != 'paid' THEN 'overdue'
             ELSE 'active'
           END AS computed_status
         FROM debts d
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
           ON r.debt_id = d.id
         WHERE d.client_id = $1 AND d.user_id = $2 AND d.deleted_at IS NULL
         ORDER BY d.created_at DESC`,
        [id, uid]
      ),
    ]);

    if (!clientResult.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ ...clientResult.rows[0], debts: debtsResult.rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { full_name, phone, note, notes } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name required' });

    const { rows } = await pool.query(
      `INSERT INTO clients (user_id, full_name, phone, note) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.userId, full_name, phone || null, note || notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, phone, note, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE clients SET
         full_name = COALESCE($1, full_name),
         phone     = COALESCE($2, phone),
         note      = COALESCE($3, note)
       WHERE id = $4 AND user_id = $5 AND deleted_at IS NULL RETURNING *`,
      [full_name || null, phone || null, note ?? notes ?? null, id, req.user.userId]
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
      `UPDATE clients SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, req.user.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
