import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ClipboardList } from 'lucide-react';
import { api } from '../../services/api';
import { buildBodyMeasurementInput } from '../../services/bodyMeasurement';
import { uploadWorkoutProgressPhotos } from '../../services/progressPhotos';
import { errorMessage, TRACKING_TYPE_LABELS, type BodyMeasurementDraft, type BodyweightPrescription, type BodyweightResult, type CardioPrescription, type CardioResult, type CompletedSetResult, type IntervalPrescription, type IntervalResult, type MobilityPrescription, type MobilityResult, type StrengthPrescription, type StrengthResult, type TrackingPrescription, type TrackingResult, type TrackingType, type WorkoutProgressPhotoDraft } from '../../types';
import { useToast } from '../ui/ToastProvider';
import ProgressEmptyState from './ProgressEmptyState';
import BodyweightResultEditor from './tracking/BodyweightResultEditor';
import CardioResultEditor from './tracking/CardioResultEditor';
import IntervalResultEditor from './tracking/IntervalResultEditor';
import MobilityResultEditor from './tracking/MobilityResultEditor';
import StrengthResultEditor from './tracking/StrengthResultEditor';
import WorkoutMeasurementFields from './WorkoutMeasurementFields';
import WorkoutProgressPhotoFields from './WorkoutProgressPhotoFields';

interface PlannedExercise { exerciseId?: string; name: string; trackingType: TrackingType; prescription: TrackingPrescription }
export interface WorkoutLoggerActivePlan { _id: string; version: number; title: string; sessions?: Array<{ name: string; exercises?: PlannedExercise[] }> }
interface Props { customerId: string; activePlan: WorkoutLoggerActivePlan | null; onSaved: () => void }
interface ExerciseResultDraft { result: TrackingResult; notes?: string }

const key = () => globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const setResult = (): CompletedSetResult => ({ id: key(), completed: true });

function materialize(exercise: PlannedExercise): ExerciseResultDraft {
  if (exercise.trackingType === 'STRENGTH' || exercise.trackingType === 'BODYWEIGHT') {
    return { result: { sets: [setResult()] } };
  }
  return { result: {} };
}

function stripClientIds(result: TrackingResult): TrackingResult {
  if ('sets' in result && Array.isArray(result.sets)) return { ...result, sets: result.sets.map(({ id: _id, ...set }) => set) };
  return { ...result };
}

function resultEditor(exercise: PlannedExercise, value: TrackingResult, onChange: (result: TrackingResult) => void): ReactNode {
  if (exercise.trackingType === 'STRENGTH') return <StrengthResultEditor exerciseName={exercise.name} prescription={exercise.prescription as StrengthPrescription} value={value as StrengthResult} onChange={onChange} />;
  if (exercise.trackingType === 'BODYWEIGHT') return <BodyweightResultEditor exerciseName={exercise.name} prescription={exercise.prescription as BodyweightPrescription} value={value as BodyweightResult} onChange={onChange} />;
  if (exercise.trackingType === 'CARDIO') return <CardioResultEditor exerciseName={exercise.name} prescription={exercise.prescription as CardioPrescription} value={value as CardioResult} onChange={onChange} />;
  if (exercise.trackingType === 'INTERVAL') return <IntervalResultEditor exerciseName={exercise.name} prescription={exercise.prescription as IntervalPrescription} value={value as IntervalResult} onChange={onChange} />;
  if (exercise.trackingType === 'MOBILITY') return <MobilityResultEditor exerciseName={exercise.name} prescription={exercise.prescription as MobilityPrescription} value={value as MobilityResult} onChange={onChange} />;
  return <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">Bài tập này chưa có cách ghi nhận. Hãy cập nhật giáo án trước khi ghi buổi tập.</p>;
}

