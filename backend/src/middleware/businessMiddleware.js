const pool = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    const rawId = req.headers['x-business-id'];
    const reqId = rawId ? parseInt(rawId) : null;
    const userId = req.user.userId;

    if (reqId) {
      const ownRes = await pool.query(
        'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2',
        [reqId, userId]
      );
      if (ownRes.rows.length) {
        req.businessId = reqId;
        return next();
      }
      const memRes = await pool.query(
        "SELECT id FROM business_members WHERE business_id = $1 AND user_id = $2 AND status = 'active'",
        [reqId, userId]
      );
      if (memRes.rows.length) {
        req.businessId = reqId;
        return next();
      }
    }

    // Fall back to first owned business
    const ownFallback = await pool.query(
      'SELECT id FROM businesses WHERE owner_id = $1 ORDER BY created_at LIMIT 1',
      [userId]
    );
    if (ownFallback.rows.length) {
      req.businessId = ownFallback.rows[0].id;
      return next();
    }

    // Fall back to first active membership
    const memFallback = await pool.query(
      "SELECT business_id FROM business_members WHERE user_id = $1 AND status = 'active' ORDER BY created_at LIMIT 1",
      [userId]
    );
    if (memFallback.rows.length) {
      req.businessId = memFallback.rows[0].business_id;
      return next();
    }

    return res.status(404).json({ error: 'No business found. Please create a business.' });
  } catch (err) {
    next(err);
  }
};
