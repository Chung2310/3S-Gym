// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import StrengthResultEditor from '../../../src/components/progress/tracking/StrengthResultEditor';
import BodyweightResultEditor from '../../../src/components/progress/tracking/BodyweightResultEditor';
import CardioResultEditor from '../../../src/components/progress/tracking/CardioResultEditor';
import IntervalResultEditor from '../../../src/components/progress/tracking/IntervalResultEditor';
import MobilityResultEditor from '../../../src/components/progress/tracking/MobilityResultEditor';
import type { BodyweightResult, CardioResult, IntervalResult, MobilityResult, StrengthResult } from '../../../src/types';

it('renders explicit strength sets and supports adding and removing a set', async () => {
  function Harness() {
    const [value, setValue] = useState<StrengthResult>({ sets: [{ id: '1', completed: true }, { id: '2', completed: true }, { id: '3', completed: true }] });
    return <StrengthResultEditor exerciseName="Squat" prescription={{ sets: 3, reps: '10' }} value={value} onChange={setValue} />;
  }
  const user = userEvent.setup(); render(<Harness />);
  expect(screen.getByText('Set 1')).toBeVisible(); expect(screen.getByText('Set 3')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Thêm set cho Squat' }));
  expect(screen.getByText('Set 4')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Xóa set 4 của Squat' }));
  expect(screen.queryByText('Set 4')).not.toBeInTheDocument();
});

it('renders bodyweight with optional added weight', () => {
  render(<BodyweightResultEditor exerciseName="Pull-up" prescription={{ sets: 3, reps: '8' }} value={{ sets: [{ id: '1', completed: true }] }} onChange={vi.fn<(value: BodyweightResult) => void>()} />);
  expect(screen.getByLabelText('Pull-up set 1 tạ thêm')).toBeVisible();
  expect(screen.queryByLabelText('Pull-up set 1 mức tạ')).not.toBeInTheDocument();
});

it('renders cardio fields without strength fields', () => {
  render(<CardioResultEditor exerciseName="Treadmill Run" prescription={{ durationMinutes: 20, distanceKm: 3 }} value={{} as CardioResult} onChange={vi.fn()} />);
  expect(screen.getByLabelText('Treadmill Run thời lượng (phút)')).toBeVisible();
  expect(screen.getByLabelText('Treadmill Run quãng đường (km)')).toBeVisible();
  expect(screen.queryByText('Mức tạ')).not.toBeInTheDocument();
  expect(screen.queryByText('REPS')).not.toBeInTheDocument();
});

it('renders interval work and rest metrics', () => {
  render(<IntervalResultEditor exerciseName="Bike Interval" prescription={{ rounds: 6, workSeconds: 30, restSeconds: 30 }} value={{} as IntervalResult} onChange={vi.fn()} />);
  expect(screen.getByLabelText('Bike Interval số vòng')).toBeVisible();
  expect(screen.getByLabelText('Bike Interval thời gian làm (giây)')).toBeVisible();
  expect(screen.getByLabelText('Bike Interval thời gian nghỉ (giây)')).toBeVisible();
});

it('renders mobility side and discomfort', () => {
  render(<MobilityResultEditor exerciseName="Hip Flow" prescription={{ durationMinutes: 5, side: 'BOTH' }} value={{} as MobilityResult} onChange={vi.fn()} />);
  expect(screen.getByLabelText('Hip Flow bên tập')).toBeVisible();
  expect(screen.getByLabelText('Hip Flow mức khó chịu')).toBeVisible();
});
