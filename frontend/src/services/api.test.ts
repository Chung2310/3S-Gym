// @vitest-environment jsdom
import { api } from './api';

describe('api client', () => {
  it('giải mã data và meta từ response chuẩn', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Thành công.', data: [{ id: 1 }], meta: { page: 1 } }),
    });

    await expect(api.get('/api/customers')).resolves.toEqual({ data: [{ id: 1 }], meta: { page: 1 }, message: 'Thành công.' });
  });

  it('ném message tiếng Việt từ response lỗi', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false, message: 'Bạn chưa đăng nhập.' }) });
    await expect(api.get('/api/customers')).rejects.toThrow('Bạn chưa đăng nhập.');
  });
});
