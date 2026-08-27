// @vitest-environment jsdom
import { api } from './api';

beforeEach(() => {
  localStorage.clear();
});

describe('api client', () => {
  it('giữ summary top-level của list response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [], summary: { netCalories: 420 } }) });
    await expect(api.get('/api/nutrition/logs')).resolves.toMatchObject({ summary: { netCalories: 420 } });
  });

  it('giải mã data và meta từ response chuẩn', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Thành công.', data: [{ id: 1 }], meta: { page: 1 } }),
    });

    await expect(api.get('/api/customers')).resolves.toEqual({ data: [{ id: 1 }], meta: { page: 1 }, message: 'Thành công.' });
  });

  it('giữ status, code, requestId và field errors từ response lỗi', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        code: 'VALIDATION_ERROR',
        requestId: 'req-422',
        errors: [{ field: 'email', message: 'Email không hợp lệ.' }],
      }),
    });

    await expect(api.get('/api/customers')).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      requestId: 'req-422',
      errors: [{ field: 'email', message: 'Email không hợp lệ.' }],
    });
  });

  it('xóa session khi server trả 401', async () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('user', JSON.stringify({ username: 'pt-a', role: 'PT' }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Bạn chưa đăng nhập.', code: 'AUTHENTICATION_ERROR', requestId: 'req-401' }),
    });

    await expect(api.get('/api/private')).rejects.toMatchObject({ status: 401, code: 'AUTHENTICATION_ERROR' });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
