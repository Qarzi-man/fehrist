const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendOtp } = require('../services/smsService');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(userId, isAdmin = false) {
  void isAdmin;
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/send-otp
async function sendOtpHandler(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Save OTP to DB first — this must succeed
    await pool.query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [phone, code, expiresAt]
    );

    // SMS is non-fatal: failure logs the code so you can still test
    try {
      await sendOtp(phone, code);
      console.log(`[OTP] Sent to ${phone}`);
    } catch (smsErr) {
      console.error(`[OTP] SMS failed for ${phone}:`, smsErr.message);
      console.log(`[OTP] Code for manual testing — phone=${phone} code=${code}`);
    }

    res.json({ message: 'OTP sent' });
  } catch (err) {
    // Only DB errors reach here
    console.error('[OTP] DB error:', err);
    next(err);
  }
}

// POST /api/auth/register
async function register(req, res, next) {
  const client = await pool.connect();
  try {
    const { phone, full_name, business_name, email, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'phone and otp required' });
    }

    // Verify OTP
    const { rows } = await client.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // Mark OTP used
    await client.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [rows[0].id]);

    // Check duplicate
    const exists = await client.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (exists.rows.length) return res.status(409).json({ error: 'Phone already registered' });

    await client.query('BEGIN');

    const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const userResult = await client.query(
      `INSERT INTO users (phone, password, full_name, email)
       VALUES ($1, $2, $3, $4) RETURNING id, phone, full_name, email`,
      [phone, hash, full_name || null, email?.trim() || null]
    );
    const user = userResult.rows[0];

    const bizName = (business_name && business_name.trim())
      ? business_name.trim()
      : (full_name && full_name.trim()) || 'Мой бизнес';
    await client.query(
      `INSERT INTO businesses (owner_id, name) VALUES ($1, $2)`,
      [user.id, bizName]
    );

    // Link any phone-based pending invites to this new user
    // Skip if the user is already a member of that business (avoid unique conflict)
    await client.query(`
      UPDATE business_members bm
      SET user_id = $1
      WHERE bm.phone = $2
        AND bm.user_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM business_members bm2
          WHERE bm2.business_id = bm.business_id AND bm2.user_id = $1
        )
    `, [user.id, phone]);

    await client.query('COMMIT');
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'phone and otp required' });

    // Check user first — if not found, return without consuming OTP so register can reuse it
    const { rows } = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    if (!rows.length) return res.status(404).json({ error: 'user_not_found' });

    // Verify OTP
    const otpResult = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );
    if (!otpResult.rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [otpResult.rows[0].id]);

    if (rows[0].is_blocked) {
      return res.status(403).json({ error: 'Аккаунт заблокирован. Свяжитесь с поддержкой: niyatorzuzoda@gmail.com' });
    }

    const { id, phone: p, full_name, is_admin } = rows[0];
    console.log('[login] userId:', id, 'phone:', p, 'is_admin:', is_admin);
    res.json({ token: signToken(id, !!is_admin), user: { id, phone: p, full_name, is_admin: !!is_admin } });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, phone, full_name, is_admin, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = { ...rows[0], is_admin: !!rows[0].is_admin };
    console.log('[me] userId:', user.id, 'is_admin:', user.is_admin);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtpHandler, register, login, me };
