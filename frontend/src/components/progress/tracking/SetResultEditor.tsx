import type { CompletedSetResult } from '../../../types';
import TrackingNumberField from './TrackingNumberField';

interface Props {
  exerciseName: string;
  value: CompletedSetResult[];
  mode: 'STRENGTH' | 'BODYWEIGHT';
  targetReps?: string;
  targetWeight?: number;
  onChange: (sets: CompletedSetResult[]) => void;
}

const resultId = () => globalThis.crypto?.randomUUID?.() || `set-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SetResultEditor({ exerciseName, value, mode, targetReps, targetWeight, onChange }: Props) {
  const update = (index: number, patch: Partial<CompletedSetResult>) => onChange(value.map((set, position) => position === index ? { ...set, ...patch } : set));
  const weightField = mode === 'STRENGTH' ? { key: 'weight' as const, label: 'Mức tạ (kg)', aria: 'mức tạ', placeholder: targetWeight } : { key: 'addedWeight' as const, label: 'Tạ thêm (kg) · tùy chọn', aria: 'tạ thêm', placeholder: targetWeight };
  return <div className="space-y-3">{value.map((set, index) => <section className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={set.id || index}><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-sm text-primary">Set {index + 1}</strong>{value.length > 1 && <button className="text-button text-danger" type="button" aria-label={`Xóa set ${index + 1} của ${exerciseName}`} onClick={() => onChange(value.filter((_, position) => position !== index))}>Xóa set</button>}</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><TrackingNumberField label="REPS" ariaLabel={`${exerciseName} set ${index + 1} REPS`} value={set.reps} placeholder={targetReps} onChange={(reps) => update(index, { reps })} /><TrackingNumberField label={weightField.label} ariaLabel={`${exerciseName} set ${index + 1} ${weightField.aria}`} value={set[weightField.key]} placeholder={weightField.placeholder} step="0.1" onChange={(weight) => update(index, { [weightField.key]: weight })} /><TrackingNumberField label="RPE" ariaLabel={`${exerciseName} set ${index + 1} RPE`} value={set.rpe} max={10} step="0.1" onChange={(rpe) => update(index, { rpe })} /><TrackingNumberField label="RIR" ariaLabel={`${exerciseName} set ${index + 1} RIR`} value={set.rir} onChange={(rir) => update(index, { rir })} /><label className="flex min-h-10 items-center gap-2 self-end text-xs font-semibold text-slate-700"><input type="checkbox" checked={set.completed} onChange={(event) => update(index, { completed: event.target.checked })} /> Hoàn thành</label></div></section>)}<button className="button button-secondary" type="button" aria-label={`Thêm set cho ${exerciseName}`} onClick={() => onChange([...value, { id: resultId(), completed: true }])}>Thêm set</button></div>;
}
