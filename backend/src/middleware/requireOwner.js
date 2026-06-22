const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
      [req.businessId, req.user.userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Owner only' });
    next();
  } catch (err) {
    next(err);
  }
};
