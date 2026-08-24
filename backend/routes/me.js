const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { getMyContent } = require('../controllers/publicationController');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.get('/content', authenticate, authorize('CUSTOMER'), validate(() => []), getMyContent);
module.exports = router;
