const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const { analytics, exportAnalytics } = require('../controllers/analyticsController');

router.use(auth);
router.use(business);
router.get('/export', exportAnalytics);
router.get('/', analytics);

module.exports = router;
