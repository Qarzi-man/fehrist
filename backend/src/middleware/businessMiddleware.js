const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const rawId = req.headers['x-business-id'];
    const reqId = rawId ? parseInt(rawId) : null;

    if (reqId) {
      const { rows } = await pool.query(
        'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
        [reqId, req.user.userId]
      );
      if (rows.length) {
        req.businessId = reqId;
        return next();
      }
    }

    // Fall back to user's first business
    const { rows } = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1',
      [req.user.userId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No business found. Please create a business.' });
    }
    req.businessId = rows[0].id;
    next();
  } catch (err) {
    next(err);
  }
};
