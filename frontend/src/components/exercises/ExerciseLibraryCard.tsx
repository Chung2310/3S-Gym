import { Dumbbell, Film, Pencil, Trash2 } from 'lucide-react';
import type { Exercise } from './ExerciseFormModal';

interface Props {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

export default function ExerciseLibraryCard({ exercise, onEdit, onDelete }: Props) {
  return (
    <article aria-label={exercise.name} className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 font-montserrat shadow-[0_8px_24px_rgba(0,59,112,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_32px_rgba(0,59,112,0.1)] motion-reduce:transform-none">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-secondary"><Dumbbell size={19} /></span>
          <div className="min-w-0">
            <h2 className="text-wrap-pretty font-oswald text-xl font-bold uppercase leading-tight text-primary">{exercise.name}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{exercise.equipment?.length ? exercise.equipment.join(' · ') : 'Không yêu cầu thiết bị'}</p>
          </div>
        </div>
        <span className={exercise.scope === 'GLOBAL' ? 'shrink-0 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-sky-700' : 'shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-600'}>{exercise.scope === 'GLOBAL' ? 'Dùng chung' : 'Cá nhân'}</span>
      </header>

      <dl className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="py-3 pr-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">Nhóm cơ</dt><dd className="mt-1 text-sm font-bold text-slate-800">{exercise.muscleGroup}</dd></div>
        <div className="py-3 pl-3"><dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">Cấp độ</dt><dd className="mt-1 text-sm font-bold text-slate-800">{levelLabels[exercise.level] || exercise.level}</dd></div>
      </dl>

      <div className="min-h-20 py-5">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><Film size={14} className="text-secondary" /> {exercise.videos?.length || 0} video</p>
        {exercise.videos?.length ? <div className="flex flex-wrap gap-x-3 gap-y-1">{exercise.videos.map((video, index) => <a className="text-xs font-semibold text-sky-700 underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" key={`${video.url}-${index}`} href={video.url} target="_blank" rel="noopener noreferrer">{video.title}</a>)}</div> : <p className="text-xs text-slate-400">Chưa có video hướng dẫn.</p>}
      </div>

      {exercise.canManage && <footer className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-5">
        <button type="button" aria-label={`Sửa ${exercise.name}`} className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-primary transition-colors hover:border-sky-300 hover:bg-sky-100 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50" onClick={() => onEdit(exercise)}><Pencil size={16} /> Sửa</button>
        <button type="button" aria-label={`Xóa ${exercise.name}`} className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50" onClick={() => onDelete(exercise)}><Trash2 size={16} /> Xóa</button>
      </footer>}
    </article>
  );
}
