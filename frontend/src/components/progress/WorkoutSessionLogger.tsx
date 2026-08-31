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
  if (!activePlan) return <section className="empty-state progress-form-empty">Khách hàng chưa có giáo án đang áp dụng.</section>;
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
  return <form className="panel progress-form" onSubmit={submit}>
    <div><h2 className="progress-form-title">Ghi nhận buổi tập</h2><p className="progress-form-description">{activePlan.title}</p></div>
    <div className="form-grid progress-session-meta">
      <label className="field"><span>Buổi tập</span><select value={sessionIndex} onChange={(event) => setSessionIndex(Number(event.target.value))}>{(activePlan.sessions || []).map((session, index) => <option key={`${session.name}-${index}`} value={index}>{session.name}</option>)}</select></label>
      <label className="field"><span>Ngày tập</span><input aria-label="Ngày tập" type="date" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
      <label className="field"><span>Điểm danh</span><select value={attendance} onChange={(event) => setAttendance(event.target.value as typeof attendance)}><option value="PRESENT">Có mặt</option><option value="LATE">Đi muộn</option><option value="ABSENT">Vắng</option></select></label>
    </div>
    {logs.map((exercise, exerciseIndex) => <fieldset className="progress-exercise-card" key={`${exercise.name}-${exerciseIndex}`}><legend className="progress-exercise-title">{exercise.name}</legend><div className="progress-set-list">{exercise.sets.map((set, setIndex) => <div className="progress-set-grid" key={setIndex}>{(['weight', 'reps', 'rpe', 'rir'] as const).map((field) => <label className="field progress-set-field" key={field}><span>{field === 'weight' ? 'Mức tạ' : field.toUpperCase()}</span><input type="number" min="0" max={field === 'rpe' ? 10 : undefined} step={field === 'weight' || field === 'rpe' ? '0.1' : '1'} aria-label={`${exercise.name} set ${setIndex + 1} ${field === 'weight' ? 'mức tạ' : field.toUpperCase()}`} placeholder="0" value={set[field] ?? ''} onChange={(event) => updateSet(exerciseIndex, setIndex, field, event.target.value === '' ? undefined : Number(event.target.value))} /></label>)}<label className="progress-check-field"><input type="checkbox" checked={set.completed} onChange={(event) => updateSet(exerciseIndex, setIndex, 'completed', event.target.checked)} /> Hoàn thành</label></div>)}</div></fieldset>)}
    <div className="form-grid progress-note-grid"><label className="field"><span>Cảm nhận sau buổi tập</span><textarea aria-label="Cảm nhận sau buổi tập" placeholder="Ví dụ: khỏe, hơi mỏi chân..." value={feeling} onChange={(event) => setFeeling(event.target.value)} /></label><label className="field"><span>Ghi chú</span><textarea aria-label="Ghi chú buổi tập" placeholder="Nhập ghi chú dành cho khách hàng..." value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div>
    <button className="button button-primary" disabled={loading}>{loading ? 'Đang lưu...' : 'Hoàn tất buổi tập'}</button>
  </form>;
}
