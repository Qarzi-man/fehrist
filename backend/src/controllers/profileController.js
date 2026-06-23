const pool = require('../config/db');

async function getProfile(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, phone, full_name, avatar FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const { full_name, avatar } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (full_name !== undefined) { updates.push(`full_name = $${i++}`); params.push(full_name || null); }
    if (avatar    !== undefined) { updates.push(`avatar = $${i++}`);    params.push(avatar    || null); }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.user.userId);
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, phone, full_name, avatar`,
      params
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function deleteAccount(req, res, next) {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.userId]);
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateProfile, deleteAccount };
