// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
vi.mock('../../../src/services/api', () => ({ api: { post: vi.fn().mockResolvedValue({ data: { durationWeeks: 8, sessionsPerWeek: 4, minutesPerSession: 60, level: 'BEGINNER', trainingMethod: 'Full body', trainingSplit: 'Full body', priorityMuscleGroups: [], restrictions: [] } }) } }));
import AiWorkoutWizard from '../../../src/components/workouts/AiWorkoutWizard';

it('lets a PT edit the AI proposal before generating', async () => {
  const user = userEvent.setup();
  render(<AiWorkoutWizard open customers={[{ _id: 'customer-1', fullName: 'Nguyễn An', phone: '0907' }]} onClose={vi.fn()} onGenerated={vi.fn()} />);
  await user.selectOptions(screen.getByLabelText('Học viên'), 'customer-1');
  await user.click(screen.getByRole('button', { name: 'Phân tích bằng AI' }));
  expect(await screen.findByLabelText('Số buổi mỗi tuần')).toHaveValue(4);
});
