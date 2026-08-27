import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { validate, loginValidator } from '../middlewares/validate.js';
router.post('/login', validate(loginValidator), authController.login);

export default router;
