const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const { stats } = require('../controllers/dashboardController');

router.get('/', auth, business, stats);

module.exports = router;
