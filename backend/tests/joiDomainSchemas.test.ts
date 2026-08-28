import { describe, expect, it } from 'vitest';
import { loginSchema } from '../validators/authValidator.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';
import { updateFeatureSchema } from '../validators/operationsValidator.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customerValidator.js';
import { createTransferSchema } from '../validators/transferValidator.js';

const options = { abortEarly: false, allowUnknown: false, convert: true };

describe('Joi domain schemas', () => {
  it('từ chối field lạ và dữ liệu đăng nhập thiếu', () => {
    const result = loginSchema.body?.validate({ username: '', password: '', extra: true }, options);
    expect(result?.error?.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['username', 'password', 'extra']),
    );
  });

  it('yêu cầu hồ sơ PT và từ chối PATCH user rỗng', () => {
    const create = createUserSchema.body?.validate({ username: 'pt01', password: 'MatKhau123', role: 'PT' }, options);
    const update = updateUserSchema.body?.validate({}, options);
    expect(create?.error?.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['fullName', 'phone']),
    );
    expect(update?.error?.details[0].type).toBe('object.min');
  });

  it('kiểm tra feature key, role và ObjectId pilot', () => {
    const result = updateFeatureSchema.params?.validate({ key: 'SAI' }, options);
    const body = updateFeatureSchema.body?.validate({ enabled: true, roles: ['SAI'], pilotUserIds: ['x'] }, options);
    expect(result?.error).toBeDefined();
    expect(body?.error?.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['roles', 'pilotUserIds.0']),
    );
  });

  it('kiểm tra customer PATCH và transfer ObjectId', () => {
    expect(updateCustomerSchema.body?.validate({}, options).error?.details[0].type).toBe('object.min');
    expect(createCustomerSchema.body?.validate({ fullName: 'A', phone: 'x', extra: true }, options).error).toBeDefined();
    expect(createTransferSchema.body?.validate({ customerId: 'x', toPtId: 'y', reason: '' }, options).error?.details.map((detail) => detail.path.join('.'))).toEqual(
      expect.arrayContaining(['customerId', 'toPtId', 'reason']),
    );
  });
});
