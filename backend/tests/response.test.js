const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('trả response thành công theo mẫu thống nhất', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Hệ thống hoạt động bình thường.',
      data: { status: 'ok' },
    });
  });
});
