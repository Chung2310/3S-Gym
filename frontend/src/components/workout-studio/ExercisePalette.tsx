import type { Exercise } from '../exercises/ExerciseFormModal';
import type { ScheduledExercise } from '../../types/workoutStudio';

interface Props {
  exercises: Exercise[]; recommendations: Exercise[]; unscheduled: ScheduledExercise[]; query: string; muscleGroup: string; level: string; muscleGroups: string[];
  onQueryChange: (value: string) => void; onMuscleGroupChange: (value: string) => void; onLevelChange: (value: string) => void;
  onPlace: (exercise: Exercise) => void; onPlaceUnscheduled: (item: ScheduledExercise) => void;
}

export default function ExercisePalette(props: Props) {
  return (
    <aside className="studio-palette !gap-1.5 !p-2.5">
      <h2>Thư viện bài tập</h2>
      <p className="text-xs leading-4 text-slate-500">Kéo bài vào timeline hoặc bấm để thêm lúc 08:00.</p>
      {props.recommendations.length > 0 && <section className="grid gap-1.5 rounded-lg border border-sky-200 bg-sky-50 p-2">
        <div>
          <h3 className="text-xs font-bold text-primary">Đề xuất cho giáo án</h3>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Theo mục tiêu, nhóm cơ và cấp độ.</p>
        </div>
        <div className="grid gap-1">
          {props.recommendations.map((exercise) => <button
            type="button"
            draggable
            aria-label={`Thêm bài đề xuất ${exercise.name}`}
            className="grid cursor-grab gap-0.5 rounded-md border border-sky-200 bg-white px-2 py-1.5 text-left transition hover:border-secondary hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 active:cursor-grabbing"
            onDragStart={(event) => event.dataTransfer.setData('exerciseId', exercise._id)}
            onClick={() => props.onPlace(exercise)}
            key={exercise._id}
          ><strong className="truncate text-xs text-slate-800">{exercise.name}</strong><span className="text-[11px] text-slate-500">{exercise.muscleGroup}</span></button>)}
        </div>
      </section>}
      <input className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20" aria-label="Tìm bài tập" placeholder="Tìm theo tên hoặc nhóm cơ..." value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} />
      <select aria-label="Lọc nhóm cơ" value={props.muscleGroup} onChange={(event) => props.onMuscleGroupChange(event.target.value)}><option value="">Tất cả nhóm cơ</option>{props.muscleGroups.map((group) => <option key={group} value={group}>{group}</option>)}</select>
      <select aria-label="Lọc cấp độ bài tập" value={props.level} onChange={(event) => props.onLevelChange(event.target.value)}><option value="">Tất cả cấp độ</option><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select>
      {props.exercises.map((exercise) => <button draggable onDragStart={(event) => event.dataTransfer.setData('exerciseId', exercise._id)} onClick={() => props.onPlace(exercise)} key={exercise._id}><strong>{exercise.name}</strong><span>{exercise.muscleGroup}</span></button>)}
      {props.unscheduled.length > 0 && <div className="studio-unscheduled"><h3>Chưa xếp lịch</h3>{props.unscheduled.map((item) => <button key={item.id} onClick={() => props.onPlaceUnscheduled(item)}>{item.name}</button>)}</div>}
    </aside>
  );
}
