const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const { analytics } = require('../controllers/analyticsController');

router.use(auth);
router.use(business);
router.get('/', analytics);

module.exports = router;
