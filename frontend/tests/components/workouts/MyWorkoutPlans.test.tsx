// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';
import MyWorkoutPlans from '../../../src/components/workouts/MyWorkoutPlans';

vi.mock('../../../src/services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), upload: vi.fn() },
}));

const template = {
  _id: 'template-1',
  title: 'Full body cho người mới',
  goal: 'Tăng cơ',
  level: 'BEGINNER',
  version: 1,
  status: 'ACTIVE' as const,
  sessions: [{ name: 'Buổi 1', exercises: [] }],
};

function Location() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'template-2' }, message: 'Tạo giáo án thành công.' });
  vi.mocked(api.patch).mockResolvedValue({ data: template, message: 'Cập nhật giáo án thành công.' });
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path.startsWith('/api/workout-templates?')) return { data: [template], meta: { page: 1, totalPages: 1 }, message: '' };
    return { data: [], meta: { page: 1, totalPages: 0 }, message: '' };
  });
});

it('mở Studio khi nhấn nút Tạo giáo án', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><Routes><Route path="/pt/my-workout-plans" element={<MyWorkoutPlans />} /><Route path="/pt/my-workout-plans/new" element={<Location />} /></Routes></ToastProvider></MemoryRouter>);

  expect(screen.getByRole('heading', { name: 'Giáo án của tôi' })).toBeVisible();
  expect((await screen.findAllByText(template.title))[0]).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tạo giáo án' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/pt/my-workout-plans/new');
});

it('mở Studio edit khi sửa giáo án', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><Routes><Route path="/pt/my-workout-plans" element={<MyWorkoutPlans />} /><Route path="/pt/my-workout-plans/:templateId/edit" element={<Location />} /></Routes></ToastProvider></MemoryRouter>);
  const card = await screen.findByRole('article', { name: template.title });
  expect(card).toHaveClass('p-6');
  expect(card).toHaveTextContent('1 buổi');
  expect(card).toHaveTextContent('Cơ bản');
  await user.click(screen.getByRole('button', { name: `Chỉnh sửa ${template.title}` }));
  expect(screen.getByTestId('location')).toHaveTextContent('/pt/my-workout-plans/template-1/edit');
});

it('vẫn mở Studio edit cho giáo án đã lưu trữ', async () => {
  const user = userEvent.setup();
  const archivedTemplate = { ...template, _id: 'template-archived', status: 'ARCHIVED' as const };
  vi.mocked(api.get).mockImplementation(async (path) => {
    if (path.startsWith('/api/workout-templates?')) return { data: [archivedTemplate], meta: { page: 1, totalPages: 1 }, message: '' };
    return { data: [], meta: { page: 1, totalPages: 0 }, message: '' };
  });
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><Routes><Route path="/pt/my-workout-plans" element={<MyWorkoutPlans />} /><Route path="/pt/my-workout-plans/:templateId/edit" element={<Location />} /></Routes></ToastProvider></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: `Chỉnh sửa ${archivedTemplate.title}` }));
  expect(screen.getByTestId('location')).toHaveTextContent('/pt/my-workout-plans/template-archived/edit');
});

it('không gán khách hàng từ danh sách giáo án mẫu', async () => {
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><Routes><Route path="/pt/my-workout-plans" element={<MyWorkoutPlans />} /></Routes></ToastProvider></MemoryRouter>);
  await screen.findAllByText(template.title);
  expect(screen.queryByRole('button', { name: 'Gán cho khách hàng' })).not.toBeInTheDocument();
});

it('mặc định hiển thị tab Giáo án của tôi', async () => {
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><MyWorkoutPlans /></ToastProvider></MemoryRouter>);

  expect(screen.getByRole('tab', { name: 'Giáo án của tôi' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findAllByText(template.title)).not.toHaveLength(0);
  expect(screen.queryByRole('heading', { name: 'Thư viện bài tập' })).not.toBeInTheDocument();
});

it('mở trực tiếp tab Thư viện bài tập qua URL', async () => {
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans?tab=exercises']}><ToastProvider><MyWorkoutPlans /></ToastProvider></MemoryRouter>);

  expect(screen.getByRole('tab', { name: 'Thư viện bài tập' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByRole('heading', { name: 'Thư viện bài tập' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Tạo giáo án' })).not.toBeInTheDocument();
});

it('cập nhật URL khi chọn tab Thư viện bài tập', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans']}><ToastProvider><MyWorkoutPlans /><Location /></ToastProvider></MemoryRouter>);

  await user.click(screen.getByRole('tab', { name: 'Thư viện bài tập' }));

  expect(screen.getByTestId('location')).toHaveTextContent('/pt/my-workout-plans?tab=exercises');
});

it('chuẩn hóa tab không hợp lệ về Giáo án của tôi', async () => {
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans?tab=unknown']}><ToastProvider><MyWorkoutPlans /></ToastProvider></MemoryRouter>);

  expect(screen.getByRole('tab', { name: 'Giáo án của tôi' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findAllByText(template.title)).not.toHaveLength(0);
});
