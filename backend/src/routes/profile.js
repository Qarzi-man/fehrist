const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const p = require('../controllers/profileController');

router.use(auth);
router.get('/',    p.getProfile);
router.patch('/',  p.updateProfile);
router.delete('/', p.deleteAccount);

module.exports = router;
