import { DAY_MINUTES, formatMinute, SLOT_MINUTES, snapMinute } from '../../services/workoutStudioModel';
import type { ScheduledExercise } from '../../types/workoutStudio';
import { changeTrackingType } from '../../utils/exerciseTracking';
import PrescriptionEditor from '../workouts/tracking/PrescriptionEditor';
import TrackingTypeSelect from '../workouts/tracking/TrackingTypeSelect';

interface Props {
  selected?: ScheduledExercise;
  days: number[];
  onUpdate: (patch: Partial<ScheduledExercise>) => void;
  onUnscheduled: () => void;
  readOnly?: boolean;
}

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20';
const durationButtonClass = 'h-9 w-9 shrink-0 rounded-lg border border-slate-300 bg-slate-50 text-lg font-semibold text-slate-700 transition hover:border-secondary hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-40';

export default function ExerciseInspector({ selected, days, onUpdate, onUnscheduled, readOnly }: Props) {
  return (
    <div className="grid gap-2">
      <h2>Lịch bài tập</h2>
      {selected ? <>
        <strong className="truncate text-sm text-slate-900" title={selected.name}>{selected.name}</strong>
        <label>Ngày
          <select className={fieldClass} aria-label="Ngày của bài tập" value={selected.dayNumber} disabled={readOnly} onChange={(event) => onUpdate({ dayNumber: Number(event.target.value) })}>
            {days.map((day) => <option key={day} value={day}>Ngày {day}</option>)}
          </select>
        </label>
        <label>Giờ bắt đầu
          <input className={fieldClass} aria-label="Giờ bắt đầu" placeholder="Ví dụ: 08:00" type="time" step="900" value={formatMinute(selected.startMinute)} disabled={readOnly} onChange={(event) => {
            const [hour, minute] = event.target.value.split(':').map(Number);
            onUpdate({ startMinute: snapMinute(hour * 60 + minute) });
          }} />
        </label>
        <label>Thời lượng
          <span className="flex items-center gap-1.5">
            <button className={durationButtonClass} type="button" aria-label="Giảm thời lượng 15 phút" disabled={readOnly || selected.durationMinutes <= SLOT_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes - SLOT_MINUTES })}>−</button>
            <input className={`${fieldClass} min-w-0 text-center`} aria-label="Thời lượng bài tập" placeholder="Ví dụ: 60 phút" type="number" min="15" max="1440" step="15" value={selected.durationMinutes} disabled={readOnly} onChange={(event) => onUpdate({ durationMinutes: Number(event.target.value) })} />
            <button className={durationButtonClass} type="button" aria-label="Tăng thời lượng 15 phút" disabled={readOnly || selected.startMinute + selected.durationMinutes >= DAY_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes + SLOT_MINUTES })}>+</button>
          </span>
        </label>
        <div className="mt-2 grid gap-2 border-t border-slate-200 pt-3">
          <TrackingTypeSelect exerciseName={selected.name} value={selected.trackingType ?? 'UNCLASSIFIED'} disabled={readOnly} onChange={(trackingType) => onUpdate(changeTrackingType(selected, trackingType))} />
          <p className="text-xs leading-5 text-slate-500">Chỉ áp dụng cho giáo án này.</p>
          <PrescriptionEditor exerciseName={selected.name} trackingType={selected.trackingType ?? 'UNCLASSIFIED'} value={selected.prescription ?? {}} disabled={readOnly} onChange={(prescription) => onUpdate({ prescription })} />
        </div>
        {!readOnly && <button className="button button-secondary mt-1 w-full" type="button" onClick={onUnscheduled}>Đưa về chưa xếp lịch</button>}
      </> : <p className="text-xs leading-5 text-slate-500">Chọn một thẻ trên timeline để chỉnh lịch.</p>}
    </div>
  );
}
