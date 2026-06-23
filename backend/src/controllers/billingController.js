const pool = require('../config/db');
const { FREE_SMS_MONTHLY } = require('../services/limitsService');

async function getStatus(req, res, next) {
  try {
    const businessId = req.businessId;
    const [bizRes, balRes] = await Promise.all([
      pool.query(
        `SELECT subscription_status, subscription_expires_at FROM businesses WHERE id = $1`,
        [businessId]
      ),
      pool.query(`SELECT * FROM sms_balance WHERE business_id = $1`, [businessId]),
    ]);

    const biz = bizRes.rows[0] || {};
    const bal = balRes.rows[0] || { monthly_sent: 0, purchased_sms: 0, total_sent: 0 };

    const monthlySent = parseInt(bal.monthly_sent) || 0;
    const purchased   = parseInt(bal.purchased_sms) || 0;

    res.json({
      subscription_status:     biz.subscription_status || 'free',
      subscription_expires_at: biz.subscription_expires_at || null,
      monthly_sent:            monthlySent,
      purchased_sms:           purchased,
      total_sent:              parseInt(bal.total_sent) || 0,
      free_sms_limit:          FREE_SMS_MONTHLY,
      free_sms_remaining:      Math.max(0, FREE_SMS_MONTHLY - monthlySent),
    });
  } catch (err) {
    next(err);
  }
}

async function createRequest(req, res, next) {
  try {
    const { type, amount, sms_count, note } = req.body;
    if (!type || !amount) return res.status(400).json({ error: 'type and amount required' });

    const { rows } = await pool.query(
      `INSERT INTO payment_requests (business_id, user_id, type, amount, sms_count, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.businessId, req.user.userId, type, amount, sms_count || null, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function getRequests(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM payment_requests WHERE business_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.businessId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStatus, createRequest, getRequests };
