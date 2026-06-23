const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const b = require('../controllers/billingController');

router.use(auth);
router.use(business);
router.get('/status', b.getStatus);
router.post('/request', b.createRequest);
router.get('/requests', b.getRequests);

module.exports = router;
