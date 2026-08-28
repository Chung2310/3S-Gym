// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import CustomerWorkoutPlanPanel from '../../../src/components/workouts/CustomerWorkoutPlanPanel';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

it('lọc và công bố giáo án khách hàng sau bước xác nhận', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: [{ _id: 'p1', customerId: 'c1', title: 'Plan A', startDate: '', endDate: '', sessions: [], status: 'DRAFT' }],
    meta: { page: 1, totalPages: 1 },
    message: '',
  });
  vi.mocked(api.patch).mockResolvedValue({ data: {}, message: 'Đã công bố.' });
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <CustomerWorkoutPlanPanel />
    </ToastProvider>
  );
  expect((await screen.findAllByText('Plan A'))[0]).toBeVisible();
  await user.type(screen.getByLabelText('Mã khách hàng'), 'c1');
  await user.selectOptions(screen.getByLabelText('Lọc theo trạng thái'), 'DRAFT');
  await user.click(screen.getByRole('button', { name: 'Lọc' }));
  expect(api.get).toHaveBeenLastCalledWith(expect.stringContaining('customerId=c1'));
  await user.click(screen.getAllByRole('button', { name: 'Công bố' })[0]);
  expect(api.patch).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Xác nhận công bố' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/api/workout-plans/p1/publish'));
});
