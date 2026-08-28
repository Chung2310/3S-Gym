import { ArrowLeft, Save } from 'lucide-react';

interface Props {
  title: string; goal: string; level: string; durationDays: number; dirty: boolean; saving: boolean;
  contextLabel?: string; readOnly?: boolean;
  onBack: () => void; onTitleChange: (value: string) => void; onGoalChange: (value: string) => void;
  onLevelChange: (value: string) => void; onDurationDaysChange: (value: number) => void; onSave: () => void;
}

export default function StudioHeader(props: Props) {
  return <>
    <header className="studio-header">
      <button className="button button-secondary" onClick={props.onBack}><ArrowLeft size={17} /> Danh sách</button>
      <div className="studio-meta !grid !grid-cols-1 gap-2 sm:!grid-cols-2 xl:!grid-cols-[2fr_1.3fr_130px_120px]">
        <label className="!grid gap-1 text-xs font-semibold text-slate-600">
          <span data-field-title>Tên giáo án</span>
          <input aria-label="Tên giáo án" placeholder="Tên giáo án..." value={props.title} disabled={props.readOnly} onChange={(event) => props.onTitleChange(event.target.value)} />
        </label>
        <label className="!grid gap-1 text-xs font-semibold text-slate-600">
          <span data-field-title>Mục tiêu</span>
          <input aria-label="Mục tiêu" placeholder="Mục tiêu..." value={props.goal} disabled={props.readOnly} onChange={(event) => props.onGoalChange(event.target.value)} />
        </label>
        <label className="!grid gap-1 text-xs font-semibold text-slate-600">
          <span data-field-title>Cấp độ</span>
          <select aria-label="Cấp độ giáo án" value={props.level} disabled={props.readOnly} onChange={(event) => props.onLevelChange(event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select>
        </label>
        <label className="!grid gap-1 text-xs font-semibold text-slate-600">
          <span data-field-title>Số ngày</span>
          <input aria-label="Số ngày giáo án" type="number" min="1" max="365" placeholder="Ví dụ: 7 ngày" value={props.durationDays} disabled={props.readOnly} onChange={(event) => props.onDurationDaysChange(Number(event.target.value))} />
        </label>
      </div>
      <span aria-live="polite" className={props.dirty ? 'text-amber-700' : 'text-emerald-700'}>{props.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
      <button className="button button-primary" disabled={props.saving || props.readOnly} onClick={props.onSave}><Save size={17} /> {props.saving ? 'Đang lưu...' : 'Lưu giáo án'}</button>
    </header>
    {props.contextLabel && <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-primary">{props.contextLabel}{props.readOnly ? ' · Chỉ xem' : ''}</p>}
  </>;
}
