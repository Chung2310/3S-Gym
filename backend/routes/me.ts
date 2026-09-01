import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { getMyContent } from '../controllers/publicationController.js';
const router = express.Router();
router.get('/content', authenticate, authorize('CUSTOMER'), getMyContent);
export default router;
