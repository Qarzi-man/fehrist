const pool = require('../config/db');
const { createNotification } = require('../services/notificationsService');

async function getStats(req, res, next) {
  try {
    const [
      totalUsers, totalBusinesses, totalDebts,
      newUsers7d, newUsers30d,
      dau, mau,
      smsToday, smsMonth,
      mrr, conversionRes,
      dailyReg, recentPayments,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM businesses'),
      pool.query("SELECT COUNT(*) FROM debts WHERE deleted_at IS NULL"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days'"),
      pool.query(`SELECT COUNT(DISTINCT uid) FROM (
        SELECT user_id AS uid FROM debts  WHERE created_at > NOW() - INTERVAL '24 hours'
        UNION ALL SELECT user_id AS uid FROM clients WHERE created_at > NOW() - INTERVAL '24 hours'
        UNION ALL SELECT d.user_id AS uid FROM repayments r JOIN debts d ON d.id = r.debt_id WHERE r.paid_at > NOW() - INTERVAL '24 hours'
      ) t`),
      pool.query(`SELECT COUNT(DISTINCT uid) FROM (
        SELECT user_id AS uid FROM debts  WHERE created_at > NOW() - INTERVAL '30 days'
        UNION ALL SELECT user_id AS uid FROM clients WHERE created_at > NOW() - INTERVAL '30 days'
        UNION ALL SELECT d.user_id AS uid FROM repayments r JOIN debts d ON d.id = r.debt_id WHERE r.paid_at > NOW() - INTERVAL '30 days'
      ) t`),
      pool.query("SELECT COUNT(*) FROM sms_logs WHERE created_at::date = CURRENT_DATE"),
      pool.query("SELECT COUNT(*) FROM sms_logs WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS mrr FROM payment_requests WHERE status = 'approved' AND DATE_TRUNC('month', approved_at) = DATE_TRUNC('month', NOW())"),
      pool.query("SELECT ROUND(COUNT(*) FILTER (WHERE subscription_status = 'active') * 100.0 / NULLIF(COUNT(*), 0), 1) AS rate FROM businesses"),
      pool.query(`
        SELECT TO_CHAR(s.day, 'YYYY-MM-DD') AS date, COALESCE(COUNT(u.id), 0)::int AS count
        FROM generate_series(NOW()::date - 29, NOW()::date, '1 day'::interval) AS s(day)
        LEFT JOIN users u ON u.created_at::date = s.day
        GROUP BY s.day ORDER BY s.day
      `),
      pool.query(`
        SELECT pr.*, u.full_name AS user_name, u.phone AS user_phone, b.name AS business_name
        FROM payment_requests pr
        JOIN users u ON u.id = pr.user_id
        JOIN businesses b ON b.id = pr.business_id
        WHERE pr.status = 'pending'
        ORDER BY pr.created_at DESC LIMIT 5
      `),
    ]);

    res.json({
      totalUsers:            parseInt(totalUsers.rows[0].count),
      totalBusinesses:       parseInt(totalBusinesses.rows[0].count),
      totalDebts:            parseInt(totalDebts.rows[0].count),
      newUsers7d:            parseInt(newUsers7d.rows[0].count),
      newUsers30d:           parseInt(newUsers30d.rows[0].count),
      dau:                   parseInt(dau.rows[0].count),
      mau:                   parseInt(mau.rows[0].count),
      smsToday:              parseInt(smsToday.rows[0].count),
      smsMonth:              parseInt(smsMonth.rows[0].count),
      mrr:                   parseFloat(mrr.rows[0].mrr),
      conversionRate:        parseFloat(conversionRes.rows[0].rate ?? 0),
      dailyRegistrations:    dailyReg.rows,
      recentPendingPayments: recentPayments.rows,
    });
  } catch (err) { next(err); }
}

