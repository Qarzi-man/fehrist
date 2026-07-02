const https  = require('https');
const cron   = require('node-cron');
const pool   = require('../config/db');

const BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID      = process.env.TELEGRAM_CHAT_ID;
// RSS threshold in MB — override via MEMORY_ALERT_MB env var (default 400 MB)
const MEM_ALERT_MB = parseInt(process.env.MEMORY_ALERT_MB || '400', 10);
// Don't repeat the same alert type within 2 hours
const COOLDOWN_MS  = 2 * 60 * 60 * 1000;

const lastAlertAt = { db: 0, memory: 0 };

function sendAlert(text) {
  if (!BOT_TOKEN || !CHAT_ID) return Promise.resolve();
  const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' });
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', () => resolve());
    req.setTimeout(10000, () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

async function checkHealth() {
  const now = Date.now();
  const ts  = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Dushanbe' });

  // ── 1. Database ──────────────────────────────────────────────────────────
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('[Health] DB check failed:', err.message);
    if (now - lastAlertAt.db > COOLDOWN_MS) {
      lastAlertAt.db = now;
      await sendAlert(
        `🔴 *Daftarcha: база данных недоступна*\n\n` +
        `Ошибка: \`${err.message}\`\n` +
        `Время: ${ts}`
      ).catch(() => {});
    }
  }

  // ── 2. Memory ────────────────────────────────────────────────────────────
  const { rss, heapUsed, heapTotal } = process.memoryUsage();
  const rssMb       = Math.round(rss      / 1024 / 1024);
  const heapUsedMb  = Math.round(heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(heapTotal / 1024 / 1024);

  if (rssMb > MEM_ALERT_MB) {
    console.warn(`[Health] High memory: RSS=${rssMb} MB (threshold=${MEM_ALERT_MB} MB)`);
    if (now - lastAlertAt.memory > COOLDOWN_MS) {
      lastAlertAt.memory = now;
      await sendAlert(
        `⚠️ *Daftarcha: высокое потребление памяти*\n\n` +
        `RSS: *${rssMb} MB* (порог: ${MEM_ALERT_MB} MB)\n` +
        `Heap used: ${heapUsedMb} MB / ${heapTotalMb} MB\n` +
        `Время: ${ts}`
      ).catch(() => {});
    }
  }
}

function startHealthMonitor() {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Health] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — health monitoring disabled');
    return;
  }
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', checkHealth);
  console.log(`[Health] Monitor started — checks every 30 min, memory threshold: ${MEM_ALERT_MB} MB RSS`);
}

module.exports = { startHealthMonitor };
