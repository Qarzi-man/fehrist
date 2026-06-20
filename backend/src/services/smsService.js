const https = require('https');
const querystring = require('querystring');

async function sendSms(phone, message) {
  return new Promise((resolve, reject) => {
    const params = querystring.stringify({
      apikey: process.env.PAYMOCHI_API_KEY,
      sender: process.env.PAYMOCHI_SENDER,
      phone,
      message,
    });

    const options = {
      hostname: 'paymochi.com',
      path: `/api/sms/send?${params}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
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
