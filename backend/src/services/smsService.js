const https = require('https');
const http = require('http');
const querystring = require('querystring');

// Paymochi (Payomchi) SMS API
// Docs: https://paymochi.com — adjust BASE_URL if your account uses a different endpoint
const BASE_URL = process.env.PAYMOCHI_BASE_URL || 'https://paymochi.com';

async function sendSms(phone, message) {
  const apiKey = process.env.PAYMOCHI_API_KEY;
  const sender = process.env.PAYMOCHI_SENDER || 'Daftarcha';

  if (!apiKey) {
    console.warn('[SMS] PAYMOCHI_API_KEY is not set — skipping SMS send');
    return { skipped: true, reason: 'no_api_key' };
  }

  const params = querystring.stringify({ apikey: apiKey, sender, phone, message });
  const url = `${BASE_URL}/api/sms/send?${params}`;

  console.log(`[SMS] Sending to ${phone} via ${BASE_URL}`);

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;

    const req = lib.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        console.log(`[SMS] Response status=${res.statusCode} body=${data}`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.error || parsed.status === 'error') {
            console.error('[SMS] API returned error:', parsed);
          }
          resolve(parsed);
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
