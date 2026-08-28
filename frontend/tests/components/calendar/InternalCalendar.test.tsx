// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import CalendarPage from '../../../src/pages/common/CalendarPage';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

it('lọc theo ngày và tạo event từ modal', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 }, message: '' });
  vi.mocked(api.post).mockResolvedValue({ data: {}, message: 'Đã tạo lịch.' });
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <CalendarPage role="PT" />
    </ToastProvider>
  );
  await user.click(screen.getByRole('button', { name: 'Tạo lịch' }));
  await user.type(screen.getByLabelText('Tên lịch'), 'Buổi tập chân');
  await user.type(screen.getByLabelText('Bắt đầu'), '2026-09-06T08:00');
  await user.type(screen.getByLabelText('Kết thúc'), '2026-09-06T09:00');
  await user.click(screen.getByRole('button', { name: 'Lưu lịch' }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith('/api/calendar-events', expect.objectContaining({ title: 'Buổi tập chân' }))
  );
  expect(screen.getByRole('list', { name: 'Danh sách lịch' })).toBeVisible();
});
