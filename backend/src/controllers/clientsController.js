const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, COALESCE(SUM(d.amount), 0) AS total_debt
       FROM clients c
       LEFT JOIN debts d ON d.client_id = c.id AND d.status = 'active'
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.full_name`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { full_name, phone, note } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name required' });

    const { rows } = await pool.query(
      `INSERT INTO clients (user_id, full_name, phone, note) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.userId, full_name, phone || null, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { full_name, phone, note } = req.body;

    const { rows } = await pool.query(
      `UPDATE clients SET full_name = COALESCE($1, full_name),
                         phone = COALESCE($2, phone),
                         note  = COALESCE($3, note)
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [full_name, phone, note, id, req.user.userId]
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
      `DELETE FROM clients WHERE id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
