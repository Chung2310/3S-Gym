import { Search, X, RotateCcw, RefreshCw } from 'lucide-react';

interface ExerciseFilterProps {
  muscleGroup: string;
  level: string;
  trackingType: string;
  onMuscleGroupChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onTrackingTypeChange: (value: string) => void;
  onFilter: () => void;
  onClear: () => void;
}

export default function ExerciseFilter({
  muscleGroup,
  level,
  trackingType,
  onMuscleGroupChange,
  onLevelChange,
  onTrackingTypeChange,
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

      <select
        className="exercise-filter-select"
        aria-label="Cách ghi nhận"
        value={trackingType}
        onChange={(event) => onTrackingTypeChange(event.target.value)}
      >
        <option value="">Tất cả cách ghi nhận</option>
        <option value="UNCLASSIFIED">Chưa phân loại</option>
        <option value="STRENGTH">Sức mạnh · mức tạ</option>
        <option value="BODYWEIGHT">Trọng lượng cơ thể</option>
        <option value="CARDIO">Cardio</option>
        <option value="INTERVAL">Interval</option>
        <option value="MOBILITY">Mobility</option>
      </select>

      <button type="button" className="button button-secondary exercise-filter-submit" onClick={onFilter}>
        <RefreshCw size={15} /> Lọc bài tập
      </button>

      {(muscleGroup || level || trackingType) && (
        <button type="button" className="exercise-filter-reset" onClick={onClear}>
          <RotateCcw size={13} /> Xóa lọc
        </button>
      )}
    </div>
  );
}
