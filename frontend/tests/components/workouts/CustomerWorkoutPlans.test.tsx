// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import CustomerWorkoutPlans from '../../../src/components/workouts/CustomerWorkoutPlans';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const template = {
  _id: 'template-1',
  title: 'Giáo án tăng cơ 3 buổi',
  goal: 'Tăng cơ',
  level: 'BEGINNER',
  version: 1,
  status: 'ACTIVE' as const,
  sessions: [{ name: 'Buổi thân trên', exercises: [{ name: 'Bench Press', sets: 3, reps: '10', restSeconds: 60 }] }],
};

function Location() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

it('tải template, mở form điền sẵn và xóa templateId khỏi URL', async () => {
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path === '/api/workout-templates/template-1') return { data: template, message: '' };
    return { data: [], meta: { page: 1, totalPages: 0 }, message: '' };
  });

  render(
    <MemoryRouter initialEntries={['/pt/customer-workout-plans?templateId=template-1']}>
      <ToastProvider>
        <Routes>
          <Route path="/pt/customer-workout-plans" element={<><CustomerWorkoutPlans /><Location /></>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );

  await waitFor(() => expect(screen.getByLabelText('Tên giáo án')).toHaveValue(template.title));
  expect(screen.getByLabelText('Tên buổi 1')).toHaveValue('Buổi thân trên');
  await waitFor(() => {
    expect(screen.getByTestId('location')).toHaveTextContent('/pt/customer-workout-plans');
    expect(screen.getByTestId('location')).not.toHaveTextContent('templateId');
  });
});

it('thông báo lỗi, làm sạch URL và giữ module hoạt động khi template không hợp lệ', async () => {
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path === '/api/workout-templates/missing') throw new Error('Không tìm thấy giáo án mẫu.');
    return { data: [], meta: { page: 1, totalPages: 0 }, message: '' };
  });

  render(
    <MemoryRouter initialEntries={['/pt/customer-workout-plans?templateId=missing']}>
      <ToastProvider>
        <Routes>
          <Route path="/pt/customer-workout-plans" element={<><CustomerWorkoutPlans /><Location /></>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );

  expect(await screen.findByText('Không tìm thấy giáo án mẫu.')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Giáo án khách hàng' })).toBeVisible();
  await waitFor(() => expect(screen.getByTestId('location')).not.toHaveTextContent('templateId'));
});
