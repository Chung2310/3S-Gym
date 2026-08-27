// @vitest-environment jsdom
import { destinationForRole, getSession, saveSession } from './session';

describe('session', () => {
  it('lưu và đọc phiên đăng nhập theo response backend', () => {
    saveSession({ token: 'abc', user: { username: 'pt-a', role: 'PT' } });
    expect(getSession()).toEqual({ token: 'abc', user: { username: 'pt-a', role: 'PT' } });
  });

  it('điều hướng tất cả vai trò vào portal', () => {
    expect(destinationForRole()).toBe('/portal');
  });
});
