const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const s = require('../controllers/smsController');

router.use(auth);
router.use(business);
router.post('/send', s.send);
router.get('/logs', s.logs);

module.exports = router;
