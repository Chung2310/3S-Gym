// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import LandingPage from '../src/pages/LandingPage';
import LoginPage from '../src/pages/LoginPage';
import { destinationForRole, getSession, saveSession } from '../src/services/session';

function LocationTracker() {
  const { pathname } = useLocation();
  return <div data-testid="current-location">{pathname}</div>;
}

function TestAppRoutes() {
  const session = getSession();
  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Navigate to={destinationForRole()} replace /> : <LandingPage />}
      />
      <Route
        path="/login"
        element={session ? <Navigate to={destinationForRole()} replace /> : <LoginPage />}
      />
      <Route path="/portal/*" element={<LocationTracker />} />
    </Routes>
  );
}

// Mock IntersectionObserver for LandingPage
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe('App Routing & Auto-Redirect', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('khi chưa đăng nhập, mở / sẽ hiển thị trang chủ giới thiệu Landing Page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestAppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText(/TỔ HỢP THỂ THAO CAO CẤP 3S BẮC NINH/i)).toBeInTheDocument();
  });

  it('khi đã đăng nhập và lưu session, mở web sẽ tự động chuyển hướng vào portal quản lý', () => {
    saveSession({ token: 'mock-pt-token', user: { username: 'pt-lan', role: 'PT' } });

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestAppRoutes />
      </MemoryRouter>
    );

    expect(destinationForRole()).toBe('/portal');
    expect(screen.getByTestId('current-location')).toHaveTextContent('/portal');
    expect(screen.queryByText(/TỔ HỢP THỂ THAO CAO CẤP 3S BẮC NINH/i)).not.toBeInTheDocument();
  });

  it('khi đã đăng nhập, truy cập /login cũng tự động chuyển hướng vào portal quản lý', () => {
    saveSession({ token: 'mock-admin-token', user: { username: 'admin', role: 'ADMIN' } });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <TestAppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-location')).toHaveTextContent('/portal');
    expect(screen.queryByText('ĐĂNG NHẬP PT PORTAL')).not.toBeInTheDocument();
  });
});
