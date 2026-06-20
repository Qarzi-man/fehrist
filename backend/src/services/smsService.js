const https = require('https');
const http = require('http');
const { randomUUID } = require('crypto');

// Payomchi SMS API — https://api.payomchi.tj/api/v1
const BASE_URL = process.env.PAYOMCHI_BASE_URL || 'https://api.payomchi.tj/api/v1';

async function sendSms(phone, message) {
  const apiKey = process.env.PAYOMCHI_API_KEY;
  const sender = process.env.PAYOMCHI_SENDER;

  if (!apiKey) {
    console.warn('[SMS] PAYOMCHI_API_KEY is not set — skipping SMS send');
    return { skipped: true, reason: 'no_api_key' };
  }

  // Strip leading "+" — Payomchi expects digits only (e.g. 992901234567)
  const cleanPhone = phone.replace(/^\+/, '');

  const bodyObj = { phone: cleanPhone, message, channel: 'sms' };
  if (sender) bodyObj.senderId = sender;

  const body = JSON.stringify(bodyObj);
  const url = `${BASE_URL}/user/sms`;
  const parsed = new URL(url);

  const options = {
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Api-Key': apiKey,
      'Idempotency-Key': randomUUID(),
    },
  };

  console.log(`[SMS] POST ${url} — phone=${cleanPhone}`);

  return new Promise((resolve, reject) => {
    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`[SMS] Response status=${res.statusCode} body=${data}`);
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 201) {
            console.error('[SMS] Unexpected status:', res.statusCode, result);
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
