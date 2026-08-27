import request from 'supertest';
import app from '../app.js';
describe('health checks', () => {
  it('liveness không phụ thuộc database', async () => {
    const response = await request(app).get('/api/health/live');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ status: 'live' });
  });

  it('readiness trả 503 khi database chưa kết nối', async () => {
    const response = await request(app).get('/api/health/ready');
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
  });
});
