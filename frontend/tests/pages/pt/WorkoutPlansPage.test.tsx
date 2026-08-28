// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import WorkoutPlansPage from '../../../src/pages/pt/WorkoutPlansPage';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

it('chỉ hiển thị nghiệp vụ giáo án, không hiển thị check-in và lịch sử tập', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0 }, message: '' });
  render(
    <ToastProvider>
      <WorkoutPlansPage />
    </ToastProvider>
  );
  expect(screen.getByRole('heading', { name: 'Giáo án' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Check-in buổi tập' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Mã khách hàng xem lịch sử')).not.toBeInTheDocument();
});
