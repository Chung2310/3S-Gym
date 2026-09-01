import type { WorkoutScheduleWarning } from '../../types/workoutAvailability';
import { minuteLabel, weekdayLabel } from '../../services/workoutAvailability';

interface Props {
  warnings: WorkoutScheduleWarning[];
}

export default function AvailabilityWarningBanner({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return <aside className="studio-availability-warning" role="alert">
    <div className="studio-availability-warning-heading">
      <strong>Có {warnings.length} buổi tập ngoài thời gian rảnh</strong>
      <span>Hãy kiểm tra và điều chỉnh trước khi lưu.</span>
    </div>
    <ul className="studio-availability-warning-list">
      {warnings.map((warning) => <li key={`${warning.weekNumber}-${warning.dayNumber}-${warning.startMinute}`}>
        Tuần {warning.weekNumber} · {weekdayLabel(warning.dayNumber)} · {minuteLabel(warning.startMinute)}–{minuteLabel(warning.endMinute)}
      </li>)}
    </ul>
  </aside>;
}
