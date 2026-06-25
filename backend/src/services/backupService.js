const { execFile } = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');
const cron = require('node-cron');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

function formatBytes(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tgRequest(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'api.telegram.org', port: 443, path, method, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); } });
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Telegram request timeout')));
    if (body) req.write(body);
    req.end();
  });
}

function sendTelegramMessage(text) {
  if (!BOT_TOKEN || !CHAT_ID) return Promise.resolve();
  const body = JSON.stringify({ chat_id: CHAT_ID, text });
  return tgRequest(
    `/bot${BOT_TOKEN}/sendMessage`,
    'POST',
    { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body
  );
}

function sendTelegramFile(filePath, caption) {
  if (!BOT_TOKEN || !CHAT_ID) return Promise.resolve();

  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const boundary = `----BackupBoundary${Date.now()}`;
  const CRLF = '\r\n';

  const parts = Buffer.concat([
    Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="chat_id"${CRLF}${CRLF}${CHAT_ID}${CRLF}`),
    Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="caption"${CRLF}${CRLF}${caption}${CRLF}`),
    Buffer.from(`--${boundary}${CRLF}Content-Disposition: form-data; name="document"; filename="${fileName}"${CRLF}Content-Type: application/octet-stream${CRLF}${CRLF}`),
    fileData,
    Buffer.from(`${CRLF}--${boundary}--${CRLF}`),
  ]);

  return tgRequest(
    `/bot${BOT_TOKEN}/sendDocument`,
    'POST',
    { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': parts.length },
    parts
  );
}

async function runBackup() {
  const date    = new Date().toISOString().split('T')[0];
  const tmpFile = `/tmp/backup-${date}.sql`;

  console.log(`[Backup] Starting pg_dump → ${tmpFile}`);

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL is not set');

    await new Promise((resolve, reject) => {
      execFile('pg_dump', [dbUrl, '-f', tmpFile], { timeout: 120000 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const size    = fs.statSync(tmpFile).size;
    const caption = `✅ Daftarcha DB backup - ${date} - ${formatBytes(size)}`;
    console.log(`[Backup] Dump ready (${formatBytes(size)}), sending to Telegram...`);

    await sendTelegramFile(tmpFile, caption);
    console.log('[Backup] Sent to Telegram successfully');
  } catch (err) {
    console.error('[Backup] Failed:', err.message);
    await sendTelegramMessage(`❌ Backup failed: ${err.message}`).catch(() => {});
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

function startBackupService() {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Backup] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — backup disabled');
    return;
  }
  cron.schedule('0 2 * * *', runBackup, { timezone: 'Asia/Dushanbe' });
  console.log('[Backup] Daily backup scheduled at 02:00 Asia/Dushanbe');
}

module.exports = { startBackupService, runBackup };
