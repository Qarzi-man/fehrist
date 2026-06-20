const https = require('https');
const http = require('http');

// Payomchi SMS API — https://api.payomchi.tj/api/v1
// Auth: Authorization: Bearer <PAYOMCHI_API_KEY>
// Request: POST /send, JSON body { phone, text, sender }
const BASE_URL = process.env.PAYOMCHI_BASE_URL || 'https://api.payomchi.tj/api/v1';

async function sendSms(phone, message) {
  const apiKey = process.env.PAYOMCHI_API_KEY;
  const sender = process.env.PAYOMCHI_SENDER || 'Daftarcha';

  if (!apiKey) {
    console.warn('[SMS] PAYOMCHI_API_KEY is not set — skipping SMS send');
    return { skipped: true, reason: 'no_api_key' };
  }

  const body = JSON.stringify({ phone, text: message, sender });
  const url = `${BASE_URL}/send`;
  const parsed = new URL(url);

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${apiKey}`,
    },
  };

  console.log(`[SMS] POST ${url} — phone=${phone} sender=${sender}`);

  return new Promise((resolve, reject) => {
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`[SMS] Response status=${res.statusCode} body=${data}`);
        try {
          const result = JSON.parse(data);
          if (result.error || result.status === 'error') {
            console.error('[SMS] API returned error:', result);
          }
          resolve(result);
        } catch {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Network error:', err.message, err.code);
      reject(err);
    });

    req.setTimeout(10000, () => {
      console.error('[SMS] Request timed out');
      req.destroy(new Error('SMS request timeout'));
    });

    req.write(body);
    req.end();
  });
}

async function sendOtp(phone, code) {
  const message = `Daftarcha: ваш код подтверждения — ${code}`;
  return sendSms(phone, message);
}

async function sendReminder(phone, clientName, amount, currency, dueDate) {
  const message = `Daftarcha: ${clientName}, у вас долг ${amount} ${currency}. Срок: ${dueDate}. Пожалуйста, оплатите.`;
  return sendSms(phone, message);
}

module.exports = { sendOtp, sendReminder, sendSms };
