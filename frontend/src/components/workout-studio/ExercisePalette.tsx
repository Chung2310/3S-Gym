import { Search, Dumbbell, Sparkles, Plus, GripVertical, Award, Layers } from 'lucide-react';
import type { Exercise } from '../../types';
import type { ScheduledExercise } from '../../types/workoutStudio';

interface Props {
  exercises: Exercise[]; recommendations: Exercise[]; unscheduled: ScheduledExercise[]; query: string; muscleGroup: string; level: string; muscleGroups: string[];
  onQueryChange: (value: string) => void; onMuscleGroupChange: (value: string) => void; onLevelChange: (value: string) => void;
  onPlace: (exercise: Exercise) => void; onPlaceUnscheduled: (item: ScheduledExercise) => void;
}

export default function ExercisePalette(props: Props) {
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'Cơ bản';
      case 'INTERMEDIATE': return 'Trung cấp';
      case 'ADVANCED': return 'Nâng cao';
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ADVANCED': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <aside aria-label="Thư viện bài tập Studio" className="studio-palette !flex !flex-col !gap-4 !overflow-hidden !rounded-2xl !border !border-slate-200 !bg-white !p-5 shadow-[0_8px_24px_rgba(0,59,112,0.05)] min-[1001px]:sticky min-[1001px]:top-4 min-[1001px]:max-h-[calc(100dvh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">Thư viện bài tập</h2>
            <p className="text-[11px] text-slate-400">Kéo thả hoặc nhấn dấu + để thêm</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
          {props.exercises.length}
        </span>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm outline-none transition focus-visible:border-secondary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-secondary/20"
            aria-label="Tìm bài tập"
            placeholder="Tìm theo tên hoặc nhóm cơ..."
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-8 text-xs outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20 cursor-pointer"
              aria-label="Lọc nhóm cơ"
              value={props.muscleGroup}
              onChange={(event) => props.onMuscleGroupChange(event.target.value)}
            >
              <option value="">Tất cả nhóm cơ</option>
              {props.muscleGroups.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <Layers className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-8 text-xs outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20 cursor-pointer"
              aria-label="Lọc cấp độ bài tập"
              value={props.level}
              onChange={(event) => props.onLevelChange(event.target.value)}
            >
              <option value="">Tất cả cấp độ</option>
              <option value="BEGINNER">Cơ bản</option>
              <option value="INTERMEDIATE">Trung cấp</option>
              <option value="ADVANCED">Nâng cao</option>
            </select>
            <Award className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 no-scrollbar">
        {/* Smart Recommendations */}
        {props.recommendations.length > 0 && (
          <section className="grid gap-2 rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-blue-50/40 p-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
              <h3 className="text-xs font-bold text-slate-800">Gợi ý cho giáo án</h3>
            </div>
            <div className="grid gap-2">
              {props.recommendations.slice(0, 5).map((exercise) => (
                <div
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('exerciseId', exercise._id)}
                  key={`rec-${exercise._id}`}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-sky-100 hover:border-secondary hover:shadow-sm transition cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3 h-3 text-slate-300 flex-shrink-0 cursor-grab" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate leading-tight group-hover:text-primary transition">{exercise.name}</p>
                      <div className="flex gap-1 mt-1">
                        <span className="text-[10px] px-1 bg-slate-100 text-slate-500 rounded border border-slate-200/50">{exercise.muscleGroup}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => props.onPlace(exercise)}
                    aria-label={`Thêm bài đề xuất ${exercise.name}`}
                    className="p-1 rounded-md bg-secondary/10 hover:bg-secondary hover:text-white text-secondary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Regular Exercises */}
        <div className="flex flex-col gap-2">
          {props.exercises.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Không tìm thấy bài tập nào
            </div>
          ) : (
            props.exercises.map((exercise) => (
              <div
                draggable
                onDragStart={(event) => event.dataTransfer.setData('exerciseId', exercise._id)}
                key={exercise._id}
                className="flex items-center justify-between gap-2 p-2.5 bg-slate-50/50 hover:bg-white rounded-xl border border-slate-100 hover:border-secondary/40 hover:shadow-sm transition cursor-grab active:cursor-grabbing group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 cursor-grab" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight group-hover:text-primary transition">{exercise.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200/50">{exercise.muscleGroup}</span>
                      {exercise.level && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getLevelColor(exercise.level)}`}>
                          {getLevelLabel(exercise.level)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => props.onPlace(exercise)}
                  aria-label={`Thêm bài ${exercise.name}`}
                  className="p-1 rounded-md bg-slate-200/50 hover:bg-secondary hover:text-white text-slate-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Unscheduled List */}
        {props.unscheduled.length > 0 && (
          <section className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              Chưa xếp lịch
            </h3>
            <div className="grid gap-2">
              {props.unscheduled.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 bg-rose-50/30 hover:bg-rose-50/60 rounded-lg border border-rose-100 hover:border-rose-300 transition group"
                >
                  <span className="text-xs font-medium text-slate-700 truncate min-w-0">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => props.onPlaceUnscheduled(item)}
                    aria-label={`Xếp lịch bài ${item.name}`}
                    className="p-1 rounded-md bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
