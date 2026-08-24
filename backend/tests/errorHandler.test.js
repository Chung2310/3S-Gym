const { errorHandler } = require('../middlewares/errorHandler');

describe('errorHandler', () => {
  it('không lộ message kỹ thuật tiếng Anh ra response', () => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    errorHandler(new Error('Mongo network timeout'), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.', code: 'INTERNAL_SERVER_ERROR', requestId: 'unknown' });
  });
});
