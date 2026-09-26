import express from 'express';
const router = express.Router();
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, refreshSchema, logoutSchema } from '../validators/authValidator.js';
import { updateSelfProfileSchema } from '../validators/userValidator.js';

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateSelfProfileSchema), authController.updateMe);
router.delete('/me', authenticate, authController.deleteMe);
router.post('/push-token', authenticate, authController.updatePushToken);

export default router;

