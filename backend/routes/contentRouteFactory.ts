import express, { type Request } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate, listValidator, type ValidationIssue, type ValidationSchema } from '../middlewares/validate.js';
import { createController } from '../controllers/publicationController.js';

export type ContentResource = 'inbody' | 'goals' | 'workoutPlans' | 'nutritionPlans';

function createContentRouter(resource: ContentResource, bodyValidator: ValidationSchema) {
  const router = express.Router();
  const controller = createController(resource);
  const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id)
    ? []
    : [{ field: 'id', message: 'Mã nội dung không hợp lệ.' }];
  const updateValidator = (req: Request): ValidationIssue[] => {
    const errors = [...idValidator(req), ...bodyValidator(req)];
    for (const field of ['ptId', 'status', 'publishedAt', 'version']) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) errors.push({ field, message: `Trường ${field} không được phép cập nhật.` });
    }
    return errors;
  };
  const contentListValidator = (req: Request): ValidationIssue[] => {
    const errors = listValidator(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
    if (status && !['DRAFT', 'PUBLISHED'].includes(status)) errors.push({ field: 'status', message: 'Trạng thái nội dung không hợp lệ.' });
    if (customerId && !mongoose.isValidObjectId(customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' });
    return errors;
  };
  router.get('/', authenticate, authorize('ADMIN', 'PT'), validate(contentListValidator), controller.list);
  router.post('/', authenticate, authorize('ADMIN', 'PT'), validate(bodyValidator), controller.create);
  router.patch('/:id', authenticate, authorize('ADMIN', 'PT'), validate(updateValidator), controller.update);
  router.delete('/:id', authenticate, authorize('ADMIN', 'PT'), validate(idValidator), controller.remove);
  router.patch('/:id/publish', authenticate, authorize('ADMIN', 'PT'), validate(idValidator), controller.publish);
  router.patch('/:id/unpublish', authenticate, authorize('ADMIN', 'PT'), validate(idValidator), controller.unpublish);
  return router;
}

export default createContentRouter;
