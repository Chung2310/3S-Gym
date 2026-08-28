import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import * as controller from '../controllers/transferController.js';
import { createTransferSchema, forceTransferSchema, listTransfersSchema, transferIdSchema, updateTransferSchema } from '../validators/transferValidator.js';

const router = express.Router();
/* legacy manual validators
const objectIdError = (field: string): ValidationIssue => ({ field, message: `${field === 'customerId' ? 'Mã khách hàng' : 'Mã PT'} không hợp lệ.` });
const idValidator = (req: Request): ValidationIssue[] => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã yêu cầu không hợp lệ.' }];
function createValidator(req: Request): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  if (!mongoose.isValidObjectId(req.body.customerId)) errors.push(objectIdError('customerId'));
  if (!mongoose.isValidObjectId(req.body.toPtId)) errors.push(objectIdError('toPtId'));
  if (typeof req.body.reason !== 'string' || !req.body.reason.trim()) errors.push({ field: 'reason', message: 'Vui lòng nhập lý do chuyển khách.' });
  return errors;
}
const forceValidator = (req: Request): ValidationIssue[] => [...idValidator(req), ...createValidator(req)];
const updateValidator = (req: Request): ValidationIssue[] => {
  const errors = idValidator(req);
  if (!mongoose.isValidObjectId(req.body.toPtId)) errors.push(objectIdError('toPtId'));
  if (typeof req.body.reason !== 'string' || !req.body.reason.trim()) errors.push({ field: 'reason', message: 'Vui lòng nhập lý do chuyển khách.' });
  return errors;
};
const transferListValidator = (req: Request): ValidationIssue[] => {
  const errors = listValidator(req);
  if (req.query.status && !['PENDING', 'ACCEPTED', 'REJECTED', 'ADMIN_FORCED'].includes(String(req.query.status))) errors.push({ field: 'status', message: 'Trạng thái chuyển PT không hợp lệ.' });
  if (req.query.customerId && !mongoose.isValidObjectId(String(req.query.customerId))) errors.push(objectIdError('customerId'));
  return errors;
};

*/
router.get('/', authenticate, authorize('ADMIN', 'PT'), validate(listTransfersSchema), controller.list);
router.post('/', authenticate, authorize('PT'), validate(createTransferSchema), controller.create);
router.patch('/:id', authenticate, authorize('PT'), validate(updateTransferSchema), controller.update);
router.delete('/:id', authenticate, authorize('PT'), validate(transferIdSchema), controller.remove);
router.patch('/:id/accept', authenticate, authorize('PT'), validate(transferIdSchema), controller.accept);
router.patch('/:id/reject', authenticate, authorize('PT'), validate(transferIdSchema), controller.reject);
router.patch('/:id/admin-force', authenticate, authorize('ADMIN'), validate(forceTransferSchema), controller.force);

export default router;
