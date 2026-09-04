import type { CSSProperties, DragEventHandler, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { formatMinute, SLOT_HEIGHT, SLOT_MINUTES } from '../../services/workoutStudioModel';
import type { MovePreview, ScheduledExercise } from '../../types/workoutStudio';

const hours = Array.from({ length: 25 }, (_, index) => index);
type StudioPositionStyle = CSSProperties & { '--studio-item-top': string; '--studio-item-height': string };
const positionStyle = (startMinute: number, durationMinutes: number): StudioPositionStyle => ({
  '--studio-item-top': `${(startMinute / SLOT_MINUTES) * SLOT_HEIGHT}px`,
  '--studio-item-height': `${(durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT}px`,
});
interface Props {
  activeDay: number; items: ScheduledExercise[]; selectedId?: string; preview?: MovePreview; wrapperRef: RefObject<HTMLElement | null>;
  onDrop: DragEventHandler<HTMLDivElement>; onSelect: (id: string) => void;
  onMoveStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onResizeStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onKeyboardMove: (item: ScheduledExercise, minutes: number) => void;
}

export default function DayTimeline(props: Props) {
  const previewDuration = props.items.find((item) => item.id === props.preview?.id)?.durationMinutes || 0;
  return <main ref={props.wrapperRef} className="studio-timeline-panel">
    <header className="studio-timeline-header"><h2>Ngày {props.activeDay} · 00:00–24:00</h2>{props.preview && <p aria-live="polite" className={`studio-move-preview ${props.preview.valid ? 'is-valid' : 'is-invalid'}`}>Dự kiến {formatMinute(props.preview.startMinute)}–{formatMinute(props.preview.startMinute + previewDuration)}</p>}</header>
    {props.items.length > 0 && <div className="studio-touch-schedule-list" role="group" aria-label="Bài tập đã xếp lịch">{props.items.map((item) => <button type="button" className="studio-touch-schedule-action" key={item.id} onClick={() => props.onSelect(item.id)} aria-label={`Mở thuộc tính: ${item.name}, ${formatMinute(item.startMinute)} đến ${formatMinute(item.startMinute + item.durationMinutes)}`}><strong>{item.name}</strong><span>{formatMinute(item.startMinute)}–{formatMinute(item.startMinute + item.durationMinutes)}</span></button>)}</div>}
    <div className="studio-timeline" onDragOver={(event) => event.preventDefault()} onDrop={props.onDrop}>
      <div className="studio-hour-grid" aria-hidden="true">{hours.map((hour) => <div className="studio-hour" key={hour}><span>{String(hour).padStart(2, '0')}:00</span></div>)}</div>
      {props.items.map((item) => <ScheduledExerciseCard key={item.id} item={item} selected={props.selectedId === item.id} preview={props.preview?.id === item.id ? props.preview : undefined} onSelect={props.onSelect} onMoveStart={props.onMoveStart} onResizeStart={props.onResizeStart} onKeyboardMove={props.onKeyboardMove} />)}
    </div>
  </main>;
}

function ScheduledExerciseCard({ item, selected, preview, onSelect, onMoveStart, onResizeStart, onKeyboardMove }: { item: ScheduledExercise; selected: boolean; preview?: MovePreview; onSelect: (id: string) => void; onMoveStart: Props['onMoveStart']; onResizeStart: Props['onResizeStart']; onKeyboardMove: Props['onKeyboardMove'] }) {
  const displayStart = preview?.startMinute ?? item.startMinute;
  const compact = item.durationMinutes <= 30;
  return <button draggable aria-label={`${item.name}, ${formatMinute(displayStart)}–${formatMinute(displayStart + item.durationMinutes)}, ${item.durationMinutes} phút`} onDragStart={(event) => event.dataTransfer.setData('scheduleId', item.id)} className={`studio-scheduled-item ${compact ? 'is-compact' : ''} ${selected ? 'is-selected' : ''} ${preview ? `is-preview ${preview.valid ? 'is-valid' : 'is-invalid'}` : ''}`} style={positionStyle(displayStart, item.durationMinutes)} onPointerDown={(event) => onMoveStart(event, item)} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return; event.preventDefault(); onKeyboardMove(item, (event.shiftKey ? 60 : 15) * (event.key === 'ArrowDown' ? 1 : -1)); }}><span className="studio-scheduled-content"><strong>{item.name}</strong>{compact ? <span>{item.durationMinutes <= 15 ? `${item.durationMinutes} phút` : `${formatMinute(displayStart)}–${formatMinute(displayStart + item.durationMinutes)}`}</span> : <span>{formatMinute(displayStart)}–{formatMinute(displayStart + item.durationMinutes)} · {item.durationMinutes} phút</span>}</span><i className="studio-resize-handle" aria-label="Thay đổi thời lượng" onPointerDown={(event) => onResizeStart(event, item)} /></button>;
}
