// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import ProgressPage from '../../../src/pages/pt/ProgressPage';
import { api } from '../../../src/services/api';
import type { CustomerJourneyDto } from '../../../src/types/progress';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn() },
}));

vi.mock('../../../src/components/ui/CustomerSelect', () => ({
  default: ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
    <select
      aria-label="Chọn học viên"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Chọn học viên</option>
      <option value="c1">Nguyễn An</option>
    </select>
  ),
}));

const journey = {
  customer: { _id: 'c1', fullName: 'Nguyễn An', phone: '0909123456' },
  sessions: [],
  measurements: [],
  calendar: [],
  photos: [],
  plans: { active: null, history: [] },
  reports: [],
  analytics: {
    totalVolume: 4200,
    averageRpe: 7.8,
    attendance: { present: 6, late: 1, absent: 1, rate: 87.5 },
    streakWeeks: 4,
    achievements: [],
    dataQuality: { level: 'COMPLETE', reasons: [] },
  },
} as unknown as CustomerJourneyDto;

function renderPage() {
  return render(
    <ToastProvider>
      <ProgressPage />
    </ToastProvider>
  );
}

describe('ProgressPage', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('guides the PT before a customer is selected', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Chọn học viên để xem tiến độ' })).toBeVisible();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('loads and renders the selected customer journey', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: journey, message: 'Thành công' });
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Chọn học viên'), 'c1');

    expect(await screen.findByRole('heading', { name: 'Nguyễn An' })).toBeVisible();
    expect(api.get).toHaveBeenCalledWith('/api/customers/c1/journey');
    expect(screen.getAllByText('4.200 kg')).toHaveLength(1);
  });

  it('shows a shaped loading state while the first journey request is pending', async () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => undefined));
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Chọn học viên'), 'c1');

    expect(screen.getByRole('status', { name: 'Đang tải dữ liệu tiến độ' })).toBeVisible();
  });

  it('renders an inline retry after an initial failure', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('Mất kết nối'))
      .mockResolvedValueOnce({ data: journey, message: 'Thành công' });
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Chọn học viên'), 'c1');
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    await user.click(retry);

    expect(await screen.findByRole('heading', { name: 'Nguyễn An' })).toBeVisible();
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('clears the loaded workspace when the selector is reset', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: journey, message: 'Thành công' });
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText('Chọn học viên'), 'c1');
    await screen.findByRole('heading', { name: 'Nguyễn An' });
    await user.selectOptions(screen.getByLabelText('Chọn học viên'), '');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Chọn học viên để xem tiến độ' })).toBeVisible();
    });
    expect(screen.queryByText('4.200 kg')).not.toBeInTheDocument();
  });
});
