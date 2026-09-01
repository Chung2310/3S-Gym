import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Calendar, CheckCircle2, ClipboardList, Dumbbell, MessageSquare, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import {
  errorMessage,
  TRACKING_TYPE_LABELS,
  type BodyweightPrescription,
  type BodyweightResult,
  type CardioPrescription,
  type CardioResult,
  type CompletedSetResult,
  type IntervalPrescription,
  type IntervalResult,
  type MobilityPrescription,
  type MobilityResult,
  type StrengthPrescription,
  type StrengthResult,
  type TrackingPrescription,
  type TrackingResult,
  type TrackingType,
} from '../../types';
import { useToast } from '../ui/ToastProvider';
import ProgressEmptyState from './ProgressEmptyState';
import BodyweightResultEditor from './tracking/BodyweightResultEditor';
import CardioResultEditor from './tracking/CardioResultEditor';
import IntervalResultEditor from './tracking/IntervalResultEditor';
import MobilityResultEditor from './tracking/MobilityResultEditor';
import StrengthResultEditor from './tracking/StrengthResultEditor';

interface PlannedExercise {
  exerciseId?: string;
  name: string;
  trackingType: TrackingType;
  prescription: TrackingPrescription;
}

export interface WorkoutLoggerActivePlan {
  _id: string;
  version: number;
  title: string;
  sessions?: Array<{ name: string; exercises?: PlannedExercise[] }>;
}

interface Props {
  customerId: string;
  activePlan: WorkoutLoggerActivePlan | null;
  onSaved: () => void;
}

interface ExerciseResultDraft {
  result: TrackingResult;
  notes?: string;
}

