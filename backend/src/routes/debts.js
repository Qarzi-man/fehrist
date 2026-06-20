const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const d = require('../controllers/debtsController');
const { list: listRepayments, create: createRepayment } = require('../controllers/repaymentsController');

router.use(auth);
router.get('/', d.list);
router.post('/', d.create);
router.put('/:id', d.update);
router.delete('/:id', d.remove);

// Repayments nested under debts
router.get('/:debt_id/repayments', listRepayments);
router.post('/:debt_id/repayments', createRepayment);

module.exports = router;
