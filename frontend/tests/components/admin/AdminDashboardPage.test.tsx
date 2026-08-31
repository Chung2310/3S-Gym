// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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
  customerStats: {
    active: 12,
    lead: 4,
    inactive: 2,
  },
  packageStats: {
    totalSessions: 180,
    remainingSessions: 90,
    completedSessions: 90,
  },
  ptWorkload: [
    {
      ptId: 'pt-1',
      fullName: 'Nguyễn Văn PT',
      username: 'pt1',
      activeCustomers: 6,
      totalCustomers: 8,
      activePackages: 5,
    },
  ],
  recentAlerts: [
    {
      _id: 'alert-1',
      title: 'Khách nghỉ tập > 7 ngày',
      reason: 'Chưa check-in tuần này',
      ruleKey: 'INACTIVITY',
      dueAt: '2026-09-01T00:00:00.000Z',
      customerName: 'Trần Văn Khách',
      ptName: 'Nguyễn Văn PT',
    },
  ],
  filters: {},
  sourcePaths: ['/api/users', '/api/customers', '/api/care/alerts', '/api/pt-packages'],
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockResolvedValue({ data: dashboard, message: '' });
  });

  it('hiển thị metrics do backend trả về', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('18')).toBeVisible();
    expect(screen.getByText('Khách hàng')).toBeVisible();
    expect(screen.getByText('Cơ cấu Trạng thái Hội viên')).toBeVisible();
    expect(screen.getAllByText('Nguyễn Văn PT')[0]).toBeVisible();
  });

  it('tải lại metrics khi người dùng yêu cầu làm mới', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ToastProvider>
          <AdminDashboardPage />
        </ToastProvider>
      </MemoryRouter>
    );

    await screen.findByText('18');
    await user.click(screen.getByRole('button', { name: 'Làm mới dữ liệu' }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/dashboard/admin'));
  });
});

