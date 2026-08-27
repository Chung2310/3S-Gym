// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import AdminDashboardPage from '../../../src/components/admin/AdminDashboardPage';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn() },
}));

const dashboard = {
  totalPts: 4,
  totalCustomers: 18,
  openAlerts: 3,
  activePackages: 11,
  filters: {},
  sourcePaths: ['/api/users', '/api/customers', '/api/care/alerts', '/api/pt-packages'],
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: dashboard, message: '' });
  });

  it('hiển thị metrics do backend trả về', async () => {
    render(<ToastProvider><AdminDashboardPage /></ToastProvider>);

    expect(await screen.findByText('18')).toBeVisible();
    expect(screen.getByText('Khách hàng')).toBeVisible();
  });

  it('tải lại metrics khi người dùng yêu cầu làm mới', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><AdminDashboardPage /></ToastProvider>);

    await screen.findByText('18');
    await user.click(screen.getByRole('button', { name: 'Làm mới dữ liệu' }));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(api.get).toHaveBeenLastCalledWith('/api/dashboard/admin');
  });
});
