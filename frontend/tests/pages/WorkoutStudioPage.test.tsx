// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '../../src/components/ui/ToastProvider';
import { api } from '../../src/services/api';
import WorkoutStudioPage from '../../src/pages/pt/WorkoutStudioPage';

vi.mock('../../src/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));

const getScheduledCards = (name: RegExp) => screen
  .getAllByRole('button', { name })
  .filter((element) => element.classList.contains('studio-scheduled-item'));

const getScheduledCard = (name: RegExp) => {
  const card = getScheduledCards(name)[0];
  if (!card) throw new Error(`Scheduled card not found: ${name}`);
  return card;
};

it('adds an exercise to a proportional day timeline and prevents overlap', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }, { _id: 'row', name: 'Barbell Row', muscleGroup: 'BACK', level: 'INTERMEDIATE', scope: 'PRIVATE' }], message: '' });
  const user = userEvent.setup();
  render(<MemoryRouter><ToastProvider><WorkoutStudioPage /></ToastProvider></MemoryRouter>);
  expect(screen.getByText('Đã lưu')).toBeVisible();
  const studioPage = screen.getByRole('region', { name: 'Workout Studio' });
  expect(studioPage).toHaveClass('module-page', 'workout-studio');
  expect(screen.getByRole('search', { name: 'Tìm bài tập trong Studio' })).toHaveClass('studio-palette');
  expect(screen.getByRole('navigation', { name: 'Thời gian giáo án' })).toBeVisible();
  const views = screen.getByRole('tablist', { name: 'Khu vực thiết kế giáo án' });
  expect(within(views).getByRole('tab', { name: 'Lịch tập' })).toHaveAttribute('aria-selected', 'true');
  const libraryTab = within(views).getByRole('tab', { name: 'Bài tập' });
  await user.click(libraryTab);
  expect(screen.getByRole('region', { name: 'Thư viện bài tập Studio' })).toHaveClass('is-mobile-active');
  expect(screen.getByRole('button', { name: 'Đóng thư viện bài tập' })).toHaveClass('studio-panel-close');
  await user.click(screen.getByRole('button', { name: 'Đóng thư viện bài tập' }));
  expect(within(views).getByRole('tab', { name: 'Lịch tập' })).toHaveAttribute('aria-selected', 'true');
  expect(libraryTab).toHaveFocus();
  const inspectorTab = within(views).getByRole('tab', { name: 'Thuộc tính' });
  await user.click(inspectorTab);
  expect(screen.getByRole('region', { name: 'Thuộc tính giáo án' })).toHaveClass('is-mobile-active');
  await user.click(screen.getByRole('button', { name: 'Đóng thuộc tính giáo án' }));
  expect(within(views).getByRole('tab', { name: 'Lịch tập' })).toHaveAttribute('aria-selected', 'true');
  expect(inspectorTab).toHaveFocus();
  await user.click(libraryTab);
  const exercise = await screen.findByRole('button', { name: 'Thêm bài Squat' });
  await user.click(exercise);
  expect(libraryTab).toHaveFocus();
  expect(within(views).getByRole('tab', { name: 'Lịch tập' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('button', { name: 'Mở thuộc tính: Squat, 08:00 đến 09:00' })).toHaveClass('studio-touch-schedule-action');
  expect(screen.getByRole('complementary', { name: 'Thuộc tính bài tập đã chọn' })).toHaveClass('studio-inspector');
  expect(screen.getByRole('button', { name: 'Bỏ khỏi lịch' })).toHaveClass('studio-inspector-danger');
  expect(screen.getByLabelText('Ngày của bài tập')).toBeVisible();
  expect(screen.getByLabelText('Giờ bắt đầu')).toBeVisible();
  expect(screen.getByLabelText('Thời lượng bài tập')).toBeVisible();
  for (const label of ['Số hiệp', 'Số lần', 'Mức tạ', 'Tempo', 'Thời gian nghỉ', 'RPE', 'RIR', 'Ghi chú bài tập']) {
    expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
  }
  expect(screen.getByText('Chưa lưu')).toBeVisible();
  expect(getScheduledCard(/Squat.*08:00–09:00/)).toHaveStyle('--studio-item-top: 640px; --studio-item-height: 80px');
  await user.click(exercise);
  expect(getScheduledCards(/Squat.*08:00–09:00/)).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Thời lượng bài tập'), { target: { value: '30' } });
  expect(getScheduledCard(/Squat.*08:00–08:30/)).toHaveStyle('--studio-item-height: 40px');
  await user.type(screen.getByLabelText('Tìm bài tập'), 'row');
  await user.click(screen.getByRole('button', { name: 'Tăng thời lượng 15 phút' }));
  expect(getScheduledCard(/Squat.*08:00.*08:45/)).toHaveStyle('--studio-item-height: 60px');
  await user.click(screen.getByRole('button', { name: 'Giảm thời lượng 15 phút' }));
  expect(screen.queryByRole('button', { name: 'Thêm bài Squat' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thêm bài Barbell Row' })).toBeVisible();
  await user.clear(screen.getByLabelText('Tìm bài tập'));
  await user.selectOptions(screen.getByLabelText('Lọc nhóm cơ'), 'LEGS');
  expect(screen.getByRole('button', { name: 'Thêm bài Squat' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Thêm bài Barbell Row' })).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Lọc nhóm cơ'), '');
  await user.selectOptions(screen.getByLabelText('Lọc cấp độ bài tập'), 'INTERMEDIATE');
  expect(screen.queryByRole('button', { name: 'Thêm bài Squat' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Thêm bài Barbell Row' })).toBeVisible();
});

it('automatically recommends library exercises from the free-text plan goal', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [
    { _id: 'squat', name: 'Squat', muscleGroup: 'Chân', level: 'BEGINNER', scope: 'PRIVATE' },
    { _id: 'chest-press', name: 'Đẩy ngực', muscleGroup: 'Ngực', level: 'INTERMEDIATE', scope: 'PRIVATE' },
  ], message: '' });
  const user = userEvent.setup();
  render(<MemoryRouter><ToastProvider><WorkoutStudioPage /></ToastProvider></MemoryRouter>);

  await screen.findByRole('button', { name: 'Thêm bài Đẩy ngực' });
  await user.type(screen.getByLabelText('Mục tiêu'), 'Phát triển cơ ngực');

  expect(screen.getByRole('heading', { name: 'Gợi ý cho giáo án' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Thêm bài đề xuất Đẩy ngực' }));
  expect(screen.getByRole('button', { name: /Đẩy ngực.*08:00–09:00/ })).toBeVisible();
});

it('moves a scheduled card with pointer events for touch devices', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }], message: '' });
  const user = userEvent.setup();
  render(<MemoryRouter><ToastProvider><WorkoutStudioPage /></ToastProvider></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
  const studio = screen.getByRole('button', { name: 'Bỏ chọn bài tập' }).closest('section');
  expect(studio).toHaveClass('inspector-open');
  await user.click(screen.getByRole('button', { name: 'Bỏ chọn bài tập' }));
  expect(studio).not.toHaveClass('inspector-open');
  const card = getScheduledCard(/Squat.*08:00.*09:00/);
  fireEvent.pointerDown(card, { clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(window, { clientY: 120, pointerId: 1 });
  expect(screen.getByText('Dự kiến 08:15–09:15')).toBeVisible();
  fireEvent.pointerUp(window, { pointerId: 1 });
  expect(getScheduledCard(/Squat.*08:15.*09:15/)).toBeVisible();
});

it('blocks internal links while the studio has unsaved changes', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], message: '' });
  const nativeConfirm = vi.spyOn(window, 'confirm');
  const user = userEvent.setup();
  function Location() { return <output data-testid="guard-location">{useLocation().pathname}</output>; }
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans/new']}><ToastProvider><Link to="/pt/dashboard">Dashboard</Link><Location /><Routes><Route path="/pt/my-workout-plans/new" element={<WorkoutStudioPage />} /><Route path="/pt/dashboard" element={<p>Dashboard page</p>} /></Routes></ToastProvider></MemoryRouter>);
  await user.type(screen.getByLabelText('Tên giáo án'), 'Draft');
  await user.click(screen.getByRole('link', { name: 'Dashboard' }));
  expect(screen.getByRole('dialog', { name: 'Rời Studio?' })).toBeVisible();
  expect(nativeConfirm).not.toHaveBeenCalled();
  expect(screen.getByTestId('guard-location')).toHaveTextContent('/pt/my-workout-plans/new');
  await user.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(screen.queryByRole('dialog', { name: 'Rời Studio?' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Dashboard' }));
  await user.click(screen.getByRole('button', { name: 'Rời Studio' }));
  expect(screen.getByTestId('guard-location')).toHaveTextContent('/pt/dashboard');
  nativeConfirm.mockRestore();
});

it('asks with the professional modal before discarding changes from the back button', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [], message: '' });
  const user = userEvent.setup();
  function Location() { return <output data-testid="back-location">{useLocation().pathname}</output>; }
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans/new']}><ToastProvider><Location /><Routes><Route path="/pt/my-workout-plans/new" element={<WorkoutStudioPage />} /><Route path="/pt/my-workout-plans" element={<p>Danh sách giáo án</p>} /></Routes></ToastProvider></MemoryRouter>);
  await user.type(screen.getByLabelText('Tên giáo án'), 'Draft');
  await user.click(screen.getByRole('button', { name: 'Về danh sách giáo án' }));
  expect(screen.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?' })).toBeVisible();
  expect(screen.getByTestId('back-location')).toHaveTextContent('/pt/my-workout-plans/new');
  await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
  expect(screen.getByTestId('back-location')).toHaveTextContent('/pt/my-workout-plans');
});

it('asks with the professional modal before shortening a plan that has affected exercises', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }], message: '' });
  const user = userEvent.setup();
  render(<MemoryRouter><ToastProvider><WorkoutStudioPage /></ToastProvider></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
  await user.selectOptions(screen.getByLabelText(/Ngày của bài tập/), '7');

  const durationInput = screen.getByLabelText(/Số ngày giáo án/);
  fireEvent.change(durationInput, { target: { value: '1' } });
  expect(screen.getByRole('dialog', { name: 'Giảm số ngày giáo án?' })).toBeVisible();
  expect(screen.getByText(/1 bài tập.*Chưa xếp lịch/)).toBeVisible();
  expect(durationInput).toHaveValue(7);

  await user.click(screen.getByRole('button', { name: 'Hủy' }));
  expect(screen.queryByRole('dialog', { name: 'Giảm số ngày giáo án?' })).not.toBeInTheDocument();
  expect(durationInput).toHaveValue(7);

  fireEvent.change(durationInput, { target: { value: '1' } });
  await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
  expect(durationInput).toHaveValue(1);
});