const key = () =>
  globalThis.crypto?.randomUUID?.() ||
  `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const setResult = (): CompletedSetResult => ({ id: key(), completed: true });

function materialize(exercise: PlannedExercise): ExerciseResultDraft {
  if (exercise.trackingType === 'STRENGTH' || exercise.trackingType === 'BODYWEIGHT') {
    const count = Math.max(1, Number((exercise.prescription as StrengthPrescription).sets || 1));
    return { result: { sets: Array.from({ length: count }, setResult) } };
  }
  return { result: {} };
}

function stripClientIds(result: TrackingResult): TrackingResult {
  if ('sets' in result && Array.isArray(result.sets)) {
    return { ...result, sets: result.sets.map(({ id: _id, ...set }) => set) };
  }
  return { ...result };
}

function resultEditor(
  exercise: PlannedExercise,
  value: TrackingResult,
  onChange: (result: TrackingResult) => void,
): ReactNode {
  if (exercise.trackingType === 'STRENGTH') {
    return (
      <StrengthResultEditor
        exerciseName={exercise.name}
        prescription={exercise.prescription as StrengthPrescription}
        value={value as StrengthResult}
        onChange={onChange}
      />
    );
  }
  if (exercise.trackingType === 'BODYWEIGHT') {
    return (
      <BodyweightResultEditor
        exerciseName={exercise.name}
        prescription={exercise.prescription as BodyweightPrescription}
        value={value as BodyweightResult}
        onChange={onChange}
      />
    );
  }
  if (exercise.trackingType === 'CARDIO') {
    return (
      <CardioResultEditor
        exerciseName={exercise.name}
        prescription={exercise.prescription as CardioPrescription}
        value={value as CardioResult}
        onChange={onChange}
      />
    );
  }
  if (exercise.trackingType === 'INTERVAL') {
    return (
      <IntervalResultEditor
        exerciseName={exercise.name}
        prescription={exercise.prescription as IntervalPrescription}
        value={value as IntervalResult}
        onChange={onChange}
      />
    );
  }
  if (exercise.trackingType === 'MOBILITY') {
    return (
      <MobilityResultEditor
        exerciseName={exercise.name}
        prescription={exercise.prescription as MobilityPrescription}
        value={value as MobilityResult}
        onChange={onChange}
      />
    );
  }
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
      Bài tập này chưa có cách ghi nhận. Hãy cập nhật giáo án trước khi ghi buổi tập.
    </p>
  );
}

export default function WorkoutSessionLogger({ customerId, activePlan, onSaved }: Props) {
  const toast = useToast();
  const idempotencyKey = useRef(key());
  const submitting = useRef(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [performedAt, setPerformedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [feeling, setFeeling] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [editedResults, setEditedResults] = useState<Record<number, ExerciseResultDraft[]>>({});

  const exercises = activePlan?.sessions?.[sessionIndex]?.exercises || [];
  const initialResults = useMemo(() => exercises.map(materialize), [exercises]);
  const results = editedResults[sessionIndex] || initialResults;
  const hasUnclassified = exercises.some(
    (exercise) => !exercise.trackingType || exercise.trackingType === 'UNCLASSIFIED',
  );

  useEffect(() => {
    setSessionIndex(0);
    setEditedResults({});
  }, [activePlan?._id, activePlan?.version]);

  if (!activePlan) {
    return (
      <ProgressEmptyState
        icon={ClipboardList}
        title="Chưa có giáo án đang áp dụng"
        description="Hãy gán giáo án cho khách hàng trước khi ghi nhận một buổi tập mới."
      />
    );
  }

  const updateResult = (exerciseIndex: number, result: TrackingResult) =>
    setEditedResults((current) => {
      const next = (current[sessionIndex] || initialResults).map((draft) => ({ ...draft }));
      next[exerciseIndex] = { ...next[exerciseIndex], result };
      return { ...current, [sessionIndex]: next };
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || (attendance !== 'ABSENT' && hasUnclassified)) return;
    submitting.current = true;
    setLoading(true);
    try {
      const exerciseResults =
        attendance === 'ABSENT'
          ? []
          : exercises.map((exercise, exerciseIndex) => ({
              ...(exercise.exerciseId ? { exerciseId: exercise.exerciseId } : {}),
              exerciseIndex,
              result: stripClientIds(results[exerciseIndex].result),
              ...(results[exerciseIndex].notes ? { notes: results[exerciseIndex].notes } : {}),
            }));

      const result = await api.post('/api/workout-sessions', {
        customerId,
        workoutPlanId: activePlan._id,
        workoutPlanVersion: activePlan.version,
        sessionIndex,
        performedAt,
        attendance,
        exerciseResults,
        feeling,
        notes,
        idempotencyKey: idempotencyKey.current,
      });
      toast.success(result.message);
      onSaved();
      idempotencyKey.current = key();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <form aria-label="Ghi nhận buổi tập" onSubmit={submit}>
      {/* 1. Thông tin ca tập — dùng profile-form-section và profile-form-grid từ index.css */}
      <section className="profile-form-section pt-0">
        <h3>
          <Sparkles size={16} />
          <span>Giáo án & Ca tập</span>
        </h3>
        <div className="pt-detail-info-card mb-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Giáo án áp dụng</div>
              <div className="text-base font-bold text-[#003b70] mt-0.5">{activePlan.title}</div>
            </div>
            <div className="pt-detail-chip">
              {(activePlan.sessions || []).length} Buổi tập
            </div>
          </div>
        </div>

        <div className="profile-form-grid">
          <div className="field">
            <label htmlFor="session-select">Buổi tập</label>
            <select
              id="session-select"
              value={sessionIndex}
              onChange={(event) => setSessionIndex(Number(event.target.value))}
            >
              {(activePlan.sessions || []).map((session, index) => (
                <option key={`${session.name}-${index}`} value={index}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="performed-at">Ngày tập</label>
            <input
              id="performed-at"
              aria-label="Ngày tập"
              type="date"
              value={performedAt}
              onChange={(event) => setPerformedAt(event.target.value)}
              required
            />
          </div>

          <div className="field grid-full-width">
            <label htmlFor="attendance-select">Điểm danh</label>
            <select
              id="attendance-select"
              aria-label="Điểm danh"
              value={attendance}
              onChange={(event) => setAttendance(event.target.value as typeof attendance)}
            >
              <option value="PRESENT">🟢 Có mặt</option>
              <option value="LATE">🟡 Đi muộn</option>
              <option value="ABSENT">🔴 Vắng mặt</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Danh sách bài tập — dùng profile-form-section và pt-card từ index.css */}
      {attendance !== 'ABSENT' && (
        <section className="profile-form-section">
          <h3>
            <Dumbbell size={16} />
            <span>Kết quả bài tập ({exercises.length})</span>
          </h3>

          <div className="flex flex-col gap-3.5">
            {exercises.map((exercise, exerciseIndex) => (
              <div
                className="pt-card"
                key={`${exercise.exerciseId || exercise.name}-${exerciseIndex}`}
              >
                <div className="pt-card-body">
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-100">
                        {exerciseIndex + 1}
                      </div>
                      <h4 className="text-sm font-bold text-[#003b70] m-0">
                        {exercise.name}
                      </h4>
                    </div>
                    <span className="pt-detail-chip text-xs py-1 px-2.5">
                      {TRACKING_TYPE_LABELS[exercise.trackingType || 'UNCLASSIFIED']}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    {resultEditor(exercise, results[exerciseIndex]?.result, (result) =>
                      updateResult(exerciseIndex, result),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Cảm nhận & Ghi chú — dùng profile-form-section và profile-form-grid từ index.css */}
      <section className="profile-form-section">
        <h3>
          <MessageSquare size={16} />
          <span>Cảm nhận & Ghi chú</span>
        </h3>
        <div className="profile-form-grid">
          <div className="field">
            <label htmlFor="session-feeling">Cảm nhận sau buổi tập</label>
            <textarea
              id="session-feeling"
              rows={3}
              aria-label="Cảm nhận sau buổi tập"
              placeholder="Ví dụ: Thể lực tốt, hoàn thành trọn vẹn giáo án..."
              value={feeling}
              onChange={(event) => setFeeling(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="session-notes">Ghi chú chuyên môn</label>
            <textarea
              id="session-notes"
              rows={3}
              aria-label="Ghi chú buổi tập"
              placeholder="Nhập lưu ý kỹ thuật, điều chỉnh tạ buổi sau..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 4. Action Buttons — dùng profile-form-actions từ index.css */}
      <div className="profile-form-actions mt-4">
        <button
          className="button button-primary"
          disabled={loading || (attendance !== 'ABSENT' && hasUnclassified)}
          type="submit"
        >
          <CheckCircle2 size={16} className="inline mr-1" />
          <span>{loading ? 'Đang lưu kết quả...' : 'Hoàn tất buổi tập'}</span>
        </button>
      </div>
    </form>
  );
}
