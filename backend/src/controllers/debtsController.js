const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const { status, client_id } = req.query;
    let query = `
      SELECT d.*, c.full_name AS client_name, c.phone AS client_phone
      FROM debts d
      JOIN clients c ON c.id = d.client_id
      WHERE d.user_id = $1`;
    const params = [req.user.userId];

    if (status) { params.push(status); query += ` AND d.status = $${params.length}`; }
    if (client_id) { params.push(client_id); query += ` AND d.client_id = $${params.length}`; }

    query += ` ORDER BY d.created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { client_id, amount, currency, description, due_date, type } = req.body;
    if (!client_id || !amount) return res.status(400).json({ error: 'client_id and amount required' });

    // Ensure client belongs to user
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
    const { amount, currency, description, due_date, status } = req.body;

    const { rows } = await pool.query(
      `UPDATE debts SET
         amount      = COALESCE($1, amount),
         currency    = COALESCE($2, currency),
         description = COALESCE($3, description),
         due_date    = COALESCE($4, due_date),
         status      = COALESCE($5, status)
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [amount, currency, description, due_date, status, id, req.user.userId]
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
      `DELETE FROM debts WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
