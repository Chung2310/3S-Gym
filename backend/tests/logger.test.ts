import { formatLogLine, positiveInteger, sanitizeLogValue } from '../config/logFormatter.js';

describe('log formatter', () => {
  it('định dạng timestamp, level, context và giữ nguyên Unicode', () => {
    expect(formatLogLine({
      timestamp: new Date('2026-08-27T02:54:11.541Z'),
      level: 'info',
      context: 'REQUEST',
      message: 'Xử lý yêu cầu tiếng Việt',
      timezone: 'UTC',
    })).toBe('[2026-08-27 02:54:11.541] [info]: [REQUEST] Xử lý yêu cầu tiếng Việt');
  });

  it('pretty-print object ở các dòng tiếp theo', () => {
    const output = formatLogLine({
      timestamp: new Date('2026-08-27T02:54:11.541Z'), level: 'info', context: 'API',
      message: 'Payload', metadata: { customer: { name: 'Nguyễn Văn An' } }, timezone: 'UTC',
    });
    expect(output).toContain("\n{\n  customer: { name: 'Nguyễn Văn An' }\n}");
  });

  it('che bí mật lồng sâu không phân biệt hoa thường', () => {
    const value = sanitizeLogValue({ password: '123', nested: { APIKey: 'AQ.secret', accessToken: 'jwt' } });
    expect(value).toEqual({ password: '[ĐÃ ẨN]', nested: { APIKey: '[ĐÃ ẨN]', accessToken: '[ĐÃ ẨN]' } });
    expect(JSON.stringify(value)).not.toContain('AQ.secret');
  });

  it('giới hạn chuỗi, buffer, collection và circular reference an toàn', () => {
    const circular: Record<string, unknown> = { long: 'abcdefgh', binary: Buffer.from('secret'), list: [1, 2, 3, 4, 5] };
    circular.self = circular;
    expect(sanitizeLogValue(circular, { maxStringLength: 4, maxCollectionItems: 4 })).toEqual({
      long: 'abcd… [TRUNCATED]', binary: '[Buffer: 6 bytes]', list: [1, 2, 3, 4, '[TRUNCATED: 1 items]'], self: '[Circular]',
    });
  });

  it('serialize Error có stack ngoài production và bỏ stack trong production', () => {
    const error = new Error('Lỗi kết nối');
    expect(sanitizeLogValue(error, { includeErrorStack: true })).toMatchObject({ name: 'Error', message: 'Lỗi kết nối', stack: expect.any(String) });
    expect(sanitizeLogValue(error, { includeErrorStack: false })).toEqual({ name: 'Error', message: 'Lỗi kết nối' });
  });

  it('dùng fallback cho giới hạn môi trường không hợp lệ', () => {
    expect(positiveInteger('0', 25)).toBe(25);
    expect(positiveInteger('abc', 25)).toBe(25);
    expect(positiveInteger('10', 25)).toBe(10);
  });

  it('bỏ field undefined để metadata dễ đọc', () => {
    const value = sanitizeLogValue({ userId: undefined, active: false, count: 0, note: '' });
    expect(Object.keys(value as object)).toEqual(['active', 'count', 'note']);
    expect(value).toEqual({ active: false, count: 0, note: '' });
  });
});
