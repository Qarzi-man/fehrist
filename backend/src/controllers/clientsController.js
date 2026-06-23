const pool = require('../config/db');

const CLIENT_SORT_MAP = {
  name:  'c.full_name',
  date:  'c.created_at',
  debts: 'COALESCE(dstats.active_count, 0)',
};

async function list(req, res, next) {
  try {
    const bid    = req.businessId;
    const search = (req.query.search ?? '').trim();
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const sortCol = CLIENT_SORT_MAP[req.query.sort] ?? 'c.full_name';
    const sortDir = req.query.order === 'desc' ? 'DESC' : 'ASC';

    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM clients
         WHERE business_id = $1 AND deleted_at IS NULL
           AND ($2 = '' OR full_name ILIKE '%' || $2 || '%' OR phone ILIKE '%' || $2 || '%')`,
        [bid, search]
      ),
      pool.query(
        `SELECT c.*,
           COALESCE(dstats.active_count, 0) AS active_debts_count,
           COALESCE(cstats.by_currency, '[]'::json) AS debts_by_currency
         FROM clients c
         LEFT JOIN (
           SELECT client_id, COUNT(*) AS active_count
           FROM debts
           WHERE status = 'active' AND deleted_at IS NULL AND business_id = $1
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
               AND d.business_id = $1
             GROUP BY d.currency
           ) cs
         ) cstats ON true
         WHERE c.business_id = $1 AND c.deleted_at IS NULL
           AND ($2 = '' OR c.full_name ILIKE '%' || $2 || '%' OR c.phone ILIKE '%' || $2 || '%')
         ORDER BY ${sortCol} ${sortDir}
         LIMIT $3 OFFSET $4`,
        [bid, search, limit, offset]
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
    const bid = req.businessId;

    const [clientResult, debtsResult] = await Promise.all([
      pool.query(
        `SELECT * FROM clients WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [id, bid]
      ),
      pool.query(
        `SELECT d.*,
           COALESCE(r.paid, 0)::numeric              AS total_paid,
           (d.amount - COALESCE(r.paid, 0))::numeric AS remaining,
           CASE
             WHEN d.status = 'paid' THEN 'paid'
             WHEN d.due_date IS NOT NULL AND d.due_date < CURRENT_DATE AND d.status != 'paid' THEN 'overdue'
             ELSE 'active'
           END AS computed_status
         FROM debts d
         LEFT JOIN (SELECT debt_id, SUM(amount) AS paid FROM repayments GROUP BY debt_id) r
           ON r.debt_id = d.id
         WHERE d.client_id = $1 AND d.business_id = $2 AND d.deleted_at IS NULL
         ORDER BY d.created_at DESC`,
        [id, bid]
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
      `INSERT INTO clients (user_id, business_id, full_name, phone, note)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, req.businessId, full_name, phone || null, note || notes || null]
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
       WHERE id = $4 AND business_id = $5 AND deleted_at IS NULL RETURNING *`,
      [full_name || null, phone || null, note ?? notes ?? null, id, req.businessId]
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
      `UPDATE clients SET deleted_at = NOW()
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
