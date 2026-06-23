const pool = require('../config/db');

async function list(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const uid = req.user.userId;

    const [countRes, unreadRes, dataRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1', [uid]),
      pool.query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE', [uid]),
      pool.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [uid, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({
      data:       dataRes.rows,
      total,
      unread:     parseInt(unreadRes.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.userId]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
}

module.exports = { list, markRead, markAllRead };
