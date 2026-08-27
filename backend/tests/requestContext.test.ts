import request from 'supertest';
import app from '../app.js';
describe('request context', () => {
  it('trả cùng request ID trong header và response lỗi', async () => {
    const response = await request(app).get('/api/khong-ton-tai').set('x-request-id', 'req-hop-le-123');
    expect(response.headers['x-request-id']).toBe('req-hop-le-123');
    expect(response.body.requestId).toBe('req-hop-le-123');
  });

  it('thay request ID không an toàn', async () => {
    const response = await request(app).get('/api/khong-ton-tai').set('x-request-id', '<script>alert(1)</script>');
    expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
  });
});
