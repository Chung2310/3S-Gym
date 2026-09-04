import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import * as controller from '../controllers/knowledgeController.js';

const router = express.Router();
const adminOnly = [authenticate, authorize('ADMIN')] as const;

// Chỉ dành riêng cho ADMIN quản lý kho tri thức
router.get('/', ...adminOnly, controller.listDocuments);
router.post('/', ...adminOnly, controller.createDocument);
router.post('/seed-standard', ...adminOnly, controller.seedStandard);
router.patch('/:id', ...adminOnly, controller.updateDocument);
router.delete('/:id', ...adminOnly, controller.deleteDocument);
router.patch('/:id/publish', ...adminOnly, controller.publishDocument);
router.patch('/:id/unpublish', ...adminOnly, controller.unpublishDocument);

export default router;
