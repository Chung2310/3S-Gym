// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '../components/ToastProvider';
import LoginPage from './LoginPage';

function Location() { return <span data-testid="location">{useLocation().pathname}</span>; }

describe('LoginPage', () => {
  it('lưu response chuẩn và chuyển vào portal', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Đăng nhập thành công.', data: { token: 'token-test', user: { username: 'pt', role: 'PT' } } }),
    });
    const { container } = render(<MemoryRouter initialEntries={['/login']}><ToastProvider><Routes><Route path="*" element={<><LoginPage /><Location /></>} /></Routes></ToastProvider></MemoryRouter>);
    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'pt' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'MatKhau123!' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/portal'));
    expect(localStorage.getItem('token')).toBe('token-test');
  });
});
