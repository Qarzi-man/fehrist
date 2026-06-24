const pool = require('../config/db');
const { createNotification } = require('./notificationsService');

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function checkExpiringSubscriptions() {
  console.log('[SubscriptionReminder] running check...');
  try {
    // Businesses expiring in 2–4 days (covers the "3 days" window)
    // NOT EXISTS: skip if a subscription_expiring notification was already sent in last 24h
    const { rows } = await pool.query(`
      SELECT b.id AS business_id, b.owner_id AS user_id,
             b.name AS business_name, b.subscription_expires_at
      FROM businesses b
      WHERE b.subscription_status = 'active'
        AND b.subscription_expires_at >= NOW() + INTERVAL '2 days'
        AND b.subscription_expires_at <  NOW() + INTERVAL '4 days'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id      = b.owner_id
            AND n.business_id  = b.id
            AND n.type         = 'subscription_expiring'
            AND n.created_at  > NOW() - INTERVAL '24 hours'
        )
    `);

    for (const row of rows) {
      const daysLeft = Math.ceil(
        (new Date(row.subscription_expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      );
      await createNotification({
        userId:     row.user_id,
        businessId: row.business_id,
        type:       'subscription_expiring',
        title:      `Подписка истекает через ${daysLeft} дня`,
        body:       'Ваша подписка Daftarcha истекает через 3 дня. Продлите на странице Тарифы.',
        data:       { business_id: row.business_id, expires_at: row.subscription_expires_at },
      });
      console.log(`[SubscriptionReminder] notified user=${row.user_id} biz=${row.business_id} (${daysLeft}d left)`);
    }

    console.log(`[SubscriptionReminder] done — ${rows.length} notification(s) sent.`);
  } catch (err) {
    console.error('[SubscriptionReminder] error:', err.message);
  }
}

function startSubscriptionReminder() {
  checkExpiringSubscriptions();
  setInterval(checkExpiringSubscriptions, INTERVAL_MS);
}

module.exports = { startSubscriptionReminder };
