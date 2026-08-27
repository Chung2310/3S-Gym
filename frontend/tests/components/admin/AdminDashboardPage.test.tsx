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

  it('hiển thị metrics và nguồn dữ liệu do backend trả về', async () => {
    render(<ToastProvider><AdminDashboardPage /></ToastProvider>);

    expect(await screen.findByText('18')).toBeVisible();
    expect(screen.getByText('Khách hàng')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Nguồn dữ liệu' })).toBeVisible();
    expect(screen.getByText('/api/care/alerts')).toBeVisible();
  });

  it('gửi đủ bộ lọc dashboard bằng query canonical', async () => {
    const user = userEvent.setup();
    render(<ToastProvider><AdminDashboardPage /></ToastProvider>);

    await screen.findByText('18');
    await user.type(screen.getByLabelText('Mã PT'), '507f1f77bcf86cd799439011');
    await user.selectOptions(screen.getByLabelText('Trạng thái khách hàng'), 'ACTIVE');
    await user.type(screen.getByLabelText('Từ ngày'), '2026-01-01');
    await user.type(screen.getByLabelText('Đến ngày'), '2027-01-01');
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }));

    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/api/dashboard/admin?ptId=507f1f77bcf86cd799439011&customerStatus=ACTIVE&fromDate=2026-01-01&toDate=2027-01-01'));
  });
});
