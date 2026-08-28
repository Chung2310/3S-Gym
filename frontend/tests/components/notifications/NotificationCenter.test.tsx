// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import NotificationsPage from '../../../src/pages/common/NotificationsPage';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

it('đếm unread và đánh dấu đã đọc khi mở thông báo', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: [
      {
        _id: 'n1',
        title: 'Buổi tập chân',
        message: 'Lịch mới',
        resourceType: 'calendarEvents',
        resourceId: 'e1',
        readAt: null,
      },
      {
        _id: 'n2',
        title: 'Báo cáo',
        message: 'Mới',
        resourceType: 'progressReports',
        resourceId: 'r1',
        readAt: null,
      },
      {
        _id: 'n3',
        title: 'Chăm sóc',
        message: 'Mới',
        resourceType: 'careTask',
        resourceId: 'c1',
        readAt: null,
      },
    ],
    meta: { page: 1, totalPages: 1 },
    message: '',
  });
  vi.mocked(api.patch).mockResolvedValue({ data: {}, message: '' });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <ToastProvider>
        <NotificationsPage />
      </ToastProvider>
    </MemoryRouter>
  );
  expect(await screen.findByLabelText('3 thông báo chưa đọc')).toBeVisible();
  await user.click(screen.getByText('Buổi tập chân'));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/notifications/n1/read', {}));
});
