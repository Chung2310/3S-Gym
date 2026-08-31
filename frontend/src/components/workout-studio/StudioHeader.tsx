import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';

interface Props {
  title: string; goal: string; level: string; durationDays: number; dirty: boolean; saving: boolean;
  contextLabel?: string; readOnly?: boolean;
  onBack: () => void; onTitleChange: (value: string) => void; onGoalChange: (value: string) => void;
  onLevelChange: (value: string) => void; onDurationDaysChange: (value: number) => void; onSave: () => void;
}

const fieldClass = 'min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 font-montserrat text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:border-secondary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

export default function StudioHeader(props: Props) {
  return <>
    <header className="rounded-2xl border border-slate-200 bg-white p-5 font-montserrat shadow-[0_8px_24px_rgba(0,59,112,0.05)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Về danh sách giáo án" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-primary active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={props.onBack}><ArrowLeft size={16} /> Danh sách</button>
          <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-secondary">Workout Studio</p><h1 className="font-oswald text-xl font-bold uppercase text-primary">Thiết kế giáo án</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className={props.dirty ? 'inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700' : 'inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700'}><CheckCircle2 size={14} />{props.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
          <button type="button" className="button button-primary min-h-10" disabled={props.saving || props.readOnly} onClick={props.onSave}><Save size={17} /> {props.saving ? 'Đang lưu...' : 'Lưu giáo án'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1.3fr_10rem_8rem]">
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span data-field-title>Tên giáo án</span><input className={fieldClass} aria-label="Tên giáo án" placeholder="Ví dụ: Tăng cơ nền tảng 8 tuần" value={props.title} disabled={props.readOnly} onChange={(event) => props.onTitleChange(event.target.value)} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span data-field-title>Mục tiêu</span><input className={fieldClass} aria-label="Mục tiêu" placeholder="Ví dụ: Tăng cơ và cải thiện sức mạnh" value={props.goal} disabled={props.readOnly} onChange={(event) => props.onGoalChange(event.target.value)} /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span data-field-title>Cấp độ</span><select className={fieldClass} aria-label="Cấp độ giáo án" value={props.level} disabled={props.readOnly} onChange={(event) => props.onLevelChange(event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
        <label className="grid gap-1.5 text-xs font-semibold text-slate-600"><span data-field-title>Số ngày</span><input className={fieldClass} aria-label="Số ngày giáo án" type="number" min="1" max="365" placeholder="Ví dụ: 7" value={props.durationDays} disabled={props.readOnly} onChange={(event) => props.onDurationDaysChange(Number(event.target.value))} /></label>
      </div>
    </header>
    {props.contextLabel && <p className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-2.5 font-montserrat text-sm font-semibold text-primary">{props.contextLabel}{props.readOnly ? ' · Chỉ xem' : ''}</p>}
  </>;
}
