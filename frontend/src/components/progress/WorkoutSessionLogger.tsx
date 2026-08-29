import { useMemo, useRef, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { errorMessage, type WorkoutExerciseLog } from '../../types';
import { useToast } from '../ui/ToastProvider';

interface PlannedExercise { name: string; sets?: number; reps?: string | number }
interface ActivePlan { _id: string; sourceTemplateId?: string; title: string; sessions?: Array<{ name: string; exercises?: PlannedExercise[] }> }
interface Props { customerId: string; activePlan: ActivePlan | null; onSaved: () => void }
const key = () => globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function materialize(plan: ActivePlan, sessionIndex: number): WorkoutExerciseLog[] {
  return (plan.sessions?.[sessionIndex]?.exercises || []).map((exercise) => ({
    name: exercise.name,
    sets: Array.from({ length: Math.max(1, Number(exercise.sets || 1)) }, () => ({ reps: typeof exercise.reps === 'number' ? exercise.reps : undefined, completed: true })),
    notes: '',
  }));
}

export default function WorkoutSessionLogger({ customerId, activePlan, onSaved }: Props) {
  const toast = useToast(); const idempotencyKey = useRef(key()); const submitting = useRef(false);
  const [sessionIndex, setSessionIndex] = useState(0); const [performedAt, setPerformedAt] = useState('');
  const [attendance, setAttendance] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [feeling, setFeeling] = useState(''); const [notes, setNotes] = useState(''); const [loading, setLoading] = useState(false);
  const initialLogs = useMemo(() => activePlan ? materialize(activePlan, sessionIndex) : [], [activePlan, sessionIndex]);
  const [editedLogs, setEditedLogs] = useState<Record<number, WorkoutExerciseLog[]>>({});
  if (!activePlan) return <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center font-montserrat text-sm text-slate-600">Khách hàng chưa có giáo án đang áp dụng.</section>;
  const logs = editedLogs[sessionIndex] || initialLogs;
  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rpe' | 'rir' | 'completed', value: number | boolean | undefined) => setEditedLogs((current) => {
    const next = (current[sessionIndex] || initialLogs).map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ ...set })) }));
    next[exerciseIndex].sets[setIndex] = { ...next[exerciseIndex].sets[setIndex], [field]: value };
    return { ...current, [sessionIndex]: next };
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (submitting.current) return; submitting.current = true; setLoading(true);
    try {
      const result = await api.post('/api/workout-sessions', { customerId, templateId: activePlan.sourceTemplateId || activePlan._id, sessionIndex, performedAt, attendance, exerciseLogs: logs, feeling, notes, idempotencyKey: idempotencyKey.current });
      toast.success(result.message); onSaved(); idempotencyKey.current = key();
    } catch (error) { toast.error(errorMessage(error)); } finally { submitting.current = false; setLoading(false); }
  };
  return <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-6" onSubmit={submit}>
    <div><h2 className="font-oswald text-2xl font-bold uppercase text-primary">Ghi nhận buổi tập</h2><p className="mt-1 font-montserrat text-sm text-slate-600">{activePlan.title}</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Buổi tập</span><select className="min-h-11 rounded-lg border border-slate-300 px-3" value={sessionIndex} onChange={(event) => setSessionIndex(Number(event.target.value))}>{(activePlan.sessions || []).map((session, index) => <option key={`${session.name}-${index}`} value={index}>{session.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Ngày tập</span><input className="min-h-11 rounded-lg border border-slate-300 px-3" aria-label="Ngày tập" type="date" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Điểm danh</span><select className="min-h-11 rounded-lg border border-slate-300 px-3" value={attendance} onChange={(event) => setAttendance(event.target.value as typeof attendance)}><option value="PRESENT">Có mặt</option><option value="LATE">Đi muộn</option><option value="ABSENT">Vắng</option></select></label>
    </div>
    {logs.map((exercise, exerciseIndex) => <fieldset className="rounded-xl border border-slate-200 p-4" key={`${exercise.name}-${exerciseIndex}`}><legend className="px-2 font-bold text-primary">{exercise.name}</legend><div className="space-y-3">{exercise.sets.map((set, setIndex) => <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" key={setIndex}>{(['weight', 'reps', 'rpe', 'rir'] as const).map((field) => <label className="grid gap-1 text-xs font-semibold text-slate-600" key={field}><span>{field === 'weight' ? 'Mức tạ' : field.toUpperCase()}</span><input className="min-h-10 rounded-md border border-slate-300 px-2" type="number" min="0" max={field === 'rpe' ? 10 : undefined} step={field === 'weight' || field === 'rpe' ? '0.1' : '1'} aria-label={`${exercise.name} set ${setIndex + 1} ${field === 'weight' ? 'mức tạ' : field.toUpperCase()}`} placeholder="0" value={set[field] ?? ''} onChange={(event) => updateSet(exerciseIndex, setIndex, field, event.target.value === '' ? undefined : Number(event.target.value))} /></label>)}<label className="flex min-h-10 items-center gap-2 self-end text-xs font-semibold text-slate-700"><input type="checkbox" checked={set.completed} onChange={(event) => updateSet(exerciseIndex, setIndex, 'completed', event.target.checked)} /> Hoàn thành</label></div>)}</div></fieldset>)}
    <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Cảm nhận sau buổi tập</span><textarea className="rounded-lg border border-slate-300 p-3" aria-label="Cảm nhận sau buổi tập" placeholder="Ví dụ: khỏe, hơi mỏi chân..." value={feeling} onChange={(event) => setFeeling(event.target.value)} /></label><label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Ghi chú</span><textarea className="rounded-lg border border-slate-300 p-3" aria-label="Ghi chú buổi tập" placeholder="Nhập ghi chú dành cho khách hàng..." value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div>
    <button className="button button-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>{loading ? 'Đang lưu...' : 'Hoàn tất buổi tập'}</button>
  </form>;
}
