const pool = require('../config/db');
const { sendSms: sendViaSms } = require('../services/smsService');
const { checkAndDeductSms } = require('../services/limitsService');

async function send(req, res, next) {
  try {
    const { debt_id, phone, message, template_key } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });

    const smsCheck = await checkAndDeductSms(req.businessId);
    if (!smsCheck.allowed) return res.status(402).json(smsCheck);

    let client_id = null;
    if (debt_id) {
      const { rows } = await pool.query(
        'SELECT client_id FROM debts WHERE id = $1 AND business_id = $2 AND deleted_at IS NULL',
        [debt_id, req.businessId]
      );
      if (rows.length) client_id = rows[0].client_id;
    }

    let status = 'sent';
    try {
      const result = await sendViaSms(phone, message);
      if (result && result.skipped) status = 'skipped';
    } catch (smsErr) {
      console.error('[SMS Controller] Send error:', smsErr.message);
      status = 'failed';
    }

    const { rows } = await pool.query(
      `INSERT INTO sms_logs (business_id, debt_id, client_id, phone, message, template_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.businessId, debt_id || null, client_id, phone, message, template_key || null, status]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function logs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM sms_logs WHERE business_id = $1', [req.businessId]),
      pool.query(
        `SELECT sl.*, c.full_name AS client_name
         FROM sms_logs sl
         LEFT JOIN clients c ON c.id = sl.client_id
         WHERE sl.business_id = $1
         ORDER BY sl.created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.businessId, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({ data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

module.exports = { send, logs };
