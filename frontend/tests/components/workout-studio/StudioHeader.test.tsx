// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import StudioHeader from '../../../src/components/workout-studio/StudioHeader';

it('shows a persistent title above every workout plan header field', () => {
  render(<StudioHeader
    title="Giáo án tăng cơ"
    goal="Tăng cơ"
    level="BEGINNER"
    durationDays={7}
    dirty={false}
    saving={false}
    onBack={vi.fn()}
    onTitleChange={vi.fn()}
    onGoalChange={vi.fn()}
    onLevelChange={vi.fn()}
    onDurationDaysChange={vi.fn()}
    onSave={vi.fn()}
  />);

  const fields = [
    ['Tên giáo án', 'Tên giáo án'],
    ['Mục tiêu', 'Mục tiêu'],
    ['Cấp độ', 'Cấp độ giáo án'],
    ['Số ngày', 'Số ngày giáo án'],
  ];
  for (const [title, accessibleName] of fields) {
    expect(screen.getByText(title, { selector: '[data-field-title]' })).toBeVisible();
    expect(screen.getByLabelText(accessibleName)).toBeVisible();
  }
  expect(screen.getByRole('banner', { name: 'Thông tin giáo án' })).toHaveClass('studio-header');
  expect(screen.getByRole('status')).toHaveClass('studio-save-state', 'is-saved');
  expect(screen.getByRole('group', { name: 'Thông tin cơ bản' })).toHaveClass('studio-header-fields');
});

it('allows replacing the plan duration by clearing the current value first', async () => {
  const user = userEvent.setup();
  const onDurationDaysChange = vi.fn();
  function DurationHarness() {
    const [durationDays, setDurationDays] = useState(7);
    return <StudioHeader
      title="Giáo án tăng cơ"
      goal="Tăng cơ"
      level="BEGINNER"
      durationDays={durationDays}
      dirty={false}
      saving={false}
      onBack={vi.fn()}
      onTitleChange={vi.fn()}
      onGoalChange={vi.fn()}
      onLevelChange={vi.fn()}
      onDurationDaysChange={(value) => {
        onDurationDaysChange(value);
        setDurationDays(value);
      }}
      onSave={vi.fn()}
    />;
  }
  render(<DurationHarness />);

  const durationInput = screen.getByLabelText('Số ngày giáo án');
  await user.clear(durationInput);

  expect(durationInput).toHaveValue(null);
  expect(onDurationDaysChange).not.toHaveBeenCalled();

  await user.type(durationInput, '14');

  expect(durationInput).toHaveValue(14);
  expect(onDurationDaysChange).toHaveBeenLastCalledWith(14);
});
