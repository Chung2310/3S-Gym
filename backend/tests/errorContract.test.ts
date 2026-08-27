import request from 'supertest';
import app from '../app.js';
describe('contract lỗi API', () => {
  it.each([
    ['/api/users', 401, 'AUTHENTICATION_ERROR'],
    ['/api/khong-ton-tai', 404, 'ROUTE_NOT_FOUND'],
  ])('%s trả contract lỗi thống nhất', async (url, status, code) => {
    const response = await request(app).get(url);
    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ success: false, code, requestId: expect.any(String), message: expect.any(String) });
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });

  it('JSON sai cú pháp đi qua error middleware', async () => {
    const response = await request(app).post('/api/auth/login').set('content-type', 'application/json').send('{"username":');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, code: 'INVALID_JSON', requestId: expect.any(String), message: 'Dữ liệu JSON không hợp lệ.' });
  });
});
