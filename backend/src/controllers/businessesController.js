const pool = require('../config/db');
const { checkBusinessLimit } = require('../services/limitsService');

async function list(req, res, next) {
  try {
    const uid = req.user.userId;
    const { rows } = await pool.query(`
      SELECT b.*, 'owner' AS my_role FROM businesses b WHERE b.owner_id = $1
      UNION ALL
      SELECT b.*, bm.role AS my_role FROM businesses b
        JOIN business_members bm ON bm.business_id = b.id
        WHERE bm.user_id = $1 AND bm.status = 'active'
      ORDER BY created_at
    `, [uid]);
    res.json(rows);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });

    const limitCheck = await checkBusinessLimit(req.user.userId);
    if (!limitCheck.allowed) return res.status(402).json(limitCheck);

    const { rows } = await pool.query(
      'INSERT INTO businesses (owner_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name, logo } = req.body;

    const updates = [];
    const params = [];
    let i = 1;

    if (name && name.trim()) { updates.push(`name = $${i++}`); params.push(name.trim()); }
    if (logo !== undefined)  { updates.push(`logo = $${i++}`); params.push(logo || null); }

    if (!updates.length) return res.status(400).json({ error: 'name required' });

    params.push(id, req.user.userId);
    const { rows } = await pool.query(
      `UPDATE businesses SET ${updates.join(', ')} WHERE id = $${i} AND owner_id = $${i + 1} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const biz = await pool.query(
      'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
      [id, req.user.userId]
    );
    if (!biz.rows.length) return res.status(404).json({ error: 'Not found' });

    const active = await pool.query(
      `SELECT COUNT(*) FROM debts WHERE business_id = $1 AND status = 'active' AND deleted_at IS NULL`,
      [id]
    );
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(409).json({ error: 'Cannot delete: has active debts' });
    }

    await pool.query('DELETE FROM businesses WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove };
