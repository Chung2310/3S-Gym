// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import PtDashboardPage from '../../../src/pages/pt/PtDashboardPage';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn() } }));

it('hiển thị explainability và không xếp hạng khi rank null', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      totalCustomers: 1,
      openAlerts: 0,
      customers: [
        {
          customerId: 'c1',
          fullName: 'Khách A',
          dataStatus: 'INSUFFICIENT_DATA',
          rank: null,
          score: null,
          scoreBreakdown: null,
          sourcePath: '/api/progress/c1',
        },
      ],
    },
    message: '',
  });
  render(
    <MemoryRouter>
      <ToastProvider>
        <PtDashboardPage />
      </ToastProvider>
    </MemoryRouter>
  );
  expect(await screen.findByText('Cần ≥ 2 lần InBody')).toBeVisible();
  expect(screen.getByText('Chưa đủ dữ liệu InBody đối chiếu')).toBeVisible();
  expect(screen.queryByText(/Hạng #/)).not.toBeInTheDocument();
});
