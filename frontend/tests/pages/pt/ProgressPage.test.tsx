// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressPage from '../../../src/pages/pt/ProgressPage';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const analytics = { totalVolume: 500, averageRpe: 8, attendance: { present: 1, late: 0, absent: 0, rate: 100 }, streakWeeks: 1, bodyDeltas: { weight: -1 }, achievements: [], dataQuality: { level: 'PARTIAL', reasons: [] } };
const overview = { customer: { _id: 'c1', fullName: 'Nguyễn An', phone: '0901', status: 'ACTIVE' }, sessionCount: 1, lastSessionAt: '2026-08-29', latestMeasurement: { weight: 68 }, analytics };
const journey = { customer: overview.customer, sessions: [], measurements: [], calendar: [], photos: [], plans: { active: { _id: 'p1', sourceTemplateId: 't1', title: 'Giáo án 12 tuần', sessions: [{ name: 'Buổi chân', exercises: [] }] }, history: [] }, reports: [], analytics };

beforeEach(() => { vi.mocked(api.get).mockImplementation(async (path: string) => path === '/api/customers/progress-overview' ? { data: [overview], message: '' } : { data: journey, message: '' }); });

it('shows the assigned-customer dashboard and opens separate detail and workout dialogs', async () => {
  const user = userEvent.setup(); render(<ToastProvider><ProgressPage /></ToastProvider>);
  expect(await screen.findByText('Nguyễn An')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Xem tiến độ Nguyễn An' }));
  expect(await screen.findByRole('dialog', { name: 'Tiến độ Nguyễn An' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Đóng' }));
  await user.click(screen.getByRole('button', { name: 'Ghi nhận buổi tập Nguyễn An' }));
  expect(await screen.findByRole('dialog', { name: 'Ghi nhận buổi tập · Nguyễn An' })).toBeVisible();
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/customers/c1/journey'));
});
