import { ArrowLeft, CheckCircle2, Save } from 'lucide-react';
import { useState } from 'react';

interface Props {
  title: string; goal: string; level: string; durationDays: number; dirty: boolean; saving: boolean;
  contextLabel?: string; readOnly?: boolean;
  onBack: () => void; onTitleChange: (value: string) => void; onGoalChange: (value: string) => void;
  onLevelChange: (value: string) => void; onDurationDaysChange: (value: number) => void; onSave: () => void;
}

export default function StudioHeader(props: Props) {
  const [durationDraft, setDurationDraft] = useState<string | null>(null);

  const changeDuration = (value: string) => {
    if (value === '') {
      setDurationDraft('');
      return;
    }
    setDurationDraft(null);
    const durationDays = Number(value);
    if (Number.isFinite(durationDays)) props.onDurationDaysChange(durationDays);
  };

  return <>
    <header className="studio-header" role="banner" aria-label="Thông tin giáo án">
      <div className="studio-header-command">
        <button type="button" aria-label="Về danh sách giáo án" className="studio-back-button" onClick={props.onBack}><ArrowLeft size={16} aria-hidden="true" /></button>
        <div className="studio-header-title"><h1>Thiết kế giáo án</h1></div>
        <span role="status" aria-live="polite" className={`studio-save-state ${props.dirty ? 'is-dirty' : 'is-saved'}`}><CheckCircle2 size={14} aria-hidden="true" />{props.dirty ? 'Chưa lưu' : 'Đã lưu'}</span>
        <button type="button" className="button button-primary" disabled={props.saving || props.readOnly} onClick={props.onSave}><Save size={17} aria-hidden="true" /> {props.saving ? 'Đang lưu...' : 'Lưu giáo án'}</button>
      </div>
      <div className="studio-header-fields" role="group" aria-label="Thông tin cơ bản">
        <label><span data-field-title>Tên giáo án</span><input aria-label="Tên giáo án" placeholder="Ví dụ: Tăng cơ nền tảng 8 tuần" value={props.title} disabled={props.readOnly} onChange={(event) => props.onTitleChange(event.target.value)} /></label>
        <label><span data-field-title>Mục tiêu</span><input aria-label="Mục tiêu" placeholder="Ví dụ: Tăng cơ và cải thiện sức mạnh" value={props.goal} disabled={props.readOnly} onChange={(event) => props.onGoalChange(event.target.value)} /></label>
        <label><span data-field-title>Cấp độ</span><select aria-label="Cấp độ giáo án" value={props.level} disabled={props.readOnly} onChange={(event) => props.onLevelChange(event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
        <label><span data-field-title>Số ngày</span><input aria-label="Số ngày giáo án" type="number" min="1" max="365" placeholder="Ví dụ: 7" value={durationDraft ?? props.durationDays} disabled={props.readOnly} onChange={(event) => changeDuration(event.target.value)} onBlur={() => { if (durationDraft === '') setDurationDraft(null); }} /></label>
      </div>
    </header>
    {props.contextLabel && <p className="studio-context-note">{props.contextLabel}{props.readOnly ? ' · Chỉ xem' : ''}</p>}
  </>;
}
