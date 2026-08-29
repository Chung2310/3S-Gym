import type { DragEventHandler, PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { cardGeometry, formatMinute, SLOT_HEIGHT } from '../../services/workoutStudioModel';
import type { MovePreview, ScheduledExercise } from '../../types/workoutStudio';

const hours = Array.from({ length: 25 }, (_, index) => index);
interface Props {
  activeDay: number; items: ScheduledExercise[]; selectedId?: string; preview?: MovePreview; wrapperRef: RefObject<HTMLElement | null>;
  onDrop: DragEventHandler<HTMLDivElement>; onSelect: (id: string) => void;
  onMoveStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onResizeStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onKeyboardMove: (item: ScheduledExercise, minutes: number) => void;
}

export default function DayTimeline(props: Props) {
  const previewDuration = props.items.find((item) => item.id === props.preview?.id)?.durationMinutes || 0;
  return <main ref={props.wrapperRef} className="studio-timeline-wrap"><h2>Ngày {props.activeDay} · 00:00–24:00</h2>{props.preview && <p aria-live="polite" className={props.preview.valid ? 'text-emerald-700' : 'text-red-600'}>Dự kiến {formatMinute(props.preview.startMinute)}–{formatMinute(props.preview.startMinute + previewDuration)}</p>}<div className="studio-timeline" onDragOver={(event) => event.preventDefault()} onDrop={props.onDrop}>{hours.map((hour) => <div className="studio-hour" style={{ top: hour * 4 * SLOT_HEIGHT }} key={hour}><span>{String(hour).padStart(2, '0')}:00</span></div>)}{props.items.map((item) => <ScheduledExerciseCard key={item.id} item={item} selected={props.selectedId === item.id} preview={props.preview?.id === item.id ? props.preview : undefined} onSelect={props.onSelect} onMoveStart={props.onMoveStart} onResizeStart={props.onResizeStart} onKeyboardMove={props.onKeyboardMove} />)}</div></main>;
}

function ScheduledExerciseCard({ item, selected, preview, onSelect, onMoveStart, onResizeStart, onKeyboardMove }: { item: ScheduledExercise; selected: boolean; preview?: MovePreview; onSelect: (id: string) => void; onMoveStart: Props['onMoveStart']; onResizeStart: Props['onResizeStart']; onKeyboardMove: Props['onKeyboardMove'] }) {
  const displayStart = preview?.startMinute ?? item.startMinute;
  return <button draggable onDragStart={(event) => event.dataTransfer.setData('scheduleId', item.id)} className={`studio-exercise-card touch-none ${selected ? 'selected' : ''} ${preview ? (preview.valid ? 'ring-2 ring-emerald-500' : 'ring-2 ring-red-500') : ''}`} style={cardGeometry(displayStart, item.durationMinutes)} onPointerDown={(event) => onMoveStart(event, item)} onClick={() => onSelect(item.id)} onKeyDown={(event) => { if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return; event.preventDefault(); onKeyboardMove(item, (event.shiftKey ? 60 : 15) * (event.key === 'ArrowDown' ? 1 : -1)); }}><strong>{item.name}</strong><span>{formatMinute(displayStart)}–{formatMinute(displayStart + item.durationMinutes)} · {item.durationMinutes} phút</span><i aria-label="Thay đổi thời lượng" onPointerDown={(event) => onResizeStart(event, item)} /></button>;
}
