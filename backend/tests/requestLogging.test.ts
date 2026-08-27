import request from 'supertest';
import app from '../app.js';
import { logger } from '../config/logger.js';

describe('API request logging', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ghi REQUEST và RESPONSE thành công với cùng request ID', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const response = await request(app).get('/api/health').set('x-request-id', 'req-log-success');
    expect(response.status).toBe(200);
    expect(info).toHaveBeenCalledWith(expect.objectContaining({
      context: 'REQUEST', method: 'GET', url: '/api/health', ip: expect.any(String), requestId: 'req-log-success',
    }), expect.stringMatching(/^GET \/api\/health - IP: .+ - Request ID: req-log-success$/));
    expect(info).toHaveBeenCalledWith(expect.objectContaining({
      context: 'RESPONSE', method: 'GET', url: '/api/health', statusCode: 200,
      durationMs: expect.any(Number), requestId: 'req-log-success', responseBody: expect.any(Object),
    }), expect.stringMatching(/^GET \/api\/health - 200 - Duration: \d+(?:\.\d+)? ms - Request ID: req-log-success$/));
  });

  it('ghi body đã che và dùng warn cho response 4xx', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    await request(app).post('/api/khong-ton-tai?source=test').send({ name: 'Nguyễn', password: 'khong-duoc-lo', nested: { apiKey: 'AQ.secret' } });
    expect(info).toHaveBeenCalledWith(expect.objectContaining({
      context: 'REQUEST', query: { source: 'test' }, body: { name: 'Nguyễn', password: '[ĐÃ ẨN]', nested: { apiKey: '[ĐÃ ẨN]' } },
    }), expect.stringMatching(/^POST \/api\/khong-ton-tai\?source=test - IP: .+ - Request ID: .+$/));
    expect(warn).toHaveBeenCalledWith(expect.objectContaining({ context: 'RESPONSE', statusCode: 404 }), expect.any(String));
    expect(JSON.stringify([...info.mock.calls, ...warn.mock.calls])).not.toContain('khong-duoc-lo');
    expect(JSON.stringify([...info.mock.calls, ...warn.mock.calls])).not.toContain('AQ.secret');
  });
});