async function getUsers(req, res, next) {
  try {
    const search = req.query.search || '';
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const pat    = `%${search}%`;

    const [countRes, dataRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT u.id) FROM users u WHERE u.phone ILIKE $1 OR COALESCE(u.full_name,'') ILIKE $1`,
        [pat]
      ),
      pool.query(
        `SELECT u.id, u.phone, u.full_name, u.created_at, u.is_blocked, u.is_admin,
           COUNT(b.id)::int AS business_count
         FROM users u LEFT JOIN businesses b ON b.owner_id = u.id
         WHERE u.phone ILIKE $1 OR COALESCE(u.full_name,'') ILIKE $1
         GROUP BY u.id ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`,
        [pat, limit, offset]
      ),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

async function blockUser(req, res, next) {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    const { rows } = await pool.query(
      'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, phone, full_name, is_blocked',
      [!!blocked, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function getBusinesses(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let filterClause = '';
    if (filter === 'expiring') {
      filterClause = `AND b.subscription_status = 'active'
        AND b.subscription_expires_at >= NOW()
        AND b.subscription_expires_at <= NOW() + INTERVAL '7 days'`;
    } else if (filter === 'expired') {
      filterClause = `AND b.subscription_status = 'active'
        AND b.subscription_expires_at IS NOT NULL
        AND b.subscription_expires_at < NOW()`;
    }

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM businesses b WHERE 1=1 ${filterClause}`),
      pool.query(`
        SELECT b.id, b.name, b.subscription_status, b.subscription_expires_at, b.created_at,
          u.full_name AS owner_name, u.phone AS owner_phone,
          (SELECT COUNT(*) FROM clients WHERE business_id=b.id AND deleted_at IS NULL)::int AS client_count,
          (SELECT COUNT(*) FROM debts   WHERE business_id=b.id AND deleted_at IS NULL)::int AS debt_count,
          (SELECT COUNT(*) FROM business_members WHERE business_id=b.id AND status='active')::int AS member_count
        FROM businesses b JOIN users u ON u.id = b.owner_id
        WHERE 1=1 ${filterClause}
        ORDER BY b.subscription_expires_at ASC NULLS LAST, b.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

async function getExpiringSubscriptions(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.name, b.subscription_expires_at,
             u.full_name AS owner_name, u.phone AS owner_phone,
             GREATEST(0, EXTRACT(DAY FROM (b.subscription_expires_at - NOW()))::int) AS days_left
      FROM businesses b
      JOIN users u ON u.id = b.owner_id
      WHERE b.subscription_status = 'active'
        AND b.subscription_expires_at >= NOW()
        AND b.subscription_expires_at <= NOW() + INTERVAL '7 days'
      ORDER BY b.subscription_expires_at ASC
    `);
    res.json({ data: rows, count: rows.length });
  } catch (err) { next(err); }
}

