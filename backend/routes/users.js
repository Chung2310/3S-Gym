const express = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../middlewares/auth');
const { validate, createUserValidator, updateUserValidator, listValidator } = require('../middlewares/validate');
const userController = require('../controllers/userController');

const router = express.Router();
const idValidator = (req) => mongoose.isValidObjectId(req.params.id) ? [] : [{ field: 'id', message: 'Mã PT không hợp lệ.' }];
const userListValidator = (req) => {
  const errors = listValidator(req);
  if (req.query.role && !['ADMIN', 'PT', 'CUSTOMER'].includes(req.query.role)) errors.push({ field: 'role', message: 'Vai trò không hợp lệ.' });
  if (req.query.status && !['ACTIVE', 'INACTIVE'].includes(req.query.status)) errors.push({ field: 'status', message: 'Trạng thái tài khoản không hợp lệ.' });
  return errors;
};

router.get('/', authenticate, authorize('ADMIN'), validate(userListValidator), userController.list);
router.post('/', authenticate, authorize('ADMIN'), validate(createUserValidator), userController.create);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updateUserValidator), userController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), validate(idValidator), userController.remove);

module.exports = router;
