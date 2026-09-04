import { useState, type CSSProperties, type DragEventHandler, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Dumbbell, Plus, Settings2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMinute, SLOT_HEIGHT, SLOT_MINUTES } from '../../services/workoutStudioModel';
import type { MovePreview, ScheduledExercise } from '../../types/workoutStudio';

const hours = Array.from({ length: 25 }, (_, index) => index);
type StudioPositionStyle = CSSProperties & { '--studio-item-top': string; '--studio-item-height': string };
const positionStyle = (startMinute: number, durationMinutes: number): StudioPositionStyle => ({
  '--studio-item-top': `${(startMinute / SLOT_MINUTES) * SLOT_HEIGHT}px`,
  '--studio-item-height': `${(durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT}px`,
});

interface Props {
  activeDay: number;
  items: ScheduledExercise[];
  selectedId?: string;
  preview?: MovePreview;
  wrapperRef: RefObject<HTMLElement | null>;
  onDrop: DragEventHandler<HTMLDivElement>;
  onSelect: (id: string) => void;
  onMoveStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onResizeStart: (event: ReactPointerEvent, item: ScheduledExercise) => void;
  onKeyboardMove: (item: ScheduledExercise, minutes: number) => void;
  onAddExercise?: () => void;
  onRemoveExercise?: (id: string) => void;
}