export default function WorkoutSessionLogger({ customerId, activePlan, onSaved }: Props) {
  const toast = useToast(); const idempotencyKey = useRef(key()); const submitting = useRef(false);
  const [sessionIndex, setSessionIndex] = useState(0); const [performedAt, setPerformedAt] = useState('');
  const [attendance, setAttendance] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [feeling, setFeeling] = useState(''); const [notes, setNotes] = useState(''); const [loading, setLoading] = useState(false);
  const [measurement, setMeasurement] = useState<BodyMeasurementDraft>({});
  const [progressPhotos, setProgressPhotos] = useState<WorkoutProgressPhotoDraft[]>([]);
  const [editedResults, setEditedResults] = useState<Record<number, ExerciseResultDraft[]>>({});
  const exercises = useMemo(() => activePlan?.sessions?.[sessionIndex]?.exercises || [], [activePlan, sessionIndex]);
  const initialResults = useMemo(() => exercises.map(materialize), [exercises]);
  const results = editedResults[sessionIndex] || initialResults;
  const hasUnclassified = exercises.some((exercise) => !exercise.trackingType || exercise.trackingType === 'UNCLASSIFIED');
  useEffect(() => { setSessionIndex(0); setEditedResults({}); }, [activePlan?._id, activePlan?.version]);

  if (!activePlan) return <ProgressEmptyState icon={ClipboardList} title="Chưa có giáo án đang áp dụng" description="Hãy gán giáo án cho khách hàng trước khi ghi nhận một buổi tập mới." />;

  const updateResult = (exerciseIndex: number, result: TrackingResult) => setEditedResults((current) => {
    const next = (current[sessionIndex] || initialResults).map((draft) => ({ ...draft }));
    next[exerciseIndex] = { ...next[exerciseIndex], result };
    return { ...current, [sessionIndex]: next };
  });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (submitting.current || (attendance !== 'ABSENT' && hasUnclassified)) return; submitting.current = true; setLoading(true);
    try {
      const exerciseResults = attendance === 'ABSENT' ? [] : exercises.map((exercise, exerciseIndex) => ({ ...(exercise.exerciseId ? { exerciseId: exercise.exerciseId } : {}), exerciseIndex, result: stripClientIds(results[exerciseIndex].result), ...(results[exerciseIndex].notes ? { notes: results[exerciseIndex].notes } : {}) }));
      const bodyMeasurement = attendance === 'ABSENT' ? undefined : buildBodyMeasurementInput(measurement);
      const uploadedPhotos = attendance === 'ABSENT' ? [] : await uploadWorkoutProgressPhotos(progressPhotos);
      const result = await api.post('/api/workout-sessions', { customerId, workoutPlanId: activePlan._id, workoutPlanVersion: activePlan.version, sessionIndex, performedAt, attendance, exerciseResults, feeling, notes, idempotencyKey: idempotencyKey.current, ...(bodyMeasurement ? { bodyMeasurement } : {}), ...(uploadedPhotos.length > 0 ? { progressPhotos: uploadedPhotos } : {}) });
      toast.success(result.message); onSaved(); idempotencyKey.current = key();
    } catch (error) { toast.error(errorMessage(error)); } finally { submitting.current = false; setLoading(false); }
  };
  return <form aria-label="Ghi nhận buổi tập" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 font-montserrat sm:p-6" onSubmit={submit}>
    <div><h2 className="font-oswald text-2xl font-bold uppercase text-primary">Ghi nhận buổi tập</h2><p className="mt-1 font-montserrat text-sm text-slate-600">{activePlan.title}</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Buổi tập</span><select className="min-h-11 rounded-lg border border-slate-300 px-3" value={sessionIndex} onChange={(event) => setSessionIndex(Number(event.target.value))}>{(activePlan.sessions || []).map((session, index) => <option key={`${session.name}-${index}`} value={index}>{session.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Ngày tập</span><input className="min-h-11 rounded-lg border border-slate-300 px-3" aria-label="Ngày tập" type="date" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} required /></label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Điểm danh</span><select aria-label="Điểm danh" className="min-h-11 rounded-lg border border-slate-300 px-3" value={attendance} onChange={(event) => setAttendance(event.target.value as typeof attendance)}><option value="PRESENT">Có mặt</option><option value="LATE">Đi muộn</option><option value="ABSENT">Vắng</option></select></label>
    </div>
    {attendance !== 'ABSENT' && exercises.map((exercise, exerciseIndex) => <fieldset className="rounded-xl border border-slate-200 p-4" key={`${exercise.exerciseId || exercise.name}-${exerciseIndex}`}><legend className="flex items-center gap-2 px-2 font-bold text-primary"><span>{exercise.name}</span><span className="rounded-full bg-sky-50 px-2 py-0.5 text-[0.65rem] font-bold text-secondary">{TRACKING_TYPE_LABELS[exercise.trackingType || 'UNCLASSIFIED']}</span></legend><div className="mt-2">{resultEditor(exercise, results[exerciseIndex].result, (result) => updateResult(exerciseIndex, result))}</div></fieldset>)}
    {attendance !== 'ABSENT' && <WorkoutMeasurementFields value={measurement} onChange={setMeasurement} />}
    {attendance !== 'ABSENT' && <WorkoutProgressPhotoFields value={progressPhotos} onChange={setProgressPhotos} disabled={loading} />}
    <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Cảm nhận sau buổi tập</span><textarea className="rounded-lg border border-slate-300 p-3" aria-label="Cảm nhận sau buổi tập" placeholder="Ví dụ: khỏe, hơi mỏi chân..." value={feeling} onChange={(event) => setFeeling(event.target.value)} /></label><label className="grid gap-1 text-sm font-semibold text-slate-700"><span>Ghi chú</span><textarea className="rounded-lg border border-slate-300 p-3" aria-label="Ghi chú buổi tập" placeholder="Nhập ghi chú dành cho khách hàng..." value={notes} onChange={(event) => setNotes(event.target.value)} /></label></div>
    <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none" disabled={loading || (attendance !== 'ABSENT' && hasUnclassified)}>{loading ? 'Đang lưu...' : 'Hoàn tất buổi tập'}</button>
  </form>;
}
