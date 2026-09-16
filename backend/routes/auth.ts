import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { loginSchema } from '../validators/authValidator.js';
import { updateSelfProfileSchema } from '../validators/userValidator.js';

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateSelfProfileSchema), authController.updateMe);

export default router;
