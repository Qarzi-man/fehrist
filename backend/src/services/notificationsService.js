const pool = require('../config/db');

async function createNotification({ userId, businessId = null, type, title, body = null, data = null }) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, business_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, businessId, type, title, body, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    console.error('[Notifications] create error:', err.message);
  }
}

module.exports = { createNotification };