it('moves a selected card by 15 minutes with the keyboard and saves a new studio plan', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }], message: '' });
  vi.mocked(api.post).mockResolvedValue({ data: { _id: 'new-plan' }, message: 'Đã lưu.' });
  const user = userEvent.setup();
  function Location() { return <output data-testid="location">{useLocation().pathname}</output>; }
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans/new']}><ToastProvider><Routes><Route path="/pt/my-workout-plans/new" element={<WorkoutStudioPage />} /><Route path="/pt/my-workout-plans/:templateId/edit" element={<Location />} /></Routes></ToastProvider></MemoryRouter>);
  expect(await screen.findByRole('tab', { name: 'Giáo án' })).toHaveAttribute('aria-selected', 'true');
  await user.click(screen.getByRole('checkbox', { name: 'LEGS' }));
  await user.type(screen.getByLabelText('Sets chung'), '4');
  await user.type(screen.getByLabelText('Reps chung'), '8-12');
  await user.type(screen.getByLabelText('Weight chung'), '60-70% 1RM');
  await user.type(screen.getByLabelText('Tempo chung'), '3-1-1-0');
  await user.type(screen.getByLabelText('Ghi chú kỹ thuật chung'), 'Giữ thân người ổn định.');
  await user.type(screen.getByLabelText('Tên giáo án'), 'Studio A');
  await user.type(screen.getByLabelText('Mục tiêu'), 'Tăng cơ');
  await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
  expect(within(screen.getByRole('region', { name: 'Thuộc tính giáo án' })).getByRole('tab', { name: 'Bài tập' })).toHaveAttribute('aria-selected', 'true');
  const card = getScheduledCard(/Squat.*08:00–09:00/);
  card.focus();
  await user.keyboard('{ArrowDown}');
  expect(getScheduledCard(/Squat.*08:15–09:15/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
  expect(await screen.findByTestId('location')).toHaveTextContent('/pt/my-workout-plans/new-plan/edit');
  expect(api.post).toHaveBeenCalledWith('/api/workout-templates', expect.objectContaining({ durationDays: 7, muscleGroups: ['LEGS'], defaultSets: 4, defaultReps: '8-12', defaultWeight: '60-70% 1RM', defaultTempo: '3-1-1-0', technicalNotes: 'Giữ thân người ổn định.', scheduledExercises: [expect.objectContaining({ startMinute: 495, durationMinutes: 60 })] }));
  const payload = vi.mocked(api.post).mock.calls[0][1] as { scheduledExercises: Record<string, unknown>[] };
  for (const field of ['sets', 'reps', 'weight', 'tempo', 'restSeconds', 'rpe', 'rir', 'notes']) {
    expect(payload.scheduledExercises[0]).not.toHaveProperty(field);
  }
});

