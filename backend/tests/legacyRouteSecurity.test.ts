import request from 'supertest';
import app from '../app.js';

describe('Bảo mật route công cụ legacy', () => {
  it.each([
    ['post', '/api/nutrition/calculate'],
    ['get', '/api/nutrition/meal-image'],
    ['post', '/api/nutrition/scan-inbody'],
    ['post', '/api/upload/image'],
  ] as const)('%s %s yêu cầu đăng nhập', async (method, path) => {
    const response = await request(app)[method](path);
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });
});
