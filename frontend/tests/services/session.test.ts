// @vitest-environment jsdom
import { clearSession, destinationForRole, getSession, saveSession } from '../../src/services/session';

describe('session', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('lưu và đọc phiên đăng nhập theo response backend', () => {
    saveSession({ token: 'abc', user: { username: 'pt-a', role: 'PT' } });
    expect(getSession()).toEqual({ token: 'abc', user: { username: 'pt-a', role: 'PT' } });
  });

  it('phục hồi session từ cookie khi localStorage bị mất', () => {
    saveSession({ token: 'xyz', user: { username: 'admin', role: 'ADMIN' } });
    // Giả lập localStorage bị xoá nhưng cookie còn nguyên
    localStorage.clear();
    const restored = getSession();
    expect(restored).toEqual({ token: 'xyz', user: { username: 'admin', role: 'ADMIN' } });
    expect(localStorage.getItem('token')).toBe('xyz');
  });

  it('xóa sạch phiên đăng nhập ở cả localStorage và cookie khi clearSession', () => {
    saveSession({ token: 'test-token', user: { username: 'khach', role: 'CUSTOMER' } });
    clearSession();
    expect(getSession()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('điều hướng tất cả vai trò vào portal', () => {
    expect(destinationForRole()).toBe('/portal');
  });
});