it('preserves complete legacy exercise details in the unscheduled tray when saving', async () => {
  vi.mocked(api.get).mockImplementation(async (url: string) => url.startsWith('/api/exercises')
    ? { data: [{ _id: 'squat', name: 'Squat', muscleGroup: 'LEGS', level: 'BEGINNER', scope: 'PRIVATE' }], message: '' }
    : { data: { _id: 'legacy-plan', title: 'Legacy', goal: 'Strength', level: 'INTERMEDIATE', sessions: [{ name: 'Buổi 1', exercises: [{ name: 'Legacy Row', sets: 4, reps: '8', weight: '40kg', rpe: 8, rir: 2, tempo: '3-1-1', restSeconds: 90, notes: 'Giữ lưng thẳng' }] }] }, message: '' });
  vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'legacy-plan' }, message: 'Đã lưu.' });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pt/my-workout-plans/legacy-plan/edit']}><ToastProvider><Routes><Route path="/pt/my-workout-plans/:templateId/edit" element={<WorkoutStudioPage />} /></Routes></ToastProvider></MemoryRouter>);
  await user.click(await screen.findByRole('button', { name: 'Thêm bài Squat' }));
  await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
  expect(api.patch).toHaveBeenCalledWith('/api/workout-templates/legacy-plan', expect.objectContaining({
    unscheduledExercises: [expect.objectContaining({ name: 'Legacy Row', durationMinutes: 60, sets: 4, reps: '8', weight: '40kg', rpe: 8, rir: 2, tempo: '3-1-1', restSeconds: 90, notes: 'Giữ lưng thẳng' })],
  }));
});

