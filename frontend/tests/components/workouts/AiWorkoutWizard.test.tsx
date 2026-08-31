// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn().mockResolvedValue({ data: { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Full body', trainingSplit: 'Full body', priorityMuscleGroups: [], restrictions: [] } }) } }));
import AiWorkoutWizard from '../../../src/components/workouts/AiWorkoutWizard';
import { api } from '../../../src/services/api';

it('lets a PT edit the AI proposal before generating', async () => {
  const user = userEvent.setup();
  const onGenerated = vi.fn();
  render(<AiWorkoutWizard open customers={[{ _id: 'customer-1', fullName: 'Nguyễn An', phone: '0907' }]} onClose={vi.fn()} onGenerated={onGenerated} />);
  expect(screen.getByRole('dialog', { name: 'Tạo giáo án bằng AI' })).toHaveClass('workout-ai-wizard');
  const progress = screen.getByRole('list', { name: 'Tiến trình tạo giáo án' });
  expect(progress).toBeVisible();
  expect(screen.getByText('Chọn học viên')).toHaveAttribute('aria-current', 'step');
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  expect(screen.getByText('Chọn học viên')).toHaveAttribute('aria-current', 'step');
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
  await user.click(screen.getByRole('button', { name: 'Tạo giáo án' }));
  expect(onGenerated).toHaveBeenCalledOnce();
});

it('keeps the selected customer when proposal analysis fails', async () => {
  vi.mocked(api.post).mockRejectedValueOnce(new Error('Không thể phân tích yêu cầu.'));
  const user = userEvent.setup();
  render(<AiWorkoutWizard open customers={[{ _id: 'customer-1', fullName: 'Nguyễn An', phone: '0907' }]} onClose={vi.fn()} onGenerated={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể phân tích yêu cầu.');
  expect(screen.getByLabelText('Học viên')).toHaveValue('customer-1');
});
