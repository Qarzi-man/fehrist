const pool = require('../config/db');

const FREE_BUSINESSES  = 1;
const FREE_CLIENTS     = 50;
const FREE_SMS_MONTHLY = 10;

async function isSubscribed(businessId) {
  const { rows } = await pool.query(
    `SELECT subscription_status, subscription_expires_at FROM businesses WHERE id = $1`,
    [businessId]
  );
  if (!rows.length) return false;
  const b = rows[0];
  if (b.subscription_status !== 'active') return false;
  if (!b.subscription_expires_at) return true;
  return new Date(b.subscription_expires_at) > new Date();
}

async function checkBusinessLimit(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM businesses WHERE owner_id = $1`,
    [userId]
  );
  if (parseInt(rows[0].count) >= FREE_BUSINESSES) {
    return { allowed: false, error: 'business_limit', limit: FREE_BUSINESSES };
  }
  return { allowed: true };
}

async function checkClientLimit(businessId) {
  const sub = await isSubscribed(businessId);
  if (sub) return { allowed: true };

  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM clients WHERE business_id = $1 AND deleted_at IS NULL`,
    [businessId]
  );
  if (parseInt(rows[0].count) >= FREE_CLIENTS) {
    return { allowed: false, error: 'client_limit', limit: FREE_CLIENTS };
  }
  return { allowed: true };
}

async function checkAndDeductSms(businessId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO sms_balance (business_id) VALUES ($1) ON CONFLICT (business_id) DO NOTHING`,
      [businessId]
    );

    const { rows } = await client.query(
      `SELECT * FROM sms_balance WHERE business_id = $1 FOR UPDATE`,
      [businessId]
    );
    const bal = rows[0];

    const now = new Date();
    const resetAt = new Date(bal.month_reset_at);
    const isNewMonth =
      now.getFullYear() > resetAt.getFullYear() ||
      (now.getFullYear() === resetAt.getFullYear() && now.getMonth() > resetAt.getMonth());

    let monthlySent = parseInt(bal.monthly_sent);
    if (isNewMonth) {
      await client.query(
        `UPDATE sms_balance SET monthly_sent = 0, month_reset_at = NOW() WHERE business_id = $1`,
        [businessId]
      );
      monthlySent = 0;
    }

    if (monthlySent < FREE_SMS_MONTHLY) {
      await client.query(
        `UPDATE sms_balance SET monthly_sent = monthly_sent + 1, total_sent = total_sent + 1 WHERE business_id = $1`,
        [businessId]
      );
      await client.query('COMMIT');
      return { allowed: true, free: true };
    }

    const purchased = parseInt(bal.purchased_sms);
    if (purchased > 0) {
      await client.query(
        `UPDATE sms_balance SET purchased_sms = purchased_sms - 1, total_sent = total_sent + 1 WHERE business_id = $1`,
        [businessId]
      );
      await client.query('COMMIT');
      return { allowed: true, free: false };
    }

    await client.query('ROLLBACK');
    return { allowed: false, error: 'sms_limit', monthly_limit: FREE_SMS_MONTHLY };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { checkBusinessLimit, checkClientLimit, checkAndDeductSms, isSubscribed, FREE_BUSINESSES, FREE_CLIENTS, FREE_SMS_MONTHLY };
