import { Search, X, RotateCcw, RefreshCw } from 'lucide-react';

interface ExerciseFilterProps {
  muscleGroup: string;
  level: string;
  onMuscleGroupChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onFilter: () => void;
  onClear: () => void;
}

export default function ExerciseFilter({
  muscleGroup,
  level,
  onMuscleGroupChange,
  onLevelChange,
  onFilter,
  onClear,
}: ExerciseFilterProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto_auto] md:items-center">
      <div className="relative min-w-0">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          aria-label="Nhóm cơ"
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          placeholder="Lọc theo nhóm cơ..."
          className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 font-montserrat text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:border-secondary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-secondary/20"
        />
        {muscleGroup && (
          <button
            type="button"
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
            onClick={() => onMuscleGroupChange('')}
            aria-label="Xóa lọc nhóm cơ"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <select
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 font-montserrat text-sm text-slate-700 outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20"
        aria-label="Cấp độ"
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
      >
        <option value="">Tất cả</option>
        <option value="BEGINNER">Cơ bản</option>
        <option value="INTERMEDIATE">Trung cấp</option>
        <option value="ADVANCED">Nâng cao</option>
      </select>

      <button type="button" className="button button-secondary min-h-11" onClick={onFilter}>
        <RefreshCw size={15} /> Lọc bài tập
      </button>

      {(muscleGroup || level) && (
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 font-montserrat text-xs font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={onClear}>
          <RotateCcw size={13} /> Xóa lọc
        </button>
      )}
    </div>
  );
}
