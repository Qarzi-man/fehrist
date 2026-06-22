const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const business = require('../middleware/businessMiddleware');
const d = require('../controllers/debtsController');
const { list: listRepayments, create: createRepayment } = require('../controllers/repaymentsController');

router.use(auth);
router.use(business);
router.get('/',      d.list);
router.post('/',     d.create);
router.get('/:id',   d.getOne);
router.put('/:id',   d.update);
router.delete('/:id', d.remove);

router.get('/:debt_id/repayments',  listRepayments);
router.post('/:debt_id/repayments', createRepayment);

module.exports = router;
