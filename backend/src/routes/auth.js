const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/authMiddleware');
const { sendOtpHandler, register, login, me } = require('../controllers/authController');

// 5 OTP send requests per IP per 15 minutes
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Слишком много попыток. Подождите 15 минут.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// 3 OTP verify attempts per phone number per 10 minutes
const verifyOtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.phone || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: 'too_many_requests',
      message: 'Слишком много попыток. Подождите 10 минут.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

router.post('/send-otp', sendOtpLimiter, sendOtpHandler);
router.post('/register', register);
router.post('/login', verifyOtpLimiter, login);
router.get('/me', auth, me);

module.exports = router;
