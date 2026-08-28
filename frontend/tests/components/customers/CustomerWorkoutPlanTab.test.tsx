// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import CustomerWorkoutPlanTab from '../../../src/components/customers/CustomerWorkoutPlanTab';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';

vi.mock('../../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

it('assigns a template in the customer tab and opens the customer Studio', async () => {
  const active = { _id: 'plan-1', title: 'Tăng cơ', goal: 'Tăng cơ', level: 'BEGINNER', durationDays: 7, lifecycleStatus: 'ACTIVE', assignedAt: '2026-08-28', scheduledExercises: [] };
  vi.mocked(api.get).mockImplementation(async (url: string) => url.includes('workout-templates')
    ? { data: [{ _id: 'template-1', title: 'Tăng cơ', goal: 'Tăng cơ', level: 'BEGINNER', durationDays: 7, scheduledExercises: [] }], message: '' }
    : { data: { active: null, history: [] }, message: '' });
  vi.mocked(api.post).mockResolvedValue({ data: active, message: 'Đã gán' });
  const user = userEvent.setup();
  function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
  render(<MemoryRouter><ToastProvider><Routes><Route path="*" element={<><CustomerWorkoutPlanTab customerId="customer-1" customerName="Nguyễn An" /><Location /></>} /></Routes></ToastProvider></MemoryRouter>);

  expect(await screen.findByText('Khách hàng chưa có giáo án')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Gán giáo án' }));
  expect(api.get).toHaveBeenCalledWith('/api/workout-templates?page=1&limit=100');
  const dialogPanel = screen.getByRole('dialog', { name: 'Chọn giáo án mẫu' }).querySelector('section');
  expect(dialogPanel).toHaveClass('max-w-[560px]', 'rounded-xl', 'p-4', 'sm:p-6');
  const templateOption = await screen.findByRole('button', { name: /Tăng cơ.*7 ngày/ });
  expect(templateOption).toHaveClass('rounded-lg', 'p-4');
  await user.click(templateOption);
  await user.click(screen.getByRole('button', { name: 'Xác nhận gán' }));
  expect(api.post).toHaveBeenCalledWith('/api/customers/customer-1/workout-plans/assign', { templateId: 'template-1' });
  expect(await screen.findByText('Giáo án đang áp dụng')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Mở Studio' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/pt/customers/customer-1/workout-plans/plan-1/edit');
});
