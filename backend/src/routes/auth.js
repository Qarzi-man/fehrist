const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { sendOtpHandler, register, login, me } = require('../controllers/authController');

router.post('/send-otp', sendOtpHandler);
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);

module.exports = router;
