import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getMyContent } from '../controllers/publicationController.js';
import { validate } from '../middlewares/validate.js';
const router = express.Router();
router.get('/content', authenticate, authorize('CUSTOMER'), validate(() => []), getMyContent);
export default router;