async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    const { subscription_status, subscription_expires_at } = req.body;
    const { rows } = await pool.query(
      `UPDATE businesses SET subscription_status=$1, subscription_expires_at=$2 WHERE id=$3 RETURNING *`,
      [subscription_status, subscription_expires_at || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Business not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

async function getPayments(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const VALID = ['pending', 'approved', 'rejected', 'cancelled'];
    const statusFilter = VALID.includes(req.query.status) ? req.query.status : null;

    const params = [];
    let statusClause = '';
    if (statusFilter) { params.push(statusFilter); statusClause = `AND pr.status = $${params.length}`; }
    params.push(limit, offset);
    const li = params.length - 1;
    const oi = params.length;

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM payment_requests pr WHERE 1=1 ${statusClause}`,
        statusFilter ? [statusFilter] : []),
      pool.query(`
        SELECT pr.*, u.full_name AS user_name, u.phone AS user_phone, b.name AS business_name
        FROM payment_requests pr
        JOIN users u ON u.id = pr.user_id
        JOIN businesses b ON b.id = pr.business_id
        WHERE 1=1 ${statusClause}
        ORDER BY pr.created_at DESC LIMIT $${li} OFFSET $${oi}
      `, params),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

async function approvePayment(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT pr.* FROM payment_requests pr WHERE pr.id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const pr = rows[0];
    if (pr.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    if (pr.type === 'sms_package' && pr.sms_count) {
      await pool.query(
        `INSERT INTO sms_balance (business_id, purchased_sms) VALUES ($1, $2)
         ON CONFLICT (business_id) DO UPDATE SET purchased_sms = sms_balance.purchased_sms + $2`,
        [pr.business_id, pr.sms_count]
      );
    } else if (pr.type === 'subscription') {
      await pool.query(
        `UPDATE businesses SET subscription_status='active', subscription_expires_at=NOW()+INTERVAL '30 days' WHERE id=$1`,
        [pr.business_id]
      );
    }

    await pool.query(
      `UPDATE payment_requests SET status='approved', approved_at=NOW() WHERE id=$1`, [id]
    );

    createNotification({
      userId: pr.user_id,
      businessId: pr.business_id,
      type: 'payment_received',
      title: pr.type === 'sms_package'
        ? `SMS пакет активирован: +${pr.sms_count} SMS`
        : 'Подписка активирована на 30 дней',
      body: `Заявка #${pr.id} одобрена`,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
}

async function rejectPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { rows } = await pool.query(
      `UPDATE payment_requests SET status='rejected', note=$1 WHERE id=$2 AND status='pending' RETURNING *`,
      [reason || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found or already processed' });
    const pr = rows[0];
    createNotification({
      userId: pr.user_id,
      businessId: pr.business_id,
      type: 'payment_received',
      title: 'Заявка на оплату отклонена',
      body: reason ? `Причина: ${reason}` : 'Свяжитесь с поддержкой: niyatorzuzoda@gmail.com',
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function cancelPayment(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const { rows } = await client.query(
      `SELECT * FROM payment_requests WHERE id = $1`, [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const pr = rows[0];
    if (pr.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved requests can be cancelled' });
    }

    await client.query('BEGIN');

    // Rollback the effect of the approval
    if (pr.type === 'sms_package' && pr.sms_count) {
      await client.query(
        `UPDATE sms_balance
         SET purchased_sms = GREATEST(0, purchased_sms - $1)
         WHERE business_id = $2`,
        [pr.sms_count, pr.business_id]
      );
    } else if (pr.type === 'subscription') {
      await client.query(
        `UPDATE businesses
         SET subscription_status = 'free', subscription_expires_at = NULL
         WHERE id = $1`,
        [pr.business_id]
      );
    }

    await client.query(
      `UPDATE payment_requests
       SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1
       WHERE id = $2`,
      [adminId, id]
    );

    await client.query('COMMIT');

    createNotification({
      userId: pr.user_id,
      businessId: pr.business_id,
      type: 'payment_received',
      title: pr.type === 'sms_package'
        ? `SMS пакет (${pr.sms_count} шт.) отменён`
        : 'Подписка PRO отменена',
      body: `Заявка #${pr.id} была отменена администратором`,
    });

    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

async function getSmsLogs(req, res, next) {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { dateFrom, dateTo } = req.query;

    const params = [];
    let where = '';
    if (dateFrom) { params.push(dateFrom); where += ` AND sl.created_at >= $${params.length}::date`; }
    if (dateTo)   { params.push(dateTo);   where += ` AND sl.created_at < ($${params.length}::date + INTERVAL '1 day')`; }

    const cParams = [...params];
    const li = params.length + 1;
    const oi = params.length + 2;
    const dParams = [...params, limit, offset];

    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM sms_logs sl WHERE 1=1${where}`, cParams),
      pool.query(`
        SELECT sl.id, sl.phone, sl.message, sl.template_key, sl.status, sl.created_at,
          b.name AS business_name
        FROM sms_logs sl JOIN businesses b ON b.id = sl.business_id
        WHERE 1=1${where}
        ORDER BY sl.created_at DESC LIMIT $${li} OFFSET $${oi}
      `, dParams),
    ]);

    const total = parseInt(countRes.rows[0].count);
    res.json({ data: dataRes.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

async function getRevenue(req, res, next) {
  try {
    const period   = req.query.period === 'week' ? 'week' : req.query.period === 'day' ? 'day' : 'month';
    const trunc    = period === 'day' ? 'hour' : 'day';
    const interval = period === 'day' ? '24 hours' : period === 'week' ? '7 days' : '30 days';

    const { rows } = await pool.query(`
      SELECT DATE_TRUNC('${trunc}', approved_at)::date AS date,
             type,
             COALESCE(SUM(amount), 0)::numeric AS revenue,
             COUNT(*)::int AS count
      FROM payment_requests
      WHERE status = 'approved' AND approved_at > NOW() - INTERVAL '${interval}'
      GROUP BY 1, 2 ORDER BY 1, 2
    `);

    const total              = rows.reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
    const total_subscription = rows.filter((r) => r.type === 'subscription').reduce((s, r) => s + parseFloat(r.revenue || 0), 0);
    const total_sms          = rows.filter((r) => r.type === 'sms').reduce((s, r) => s + parseFloat(r.revenue || 0), 0);

    res.json({ data: rows, total, total_subscription, total_sms });
  } catch (err) { next(err); }
}

module.exports = { getStats, getUsers, blockUser, getBusinesses, updatePlan, getPayments, approvePayment, rejectPayment, cancelPayment, getSmsLogs, getRevenue, getExpiringSubscriptions };
