const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const a = require('../controllers/adminController');

router.use(auth);
router.use(requireAdmin);

router.get('/stats',                  a.getStats);
router.get('/users',                  a.getUsers);
router.patch('/users/:id/block',      a.blockUser);
router.get('/businesses',                    a.getBusinesses);
router.get('/subscriptions/expiring',        a.getExpiringSubscriptions);
router.patch('/businesses/:id/plan',         a.updatePlan);
router.get('/payments',               a.getPayments);
router.patch('/payments/:id/approve', a.approvePayment);
router.patch('/payments/:id/reject',  a.rejectPayment);
router.get('/sms',                    a.getSmsLogs);
router.get('/revenue',                a.getRevenue);

module.exports = router;
