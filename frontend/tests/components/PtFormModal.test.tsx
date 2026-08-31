// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import PtFormModal from '../../src/components/ui/PtFormModal';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({ api: { post: vi.fn(), patch: vi.fn() } }));

const pt = { _id: 'pt-1', username: 'pt-lan', fullName: 'PT Lan', phone: '0901234567', certificates: ['ACE'], status: 'ACTIVE' };

beforeEach(() => vi.clearAllMocks());

it('gửi API cập nhật khi lưu popup sửa PT', async () => {
  const user = userEvent.setup();
  vi.mocked(api.patch).mockResolvedValue({ message: 'Cập nhật hồ sơ PT thành công.', data: pt });
  const onSaved = vi.fn();
  render(<ToastProvider><PtFormModal open pt={pt} onClose={vi.fn()} onSaved={onSaved} /></ToastProvider>);

  await user.clear(screen.getByLabelText('Chuyên môn huấn luyện'));
  await user.type(screen.getByLabelText('Chuyên môn huấn luyện'), 'Yoga');
  await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

  expect(api.patch).toHaveBeenCalledWith('/api/users/pt-1', expect.objectContaining({ specialization: 'Yoga', certificates: ['ACE'] }));
  expect(onSaved).toHaveBeenCalledWith(pt);
});

it('không chứa trường password hay username trong form sửa PT', async () => {
  render(<ToastProvider><PtFormModal open pt={pt} onClose={vi.fn()} onSaved={vi.fn()} /></ToastProvider>);

  expect(screen.queryByLabelText(/Mật khẩu/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Tên đăng nhập/i)).not.toBeInTheDocument();
});
