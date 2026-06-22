const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { analytics } = require('../controllers/analyticsController');

router.use(auth);
router.get('/', analytics);

module.exports = router;
