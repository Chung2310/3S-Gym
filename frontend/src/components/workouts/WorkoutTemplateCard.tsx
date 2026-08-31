import { Archive, CalendarDays, Dumbbell, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { WorkoutTemplate } from './WorkoutTemplateList';

interface Props {
  template: WorkoutTemplate;
  onEdit: (template: WorkoutTemplate) => void;
  onArchive: (template: WorkoutTemplate) => void;
  onDelete: (template: WorkoutTemplate) => void;
  onAssign?: (template: WorkoutTemplate) => void;
}

const levelLabels: Record<string, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
};

export default function WorkoutTemplateCard({ template, onEdit, onArchive, onDelete, onAssign }: Props) {
  const sessionCount = template.sessions.length;
  const exerciseCount = template.sessions.reduce((total, session) => total + session.exercises.length, 0);
  const statusLabel = template.status === 'ACTIVE' ? 'Đang dùng' : 'Đã lưu trữ';

  return (
    <article
      aria-label={template.title}
      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 font-montserrat shadow-[0_8px_24px_rgba(0,59,112,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_32px_rgba(0,59,112,0.1)] motion-reduce:transform-none"
      style={{ padding: '24px' }}
    >
      <header className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">Giáo án mẫu · v{template.version}</p>
          <h3 className="text-wrap-pretty font-oswald text-xl font-bold uppercase leading-tight text-primary">{template.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{template.goal}</p>
        </div>
        <span className={template.status === 'ACTIVE'
          ? 'shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-emerald-700'
          : 'shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-slate-600'}>
          {statusLabel}
        </span>
      </header>

      <dl className="my-4 grid grid-cols-3 divide-x divide-slate-100 border-y border-slate-100">
        <div className="min-w-0 py-3 pr-4">
          <dt className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400"><CalendarDays size={13} /> Lịch tập</dt>
          <dd className="mt-1 text-sm font-bold text-slate-800">{sessionCount} buổi</dd>
        </div>
        <div className="min-w-0 px-4 py-3">
          <dt className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400"><Dumbbell size={13} /> Bài tập</dt>
          <dd className="mt-1 text-sm font-bold text-slate-800">{exerciseCount} bài</dd>
        </div>
        <div className="min-w-0 py-3 pl-4">
          <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">Cấp độ</dt>
          <dd className="mt-1 truncate text-sm font-bold text-slate-800">{levelLabels[template.level] || template.level}</dd>
        </div>
      </dl>

      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button type="button" aria-label={`Chỉnh sửa ${template.title}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-white transition hover:bg-primary/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={() => onEdit(template)}>
          <Pencil size={14} /> Sửa
        </button>
        {onAssign && (
          <button type="button" aria-label={`Gán ${template.title} cho học viên`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 text-xs font-bold text-primary transition hover:border-sky-300 hover:bg-sky-100 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={() => onAssign(template)}>
            <UserPlus size={14} /> Gán học viên
          </button>
        )}
        {template.status === 'ACTIVE' ? (
          <button type="button" aria-label={`Lưu trữ ${template.title}`} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-primary active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={() => onArchive(template)}>
            <Archive size={14} /> Lưu trữ
          </button>
        ) : (
          <button type="button" aria-label={`Xóa ${template.title}`} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" onClick={() => onDelete(template)}>
            <Trash2 size={14} /> Xóa
          </button>
        )}
      </footer>
    </article>
  );
}
