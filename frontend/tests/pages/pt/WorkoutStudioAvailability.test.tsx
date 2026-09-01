// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import WorkoutStudioPage from '../../../src/pages/pt/WorkoutStudioPage';
import { ToastProvider } from '../../../src/components/ui/ToastProvider';
import { api } from '../../../src/services/api';

const aiWorkoutDraft = {
  title: 'AI 8 tuần',
  goal: 'Tăng sức mạnh',
  level: 'BEGINNER',
  durationWeeks: 8,
  availabilitySlots: [{ dayNumber: 1, startMinute: 1080, endMinute: 1200 }],
  scheduleWarnings: [{
    type: 'OUTSIDE_AVAILABILITY',
    weekNumber: 1,
    dayNumber: 1,
    startMinute: 1020,
    endMinute: 1080,
  }],
  scheduledExercises: [{
    weekNumber: 1,
    dayNumber: 1,
    startMinute: 1020,
    durationMinutes: 60,
    name: 'Squat',
    trackingType: 'STRENGTH',
    prescription: {},
  }],
  generatedExercises: [],
};

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue({ data: [], message: '' });
  vi.mocked(api.post).mockReset().mockResolvedValue({
    data: { _id: 'template-1' },
    message: 'Đã lưu giáo án.',
  });
  vi.mocked(api.patch).mockReset();
});

it('excludes availability slots and warnings from save payload', async () => {
  const user = userEvent.setup();
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[{
        pathname: '/pt/my-workout-plans/new',
        state: { aiWorkoutDraft },
      }]}>
        <Routes>
          <Route path="/pt/my-workout-plans/new" element={<WorkoutStudioPage />} />
          <Route path="/pt/my-workout-plans/:templateId/edit" element={<p>Đã lưu</p>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  );

  expect(screen.getByLabelText('Số ngày giáo án')).toHaveValue(56);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Lưu giáo án' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledOnce());
  const payload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>;
  expect(payload).not.toHaveProperty('availabilitySlots');
  expect(payload).not.toHaveProperty('scheduleWarnings');
  expect(payload).toMatchObject({ durationDays: 56 });
});
