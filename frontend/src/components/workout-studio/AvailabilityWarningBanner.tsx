import type { WorkoutScheduleWarning } from '../../types/workoutAvailability';
import { minuteLabel, weekdayLabel } from '../../services/workoutAvailability';

interface Props {
  warnings: WorkoutScheduleWarning[];
}

export default function AvailabilityWarningBanner(_props: Props) {
  return null;
}
