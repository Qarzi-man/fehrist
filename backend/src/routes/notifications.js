const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const n = require('../controllers/notificationsController');

router.use(auth);
router.get('/',              n.list);
router.patch('/read-all',    n.markAllRead);   // must be before /:id
router.patch('/:id/read',    n.markRead);

module.exports = router;
