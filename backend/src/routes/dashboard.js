const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { stats } = require('../controllers/dashboardController');

router.get('/', auth, stats);

module.exports = router;
