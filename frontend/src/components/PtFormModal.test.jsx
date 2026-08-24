// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import PtFormModal from './PtFormModal';
import { ToastProvider } from './ToastProvider';
import { api } from '../services/api';

vi.mock('../services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

const pt = { _id: 'pt-1', username: 'pt-lan', fullName: 'PT Lan', phone: '0901234567', certificates: ['ACE'], status: 'ACTIVE' };

beforeEach(() => vi.clearAllMocks());

it('gửi API cập nhật khi lưu popup sửa PT', async () => {
  const user = userEvent.setup();
  api.patch.mockResolvedValue({ message: 'Cập nhật hồ sơ PT thành công.', data: pt });
  const onSaved = vi.fn();
  render(<ToastProvider><PtFormModal open pt={pt} onClose={vi.fn()} onSaved={onSaved} /></ToastProvider>);

  await user.clear(screen.getByLabelText('Chuyên môn'));
  await user.type(screen.getByLabelText('Chuyên môn'), 'Yoga');
  await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

  expect(api.patch).toHaveBeenCalledWith('/api/users/pt-1', expect.objectContaining({ username: 'pt-lan', specialization: 'Yoga', certificates: ['ACE'], role: 'PT' }));
  expect(onSaved).toHaveBeenCalledWith(pt);
});

it('hỏi xác nhận khi đóng popup có dữ liệu đã thay đổi', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<ToastProvider><PtFormModal open pt={pt} onClose={onClose} onSaved={vi.fn()} /></ToastProvider>);

  await user.type(screen.getByLabelText('Giới thiệu'), 'Có thay đổi');
  await user.click(screen.getByRole('button', { name: 'Hủy' }));

  expect(screen.getByRole('dialog', { name: 'Bỏ các thay đổi?' })).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
  expect(onClose).toHaveBeenCalledOnce();
});
