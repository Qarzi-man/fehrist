const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    console.log('[requireAdmin] req.user from JWT:', req.user);
    const { rows } = await pool.query(
      'SELECT id, is_admin, is_blocked FROM users WHERE id = $1',
      [req.user.userId]
    );
    console.log('[requireAdmin] DB row for userId', req.user.userId, ':', rows[0] ?? 'NOT FOUND');
    if (!rows.length || !rows[0].is_admin) {
      console.log('[requireAdmin] DENIED — is_admin =', rows[0]?.is_admin ?? 'user not found');
      return res.status(403).json({ error: 'Admin access required' });
    }
    console.log('[requireAdmin] GRANTED for userId', req.user.userId);
    next();
  } catch (err) {
    console.error('[requireAdmin] error:', err);
    next(err);
  }
};
