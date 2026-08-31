// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import ProgressPage from '../../../src/pages/pt/ProgressPage';
import { api } from '../../../src/services/api';
import type { CustomerJourneyDto, CustomerProgressOverview } from '../../../src/types/progress';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

const analytics = {
  totalVolume: 500,
  averageRpe: 8,
  attendance: { present: 1, late: 0, absent: 0, rate: 100 },
  streakWeeks: 1,
  bodyDeltas: { weight: -1 },
  achievements: [],
  dataQuality: { level: 'PARTIAL', reasons: [] },
};
const overview = {
  customer: { _id: 'c1', fullName: 'Nguyễn An', phone: '0901', status: 'ACTIVE' },
  sessionCount: 1,
  lastSessionAt: '2026-08-29',
  latestMeasurement: { weight: 68 },
  analytics,
} as CustomerProgressOverview;
const journey = {
  customer: overview.customer,
  sessions: [],
  measurements: [],
  calendar: [],
  photos: [],
  plans: {
    active: { _id: 'p1', sourceTemplateId: 't1', title: 'Giáo án 12 tuần', sessions: [{ name: 'Buổi chân', exercises: [] }] },
    history: [],
  },
  reports: [],
  analytics,
} as unknown as CustomerJourneyDto;

const renderPage = () => render(<ToastProvider><ProgressPage /></ToastProvider>);

describe('ProgressPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('shows a shaped loading state before the overview resolves', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => undefined));
    renderPage();
    expect(screen.getByRole('status', { name: 'Đang tải dữ liệu tiến độ' })).toBeVisible();
  });

  it('shows the assigned-customer dashboard and opens separate detail and workout dialogs', async () => {
    vi.mocked(api.get).mockImplementation(async (path: string) => (
      path === '/api/customers/progress-overview'
        ? { data: [overview], message: '' }
        : { data: journey, message: '' }
    ));
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Nguyễn An')).toBeVisible();
    expect(api.get).toHaveBeenCalledWith('/api/customers/progress-overview');
    await user.click(screen.getByRole('button', { name: 'Xem tiến độ Nguyễn An' }));
    expect(await screen.findByRole('dialog', { name: 'Tiến độ Nguyễn An' })).toBeVisible();
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/customers/c1/journey'));
    await user.click(screen.getByRole('button', { name: 'Đóng' }));

    await user.click(screen.getByRole('button', { name: 'Ghi nhận buổi tập Nguyễn An' }));
    expect(await screen.findByRole('dialog', { name: 'Ghi nhận buổi tập · Nguyễn An' })).toBeVisible();
  });

  it('renders a retry action when the overview request fails', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce({ data: [overview], message: '' });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Không thể tải tổng quan tiến độ' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Nguyễn An')).toBeVisible();
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
