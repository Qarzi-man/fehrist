const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (!rows.length || !rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
};
