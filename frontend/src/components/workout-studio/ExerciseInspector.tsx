import { DAY_MINUTES, formatMinute, SLOT_MINUTES, snapMinute } from '../../services/workoutStudioModel';
import type { ScheduledExercise } from '../../types/workoutStudio';

interface Props {
  selected?: ScheduledExercise;
  days: number[];
  onUpdate: (patch: Partial<ScheduledExercise>) => void;
  onUnscheduled: () => void;
}

export default function ExerciseInspector({ selected, days, onUpdate, onUnscheduled }: Props) {
  if (!selected) return <div className="studio-inspector-empty"><h2>Lịch bài tập</h2><p>Chọn một thẻ trên timeline để chỉnh lịch.</p></div>;

  return <aside className="studio-inspector" aria-label="Thuộc tính bài tập đã chọn">
      <header className="studio-inspector-header"><h2>Lịch bài tập</h2><strong title={selected.name}>{selected.name}</strong></header>
      <div className="studio-inspector-fields">
        <label>Ngày
          <select aria-label="Ngày của bài tập" value={selected.dayNumber} onChange={(event) => onUpdate({ dayNumber: Number(event.target.value) })}>
            {days.map((day) => <option key={day} value={day}>Ngày {day}</option>)}
          </select>
        </label>
        <label>Giờ bắt đầu
          <input aria-label="Giờ bắt đầu" placeholder="Ví dụ: 08:00" type="time" step="900" value={formatMinute(selected.startMinute)} onChange={(event) => {
            const [hour, minute] = event.target.value.split(':').map(Number);
            onUpdate({ startMinute: snapMinute(hour * 60 + minute) });
          }} />
        </label>
      </div>
      <div className="studio-inspector-duration">
        <span>Thời lượng</span>
        <div>
          <button type="button" aria-label="Giảm thời lượng 15 phút" disabled={selected.durationMinutes <= SLOT_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes - SLOT_MINUTES })}>−</button>
          <input aria-label="Thời lượng bài tập" placeholder="Ví dụ: 60 phút" type="number" min="15" max="1440" step="15" value={selected.durationMinutes} onChange={(event) => onUpdate({ durationMinutes: Number(event.target.value) })} />
          <button type="button" aria-label="Tăng thời lượng 15 phút" disabled={selected.startMinute + selected.durationMinutes >= DAY_MINUTES} onClick={() => onUpdate({ durationMinutes: selected.durationMinutes + SLOT_MINUTES })}>+</button>
        </div>
      </div>
      <button type="button" className="studio-inspector-danger" onClick={onUnscheduled}>Bỏ khỏi lịch</button>
    </aside>;
}
