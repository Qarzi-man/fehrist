const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOtp } = require('../services/smsService');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/send-otp
async function sendOtpHandler(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await pool.query(
      `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)`,
      [phone, code, expiresAt]
    );

    await sendOtp(phone, code);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { phone, password, full_name, otp } = req.body;
    if (!phone || !password || !otp) {
      return res.status(400).json({ error: 'phone, password and otp required' });
    }

    // Verify OTP
    const { rows } = await pool.query(
      `SELECT * FROM otp_codes
       WHERE phone = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, otp]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired OTP' });

    // Mark OTP used
    await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [rows[0].id]);

    // Check duplicate
    const exists = await pool.query(`SELECT id FROM users WHERE phone = $1`, [phone]);
    if (exists.rows.length) return res.status(409).json({ error: 'Phone already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await pool.query(
      `INSERT INTO users (phone, password, full_name) VALUES ($1, $2, $3) RETURNING id, phone, full_name`,
      [phone, hash, full_name || null]
    );

    res.status(201).json({ token: signToken(user.rows[0].id), user: user.rows[0] });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });

    const { rows } = await pool.query(`SELECT * FROM users WHERE phone = $1`, [phone]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { id, phone: p, full_name } = rows[0];
    res.json({ token: signToken(id), user: { id, phone: p, full_name } });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, phone, full_name, created_at FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtpHandler, register, login, me };
