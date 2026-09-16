import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, refreshSchema, logoutSchema } from '../validators/authValidator.js';
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

export default router;
