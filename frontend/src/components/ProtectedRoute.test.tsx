// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { saveSession } from '../services/session';

describe('ProtectedRoute', () => {
  afterEach(() => localStorage.clear());

  it('chuyển về đăng nhập khi chưa có phiên', () => {
    render(<MemoryRouter initialEntries={['/portal']}><Routes><Route path="/portal" element={<ProtectedRoute><span>Portal</span></ProtectedRoute>} /><Route path="/login" element={<span>Đăng nhập</span>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
  });

  it('hiển thị portal khi có phiên', () => {
    saveSession({ token: 'abc', user: { username: 'pt', role: 'PT' } });
    render(<MemoryRouter initialEntries={['/portal']}><Routes><Route path="/portal" element={<ProtectedRoute><span>Portal</span></ProtectedRoute>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Portal')).toBeInTheDocument();
  });
});
