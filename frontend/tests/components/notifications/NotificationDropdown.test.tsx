// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../../../src/services/api';
import NotificationDropdown from '../../../src/components/notifications/NotificationDropdown';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({
      data: [
        {
          _id: 'n1',
          title: 'Buổi tập chân',
          message: 'Lịch mới với học viên',
          resourceType: 'calendarEvents',
          resourceId: 'e1',
          readAt: null,
        },
        {
          _id: 'n2',
          title: 'Báo cáo InBody',
          message: 'Đã hoàn tất phân tích',
          resourceType: 'progressReports',
          resourceId: 'r1',
          readAt: '2026-08-28T07:00:00Z',
        },
      ],
      meta: { page: 1, limit: 5, total: 10, totalPages: 2 },
      message: '',
    });
    vi.mocked(api.patch).mockReset().mockResolvedValue({ data: {}, message: 'Đã đọc.' });
  });

  it('hiển thị danh sách thông báo, phân trang và đánh dấu đã đọc khi click', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleUnreadChange = vi.fn();

    render(
      <MemoryRouter>
        <NotificationDropdown onClose={handleClose} onUnreadCountChange={handleUnreadChange} />
      </MemoryRouter>
    );

    // Header title & count
    expect(await screen.findByText('Thông báo')).toBeInTheDocument();
    expect(screen.getByText('1 mới')).toBeInTheDocument();

    // Items
    expect(screen.getByText('Buổi tập chân')).toBeInTheDocument();
    expect(screen.getByText('Báo cáo InBody')).toBeInTheDocument();

    // Pagination
    expect(screen.getByText(/Trang/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();

    // Click on unread item
    await user.click(screen.getByText('Buổi tập chân'));
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/notifications/n1/read', {});
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('đánh dấu tất cả đã đọc qua nút thao tác', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleUnreadChange = vi.fn();

    render(
      <MemoryRouter>
        <NotificationDropdown onClose={handleClose} onUnreadCountChange={handleUnreadChange} />
      </MemoryRouter>
    );

    const markAllBtn = await screen.findByRole('button', { name: /Đã đọc tất cả/ });
    await user.click(markAllBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/notifications/n1/read', {});
      expect(handleUnreadChange).toHaveBeenCalledWith(0);
    });
  });

  it('chuyển trang khi bấm nút phân trang', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationDropdown onClose={vi.fn()} />
      </MemoryRouter>
    );

    const nextBtn = await screen.findByRole('button', { name: 'Trang sau' });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/notifications?page=2&limit=5');
    });
  });
});
