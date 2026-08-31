import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { errorMessage, type WorkoutExerciseLog } from '../../types';
import { useToast } from '../ui/ToastProvider';
import ProgressEmptyState from './ProgressEmptyState';

interface PlannedExercise {
  name: string;
  sets?: number;
  reps?: string | number;
}

interface ActivePlan {
  _id: string;
  sourceTemplateId?: string;
  title: string;
  sessions?: Array<{ name: string; exercises?: PlannedExercise[] }>;
}

interface Props {
  customerId: string;
  activePlan: ActivePlan | null;
  onSaved: () => void;
}

const key = () =>
  globalThis.crypto?.randomUUID?.() ||
  `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function materialize(plan: ActivePlan, sessionIndex: number): WorkoutExerciseLog[] {
  return (plan.sessions?.[sessionIndex]?.exercises || []).map((exercise) => ({
    name: exercise.name,
    sets: Array.from({ length: Math.max(1, Number(exercise.sets || 1)) }, () => ({
      reps: typeof exercise.reps === 'number' ? exercise.reps : undefined,
      completed: true,
    })),
    notes: '',
  }));
}

export default function WorkoutSessionLogger({ customerId, activePlan, onSaved }: Props) {
  const toast = useToast();
  const idempotencyKey = useRef(key());
  const submitting = useRef(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [performedAt, setPerformedAt] = useState('');
  const [attendance, setAttendance] = useState<'PRESENT' | 'LATE' | 'ABSENT'>('PRESENT');
  const [feeling, setFeeling] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const initialLogs = useMemo(
    () => (activePlan ? materialize(activePlan, sessionIndex) : []),
    [activePlan, sessionIndex],
  );
  const [editedLogs, setEditedLogs] = useState<Record<number, WorkoutExerciseLog[]>>({});

  if (!activePlan) {
    return (
      <ProgressEmptyState
        icon={ClipboardList}
        title="Chưa có giáo án đang áp dụng"
        description="Hãy gán giáo án cho khách hàng trước khi ghi nhận một buổi tập mới."
      />
    );
  }

  const logs = editedLogs[sessionIndex] || initialLogs;

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'weight' | 'reps' | 'rpe' | 'rir' | 'completed',
    value: number | boolean | undefined,
  ) => {
    setEditedLogs((current) => {
      const next = (current[sessionIndex] || initialLogs).map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({ ...set })),
      }));
      next[exerciseIndex].sets[setIndex] = {
        ...next[exerciseIndex].sets[setIndex],
        [field]: value,
      };
      return { ...current, [sessionIndex]: next };
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      const result = await api.post('/api/workout-sessions', {
        customerId,
        templateId: activePlan.sourceTemplateId || activePlan._id,
        sessionIndex,
        performedAt,
        attendance,
        exerciseLogs: logs,
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
      <h2 className="sr-only">Ghi nhận buổi tập</h2>

      {/* 1. Giáo án đang áp dụng — dùng profile-form-section và pt-detail-info-card từ index.css */}
      <section className="profile-form-section pt-0">
        <h3>
          <Sparkles size={16} />
          <span>Giáo án đang áp dụng</span>
        </h3>
        <div className="pt-detail-info-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Tên giáo án</div>
              <div className="text-base font-bold text-[#003b70] mt-0.5">{activePlan.title}</div>
            </div>
            <div className="pt-detail-chip">
              {(activePlan.sessions || []).length} Buổi tập
            </div>
          </div>
        </div>
      </section>

      {/* 2. Thông tin ca tập — dùng profile-form-section, profile-form-grid và field từ index.css */}
      <section className="profile-form-section">
        <h3>
          <Calendar size={16} />
          <span>Thông tin ca tập</span>
        </h3>
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

      {/* 3. Danh sách bài tập — dùng profile-form-section và pt-card từ index.css */}
      <section className="profile-form-section">
        <h3>
          <Dumbbell size={16} />
          <span>Kết quả các bài tập ({logs.length})</span>
        </h3>
        <div className="flex flex-col gap-3">
          {logs.map((exercise, exerciseIndex) => (
            <div className="pt-card" key={`${exercise.name}-${exerciseIndex}`}>
              <div className="pt-card-body">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-100">
                      {exerciseIndex + 1}
                    </div>
                    <h4 className="text-sm font-bold text-[#003b70] m-0">
                      {exercise.name}
                    </h4>
                  </div>
                  <span className="pt-detail-chip text-xs py-1 px-2.5">
                    {exercise.sets.length} sets
                  </span>
                </div>

                <div className="flex flex-col gap-2 mt-2.5">
                  {exercise.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="field">
                        <label className="text-[11px] text-slate-500 font-semibold">Mức tạ (kg)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          aria-label={`${exercise.name} set ${setIndex + 1} mức tạ`}
                          placeholder="0"
                          value={set.weight ?? ''}
                          onChange={(event) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'weight',
                              event.target.value === '' ? undefined : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="field">
                        <label className="text-[11px] text-slate-500 font-semibold">Reps</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          aria-label={`${exercise.name} set ${setIndex + 1} REPS`}
                          placeholder="0"
                          value={set.reps ?? ''}
                          onChange={(event) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'reps',
                              event.target.value === '' ? undefined : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="field">
                        <label className="text-[11px] text-slate-500 font-semibold">RPE (1-10)</label>
                        <input
                          type="number"
                          min="0"
                          max={10}
                          step="0.5"
                          aria-label={`${exercise.name} set ${setIndex + 1} RPE`}
                          placeholder="0"
                          value={set.rpe ?? ''}
                          onChange={(event) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'rpe',
                              event.target.value === '' ? undefined : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="field">
                        <label className="text-[11px] text-slate-500 font-semibold">RIR</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          aria-label={`${exercise.name} set ${setIndex + 1} RIR`}
                          placeholder="0"
                          value={set.rir ?? ''}
                          onChange={(event) =>
                            updateSet(
                              exerciseIndex,
                              setIndex,
                              'rir',
                              event.target.value === '' ? undefined : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <label className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          checked={set.completed}
                          onChange={(event) =>
                            updateSet(exerciseIndex, setIndex, 'completed', event.target.checked)
                          }
                        />
                        <span>Đạt</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Cảm nhận & Ghi chú — dùng profile-form-section, profile-form-grid và field từ index.css */}
      <section className="profile-form-section">
        <h3>
          <MessageSquare size={16} />
          <span>Đánh giá & Ghi chú</span>
        </h3>
        <div className="profile-form-grid">
          <div className="field">
            <label htmlFor="workout-feeling">Cảm nhận sau buổi tập</label>
            <textarea
              id="workout-feeling"
              rows={3}
              aria-label="Cảm nhận sau buổi tập"
              placeholder="Ví dụ: Thể lực tốt, hoàn thành trọn vẹn giáo án..."
              value={feeling}
              onChange={(event) => setFeeling(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="workout-notes">Ghi chú chuyên môn</label>
            <textarea
              id="workout-notes"
              rows={3}
              aria-label="Ghi chú buổi tập"
              placeholder="Nhập lưu ý về kỹ thuật, điều chỉnh tạ cho buổi sau..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </section>

      {/* 5. Nút Hoàn Tất — dùng profile-form-actions từ index.css */}
      <div className="profile-form-actions mt-4">
        <button
          className="button button-primary"
          disabled={loading}
          type="submit"
        >
          <CheckCircle2 size={16} className="inline mr-1" />
          <span>{loading ? 'Đang lưu kết quả...' : 'Hoàn tất buổi tập'}</span>
        </button>
      </div>
    </form>
  );
}
