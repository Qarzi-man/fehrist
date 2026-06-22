const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const requireOwner = require('../middleware/requireOwner');
const m = require('../controllers/membersController');

router.use(auth);

// User-scoped (no businessMiddleware needed)
router.get('/pending', m.listPending);
router.post('/accept', m.accept);
router.post('/decline', m.decline);

// Business-scoped
router.get('/', business, m.list);
router.post('/invite', business, requireOwner, m.invite);
router.delete('/:id', business, requireOwner, m.remove);

module.exports = router;
