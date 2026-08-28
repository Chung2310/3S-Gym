import type { TemplateMetadata } from '../../types/workoutStudio';

interface Props {
  value: TemplateMetadata;
  muscleGroupOptions: string[];
  readOnly?: boolean;
  onChange: (value: TemplateMetadata) => void;
}

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20 disabled:bg-slate-100 disabled:text-slate-500';

export default function TemplateMetadataForm({ value, muscleGroupOptions, readOnly, onChange }: Props) {
  const patch = (next: Partial<TemplateMetadata>) => onChange({ ...value, ...next });
  const toggleMuscleGroup = (group: string) => patch({ muscleGroups: value.muscleGroups.includes(group) ? value.muscleGroups.filter((item) => item !== group) : [...value.muscleGroups, group] });
  return <div className="grid gap-3">
    <fieldset disabled={readOnly} className="grid gap-1.5">
      <legend className="mb-1 text-xs font-semibold text-slate-700">Nhóm cơ</legend>
      {muscleGroupOptions.length ? <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">{muscleGroupOptions.map((group) => <label key={group} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700"><input type="checkbox" checked={value.muscleGroups.includes(group)} onChange={() => toggleMuscleGroup(group)} /> {group}</label>)}</div> : <p className="text-xs text-slate-500">Chưa có nhóm cơ trong thư viện.</p>}
    </fieldset>
    <label className="grid gap-1 text-xs font-semibold text-slate-700">Sets
      <input className={fieldClass} aria-label="Sets chung" placeholder="Ví dụ: 4" type="number" min="1" max="100" value={value.defaultSets ?? ''} disabled={readOnly} onChange={(event) => patch({ defaultSets: event.target.value ? Number(event.target.value) : undefined })} />
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-700">Reps
      <input className={fieldClass} aria-label="Reps chung" placeholder="Ví dụ: 8-12" value={value.defaultReps} disabled={readOnly} onChange={(event) => patch({ defaultReps: event.target.value })} />
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-700">Weight
      <input className={fieldClass} aria-label="Weight chung" placeholder="Ví dụ: 60-70% 1RM" value={value.defaultWeight} disabled={readOnly} onChange={(event) => patch({ defaultWeight: event.target.value })} />
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-700">Tempo
      <input className={fieldClass} aria-label="Tempo chung" placeholder="Ví dụ: 3-1-1-0" value={value.defaultTempo} disabled={readOnly} onChange={(event) => patch({ defaultTempo: event.target.value })} />
    </label>
    <label className="grid gap-1 text-xs font-semibold text-slate-700">Ghi chú kỹ thuật
      <textarea className={`${fieldClass} min-h-24 resize-y`} aria-label="Ghi chú kỹ thuật chung" placeholder="Nguyên tắc kỹ thuật áp dụng cho giáo án..." maxLength={2000} value={value.technicalNotes} disabled={readOnly} onChange={(event) => patch({ technicalNotes: event.target.value })} />
    </label>
  </div>;
}