export default function DayTimeline(props: Props) {
  const [showTimelineGrid, setShowTimelineGrid] = useState(false);
  const previewDuration = props.items.find((item) => item.id === props.preview?.id)?.durationMinutes || 0;

  return (
    <main ref={props.wrapperRef} className="studio-timeline-panel p-3.5 sm:p-5">
      {/* Header Ngày & Nút Thêm bài tập */}
      <header className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#003b70] m-0">
            Ngày {props.activeDay} · {props.items.length} bài tập
          </h2>
          {props.preview && (
            <p aria-live="polite" className={`studio-move-preview ${props.preview.valid ? 'is-valid' : 'is-invalid'} text-xs mt-0.5`}>
              Dự kiến {formatMinute(props.preview.startMinute)}–{formatMinute(props.preview.startMinute + previewDuration)}
            </p>
          )}
        </div>
        {props.onAddExercise && (
          <button
            type="button"
            className="button button-primary min-h-[38px] px-3.5 flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold shrink-0"
            onClick={props.onAddExercise}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Thêm bài tập</span>
          </button>
        )}
      </header>

      {/* Danh sách bài tập trực quan dạng card trên điện thoại & desktop */}
      <div className="mt-3.5">
        {props.items.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 my-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <Dumbbell size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 m-0">Chưa có bài tập nào trong Ngày {props.activeDay}</h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-4 max-w-sm mx-auto leading-relaxed">
              Bấm nút bên dưới để chọn các bài tập từ thư viện và đưa vào giáo án ngày này.
            </p>
            {props.onAddExercise && (
              <button
                type="button"
                className="button button-primary mx-auto inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold shadow-sm"
                onClick={props.onAddExercise}
              >
                <Plus size={15} />
                <span>+ Thêm bài tập vào Ngày {props.activeDay}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5" role="group" aria-label="Bài tập đã xếp lịch">
            {props.items.map((item, index) => {
              const setsCount = item.sets || (item.prescription && 'sets' in item.prescription ? (item.prescription as { sets?: number }).sets : 3);
              const repsVal = item.reps || (item.prescription && 'reps' in item.prescription ? (item.prescription as { reps?: string }).reps : '8-12');
              const weightVal = item.weight || (item.prescription && 'targetWeight' in item.prescription ? (item.prescription as { targetWeight?: number }).targetWeight : '');

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    props.selectedId === item.id
                      ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-400/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => props.onSelect(item.id)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-[#003b70] truncate">{item.name}</div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">
                          {setsCount} sets × {repsVal} reps
                        </span>
                        {weightVal ? <span>· {weightVal}kg</span> : null}
                        <span className="text-slate-400">
                          · {formatMinute(item.startMinute)}–{formatMinute(item.startMinute + item.durationMinutes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      aria-label={`Sửa thuộc tính bài ${item.name}`}
                      onClick={() => props.onSelect(item.id)}
                    >
                      <Settings2 size={16} />
                      <span className="hidden sm:inline">Sửa</span>
                    </button>
                    {props.onRemoveExercise && (
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        aria-label={`Xóa bài ${item.name} khỏi Ngày ${props.activeDay}`}
                        onClick={() => props.onRemoveExercise?.(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {props.onAddExercise && (
              <button
                type="button"
                className="mt-1 w-full py-2.5 rounded-xl border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                onClick={props.onAddExercise}
              >
                <Plus size={15} />
                <span>Thêm bài tập khác vào Ngày {props.activeDay}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lưới thời gian 24 giờ (Ẩn mặc định trên mobile, có toggle; hiển thị đầy đủ trên màn hình lớn) */}
      <div className="mt-4 pt-3.5 border-t border-slate-200">
        <button
          type="button"
          className="sm:hidden w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 py-2 px-3 rounded-lg bg-slate-100 mb-2 cursor-pointer"
          onClick={() => setShowTimelineGrid(!showTimelineGrid)}
        >
          <span>Lưới thời gian 24 giờ (Timeline kéo-thả)</span>
          {showTimelineGrid ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div className={`${showTimelineGrid ? 'block' : 'hidden'} sm:block overflow-x-auto`}>
          <div className="studio-timeline" onDragOver={(event) => event.preventDefault()} onDrop={props.onDrop}>
            <div className="studio-hour-grid" aria-hidden="true">
              {hours.map((hour) => (
                <div className="studio-hour" key={hour}>
                  <span>{String(hour).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            {props.items.map((item) => (
              <ScheduledExerciseCard
                key={item.id}
                item={item}
                selected={props.selectedId === item.id}
                preview={props.preview?.id === item.id ? props.preview : undefined}
                onSelect={props.onSelect}
                onMoveStart={props.onMoveStart}
                onResizeStart={props.onResizeStart}
                onKeyboardMove={props.onKeyboardMove}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ScheduledExerciseCard({ item, selected, preview, onSelect, onMoveStart, onResizeStart, onKeyboardMove }: { item: ScheduledExercise; selected: boolean; preview?: MovePreview; onSelect: (id: string) => void; onMoveStart: Props['onMoveStart']; onResizeStart: Props['onResizeStart']; onKeyboardMove: Props['onKeyboardMove'] }) {
  const displayStart = preview?.startMinute ?? item.startMinute;
  const compact = item.durationMinutes <= 30;
  return (
    <button
      draggable
      aria-label={`${item.name}, ${formatMinute(displayStart)}–${formatMinute(displayStart + item.durationMinutes)}, ${item.durationMinutes} phút`}
      onDragStart={(event) => event.dataTransfer.setData('scheduleId', item.id)}
      className={`studio-scheduled-item ${compact ? 'is-compact' : ''} ${selected ? 'is-selected' : ''} ${preview ? `is-preview ${preview.valid ? 'is-valid' : 'is-invalid'}` : ''}`}
      style={positionStyle(displayStart, item.durationMinutes)}
      onPointerDown={(event) => onMoveStart(event, item)}
      onClick={() => onSelect(item.id)}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        onKeyboardMove(item, (event.shiftKey ? 60 : 15) * (event.key === 'ArrowDown' ? 1 : -1));
      }}
    >
      <span className="studio-scheduled-content">
        <strong>{item.name}</strong>
        {compact ? (
          <span>{item.durationMinutes <= 15 ? `${item.durationMinutes} phút` : `${formatMinute(displayStart)}–${formatMinute(displayStart + item.durationMinutes)}`}</span>
        ) : (
          <span>{formatMinute(displayStart)}–{formatMinute(displayStart + item.durationMinutes)} · {item.durationMinutes} phút</span>
        )}
      </span>
      <i className="studio-resize-handle" aria-label="Thay đổi thời lượng" onPointerDown={(event) => onResizeStart(event, item)} />
    </button>
  );
}
