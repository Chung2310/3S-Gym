// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn() } }));
import AiWorkoutWizard from '../../../src/components/workouts/AiWorkoutWizard';
import { api } from '../../../src/services/api';

const proposal = { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Full body', trainingSplit: 'Full body', priorityMuscleGroups: [], restrictions: [] };
const customers = [{ _id: 'customer-1', fullName: 'Nguyễn An', phone: '0907' }];

beforeEach(() => {
  vi.mocked(api.post).mockReset().mockImplementation(async (path) => ({
    data: path === '/api/ai/workout-generations' ? { title: 'Bản nháp AI' } : proposal,
    message: '',
  }));
});

it('requires availability before proposal analysis', async () => {
  const user = userEvent.setup();
  render(<AiWorkoutWizard open customers={customers} onClose={vi.fn()} onGenerated={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Thêm khung giờ Thứ 2' }));
  await user.click(screen.getByRole('button', { name: 'Xóa khung giờ Thứ 2, khung 1' }));
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('ít nhất một khung giờ rảnh');
  expect(api.post).not.toHaveBeenCalled();
});

it('lets a PT edit the AI proposal before generating', async () => {
  const user = userEvent.setup();
  const onGenerated = vi.fn();
  render(<AiWorkoutWizard open customers={customers} onClose={vi.fn()} onGenerated={onGenerated} />);
  expect(screen.getByRole('dialog', { name: 'Tạo giáo án bằng AI' })).toHaveClass('workout-ai-wizard');
  const progress = screen.getByRole('list', { name: 'Tiến trình tạo giáo án' });
  expect(progress).toBeVisible();
  expect(screen.getByText('Chọn học viên')).toHaveAttribute('aria-current', 'step');
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Thêm khung giờ Thứ 2' }));
  await user.selectOptions(screen.getByLabelText('Kết thúc Thứ 2, khung 1'), '1440');
  expect(screen.getByText('Chọn học viên')).toHaveAttribute('aria-current', 'step');
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(api.post).toHaveBeenNthCalledWith(1, '/api/ai/workout-proposals', {
    customerId: 'customer-1',
    availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1440 }],
  });
  expect(await screen.findByText('Duyệt phân tích')).toHaveAttribute('aria-current', 'step');
  expect(screen.getByText('1 ngày rảnh · 1 khung giờ')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  expect(screen.getByLabelText('Bắt đầu Thứ 2, khung 1')).toHaveValue('18:00');
  expect(screen.getByLabelText('Kết thúc Thứ 2, khung 1')).toHaveValue('1440');
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(await screen.findByText('Duyệt phân tích')).toHaveAttribute('aria-current', 'step');
  expect(screen.queryByLabelText('Số buổi mỗi tuần')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Tiếp tục cấu hình' }));
  expect(screen.getByText('Cấu hình')).toHaveAttribute('aria-current', 'step');
  expect(await screen.findByLabelText('Số buổi mỗi tuần')).toHaveValue(4);
  await user.clear(screen.getByLabelText('Số tuần'));
  await user.type(screen.getByLabelText('Số tuần'), '1');
  await user.click(screen.getByRole('button', { name: 'Tiếp tục tạo giáo án' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Số tuần phải từ 4 đến 12');
  await user.clear(screen.getByLabelText('Số tuần'));
  await user.type(screen.getByLabelText('Số tuần'), '8');
  await user.click(screen.getByRole('button', { name: 'Tiếp tục tạo giáo án' }));
  expect(within(progress).getByText('Tạo giáo án')).toHaveAttribute('aria-current', 'step');
  expect(screen.getByText('1 ngày rảnh · 1 khung giờ')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tạo giáo án' }));
  expect(api.post).toHaveBeenLastCalledWith('/api/ai/workout-generations', {
    customerId: 'customer-1',
    proposal,
    availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1440 }],
    additionalRequest: '',
  });
  expect(onGenerated).toHaveBeenCalledWith({ title: 'Bản nháp AI' });
});

it('keeps the selected customer and availability when proposal analysis fails', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Không thể phân tích yêu cầu.'));
  const user = userEvent.setup();
  render(<AiWorkoutWizard open customers={customers} onClose={vi.fn()} onGenerated={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Thêm khung giờ Thứ 2' }));
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phân tích yêu cầu.');
  expect(screen.getByLabelText('Học viên')).toHaveValue('customer-1');
  expect(screen.getByLabelText('Bắt đầu Thứ 2, khung 1')).toHaveValue('18:00');
});

it('keeps the proposal and availability when draft generation fails', async () => {
  vi.mocked(api.post)
    .mockResolvedValueOnce({ data: proposal, message: '' })
    .mockRejectedValueOnce(new Error('Không thể tạo bản nháp.'));
  const user = userEvent.setup();
  render(<AiWorkoutWizard open customers={customers} onClose={vi.fn()} onGenerated={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Thêm khung giờ Thứ 2' }));
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  await user.click(await screen.findByRole('button', { name: 'Tiếp tục cấu hình' }));
  await user.click(screen.getByRole('button', { name: 'Tiếp tục tạo giáo án' }));
  await user.click(screen.getByRole('button', { name: 'Tạo giáo án' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tạo bản nháp.');
  expect(screen.getByText('1 ngày rảnh · 1 khung giờ')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  await user.click(screen.getByRole('button', { name: 'Quay lại' }));
  expect(screen.getByLabelText('Học viên')).toHaveValue('customer-1');
  expect(screen.getByLabelText('Bắt đầu Thứ 2, khung 1')).toHaveValue('18:00');
});
