const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, loginValidator } = require('../middlewares/validate');

router.post('/login', validate(loginValidator), authController.login);

module.exports = router;
