const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, listValidator } = require('../middlewares/validate');
const { createController } = require('../controllers/publicationController');

function createContentRouter(resource, bodyValidator) {
  const router = express.Router();
  const controller = createController(resource);
  const idValidator = (req) => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã nội dung không hợp lệ.' }];
  const updateValidator = (req) => {
    const errors = [...idValidator(req), ...bodyValidator(req)];
    for (const field of ['ptId', 'status', 'publishedAt', 'version']) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) errors.push({ field, message: `Trường ${field} không được phép cập nhật.` });
    }
    return errors;
  };
  const contentListValidator = (req) => {
    const errors = listValidator(req);
    if (req.query.status && !['DRAFT', 'PUBLISHED'].includes(req.query.status)) errors.push({ field: 'status', message: 'Trạng thái nội dung không hợp lệ.' });
    if (req.query.customerId && !mongoose.isValidObjectId(req.query.customerId)) errors.push({ field: 'customerId', message: 'Mã khách hàng không hợp lệ.' });
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

module.exports = createContentRouter;
