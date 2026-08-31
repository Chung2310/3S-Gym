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
    <div className="module-toolbar exercise-toolbar" role="search" aria-label="Bộ lọc bài tập">
      <div className="exercise-filter-search">
        <Search size={16} className="exercise-filter-search-icon" aria-hidden="true" />
        <input
          aria-label="Nhóm cơ"
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          placeholder="Lọc theo nhóm cơ..."
          className="exercise-filter-input"
        />
        {muscleGroup && (
          <button
            type="button"
            className="exercise-filter-clear-input"
            onClick={() => onMuscleGroupChange('')}
            aria-label="Xóa lọc nhóm cơ"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <select
        className="exercise-filter-select"
        aria-label="Cấp độ"
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
      >
        <option value="">Tất cả</option>
        <option value="BEGINNER">Cơ bản</option>
        <option value="INTERMEDIATE">Trung cấp</option>
        <option value="ADVANCED">Nâng cao</option>
      </select>

      <button type="button" className="button button-secondary exercise-filter-submit" onClick={onFilter}>
        <RefreshCw size={15} /> Lọc bài tập
      </button>

      {(muscleGroup || level) && (
        <button type="button" className="exercise-filter-reset" onClick={onClear}>
          <RotateCcw size={13} /> Xóa lọc
        </button>
      )}
    </div>
  );
}
