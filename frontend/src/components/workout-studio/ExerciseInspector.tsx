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

export default function ExerciseInspector({ selected, days, onUpdate, onUnscheduled, readOnly }: Props) {
  if (!selected) return <div className="studio-inspector-empty"><h2>Lịch bài tập</h2><p>Chọn một thẻ trên timeline để chỉnh lịch.</p></div>;

  return <aside className="studio-inspector" aria-label="Thuộc tính bài tập đã chọn">
      <header className="studio-inspector-header"><h2>Lịch bài tập</h2><strong title={selected.name}>{selected.name}</strong></header>
      <div className="studio-inspector-fields">
        <label>Ngày
          <select aria-label="Ngày của bài tập" value={selected.dayNumber} disabled={readOnly} onChange={(event) => onUpdate({ dayNumber: Number(event.target.value) })}>
            {days.map((day) => <option key={day} value={day}>Ngày {day}</option>)}
          </select>
        </label>
        <label>Giờ bắt đầu
          <input aria-label="Giờ bắt đầu" placeholder="Ví dụ: 08:00" type="time" step="900" value={formatMinute(selected.startMinute)} disabled={readOnly} onChange={(event) => {
            const [hour, minute] = event.target.value.split(':').map(Number);
            onUpdate({ startMinute: snapMinute(hour * 60 + minute) });
          }} />
        </label>
      </div>
      <div className="studio-inspector-duration">
        <span>Thời lượng</span>
        <div>
          <button type="button" aria-label="Giảm thời lượng 15 phút" disabled={readOnly || selected.durationMinutes <= SLOT_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes - SLOT_MINUTES })}>−</button>
          <input aria-label="Thời lượng bài tập" placeholder="Ví dụ: 60 phút" type="number" min="15" max="1440" step="15" value={selected.durationMinutes} disabled={readOnly} onChange={(event) => onUpdate({ durationMinutes: Number(event.target.value) })} />
          <button type="button" aria-label="Tăng thời lượng 15 phút" disabled={readOnly || selected.startMinute + selected.durationMinutes >= DAY_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes + SLOT_MINUTES })}>+</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4">
        <TrackingTypeSelect exerciseName={selected.name} value={selected.trackingType ?? 'UNCLASSIFIED'} disabled={readOnly} onChange={(trackingType) => onUpdate(changeTrackingType(selected, trackingType))} />
        <p className="text-xs leading-5 text-slate-500">Chỉ áp dụng cho giáo án này.</p>
        <PrescriptionEditor exerciseName={selected.name} trackingType={selected.trackingType ?? 'UNCLASSIFIED'} value={selected.prescription ?? {}} disabled={readOnly} onChange={(prescription) => onUpdate({ prescription })} />
      </div>
      {!readOnly && <button type="button" className="studio-inspector-danger" onClick={onUnscheduled}>Bỏ khỏi lịch</button>}
    </aside>;
}
