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
    <div className="filter-bar">
      <div className="search-field" style={{ maxWidth: '280px' }}>
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          aria-label="Nhóm cơ"
          value={muscleGroup}
          onChange={(e) => onMuscleGroupChange(e.target.value)}
          placeholder="Lọc theo nhóm cơ..."
        />
        {muscleGroup && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onMuscleGroupChange('')}
            aria-label="Xóa lọc nhóm cơ"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <select
        className="filter-select"
        aria-label="Cấp độ"
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
      >
        <option value="">Tất cả</option>
        <option value="BEGINNER">Cơ bản</option>
        <option value="INTERMEDIATE">Trung cấp</option>
        <option value="ADVANCED">Nâng cao</option>
      </select>

      <button className="button button-secondary" onClick={onFilter}>
        <RefreshCw size={15} /> Lọc bài tập
      </button>

      {(muscleGroup || level) && (
        <button className="button-filter-reset" onClick={onClear}>
          <RotateCcw size={13} /> Xóa lọc
        </button>
      )}
    </div>
  );
}