it('loads and saves a customer snapshot without updating the source template', async () => {
  vi.mocked(api.get).mockImplementation(async (url: string) => url.startsWith('/api/exercises')
    ? { data: [], message: '' }
    : { data: { _id: 'plan-1', customerName: 'Nguyễn An', title: 'Giáo án riêng', goal: 'Tăng cơ', level: 'BEGINNER', durationDays: 7, muscleGroups: ['LEGS'], defaultSets: 4, defaultReps: '8-12', defaultWeight: '60% 1RM', defaultTempo: '3-1-1-0', technicalNotes: 'Giữ thân ổn định.', lifecycleStatus: 'ACTIVE', sessions: [], scheduledExercises: [{ dayNumber: 1, startMinute: 480, durationMinutes: 60, name: 'Squat' }], unscheduledExercises: [] }, message: '' });
  vi.mocked(api.patch).mockResolvedValue({ data: { _id: 'plan-1' }, message: 'Đã lưu' });
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/pt/customers/customer-1/workout-plans/plan-1/edit']}><ToastProvider><Routes><Route path="/pt/customers/:customerId/workout-plans/:planId/edit" element={<WorkoutStudioPage />} /></Routes></ToastProvider></MemoryRouter>);
  expect(await screen.findByDisplayValue('Giáo án riêng')).toBeVisible();
  expect(screen.getByText(/Giáo án của Nguyễn An/)).toBeVisible();
  expect(screen.getByRole('checkbox', { name: 'LEGS' })).toBeChecked();
  expect(screen.getByLabelText('Sets chung')).toHaveValue(4);
  expect(screen.getByLabelText('Ghi chú kỹ thuật chung')).toHaveValue('Giữ thân ổn định.');
  await user.click(getScheduledCard(/Squat.*08:00–09:00/));
  await user.click(screen.getByRole('button', { name: 'Tăng thời lượng 15 phút' }));
  await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
  expect(api.patch).toHaveBeenCalledWith('/api/customers/customer-1/workout-plans/plan-1', expect.objectContaining({ durationDays: 7 }));
  expect(vi.mocked(api.patch).mock.calls.at(-1)?.[0]).toBe('/api/customers/customer-1/workout-plans/plan-1');
});
