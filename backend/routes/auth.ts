import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validators/authValidator.js';
router.post('/login', validate(loginSchema), authController.login);

export default router;
