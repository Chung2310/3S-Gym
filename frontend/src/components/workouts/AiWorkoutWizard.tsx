import { useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import {
  availabilityError,
  availabilityProposalDefaults,
  availabilitySummary,
} from '../../services/workoutAvailability';
import { errorMessage } from '../../types';
import type { WorkoutAvailabilitySlot } from '../../types/workoutAvailability';
import WorkoutAvailabilityEditor from './WorkoutAvailabilityEditor';

type Customer = { _id: string; fullName: string; phone: string };
type Proposal = { durationWeeks: number; sessionsPerWeek: number; minutesPerSession: number; level: string; trainingMethod: string; trainingSplit: string; priorityMuscleGroups: string[]; restrictions: string[] };
type Props = { open: boolean; customers: Customer[]; onClose(): void; onGenerated(value: unknown): void };

export default function AiWorkoutWizard({ open, customers, onClose, onGenerated }: Props) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState<WorkoutAvailabilitySlot[]>([]);
  const [proposal, setProposal] = useState<Proposal>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  if (!open) return null;

  const availability = availabilitySummary(availabilitySlots);
  const proposalDefaults = availabilityProposalDefaults(availabilitySlots);
  const availabilityText = `${availability.dayCount} ngày rảnh · ${availability.slotCount} khung giờ`;

  const analyze = async () => {
    if (!customerId) {
      toast.error('Vui lòng chọn học viên.');
      setError('Vui lòng chọn học viên.');
      return;
    }
    const slotError = availabilityError(availabilitySlots);
    if (slotError) {
      toast.error(slotError);
      setError(slotError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.post<Proposal>('/api/ai/workout-proposals', { customerId, availabilitySlots });
      setProposal({ ...result.data, ...proposalDefaults });
      setStep(1);
    } catch (cause) {
      const msg = errorMessage(cause);
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!proposal) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/api/ai/workout-generations', { customerId, proposal, availabilitySlots, additionalRequest: '' });
      toast.success('Tạo giáo án bằng AI thành công.');
      onGenerated(result.data);
    } catch (cause) {
      const msg = errorMessage(cause);
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const continueToGeneration = () => {
    if (!proposal) return;
    if (!Number.isInteger(proposal.durationWeeks) || proposal.durationWeeks < 1 || proposal.durationWeeks > 12) {
      const msg = 'Số tuần phải từ 1 đến 12.';
      toast.error(msg);
      setError(msg);
      return;
    }
    if (!Number.isInteger(proposal.sessionsPerWeek) || proposal.sessionsPerWeek < 1 || proposal.sessionsPerWeek > 7) {
      const msg = 'Số buổi mỗi tuần phải từ 1 đến 7.';
      toast.error(msg);
      setError(msg);
      return;
    }
    if (!Number.isInteger(proposal.minutesPerSession) || proposal.minutesPerSession < 15 || proposal.minutesPerSession > 240) {
      const msg = 'Số phút mỗi buổi phải từ 15 đến 240.';
      toast.error(msg);
      setError(msg);
      return;
    }
    setError('');
    setStep(3);
  };

  const primaryAction = () => {
    if (step === 0) return void analyze();
    if (step === 1) { setError(''); setStep(2); return; }
    if (step === 2) { continueToGeneration(); return; }
    void generate();
  };

  const primaryLabel = loading ? 'Đang xử lý...' : step === 0 ? 'Phân tích bằng AI' : step === 1 ? 'Tiếp tục cấu hình' : step === 2 ? 'Tiếp tục tạo giáo án' : 'Tạo giáo án';
  const steps = ['Chọn học viên', 'Duyệt phân tích', 'Cấu hình', 'Tạo giáo án'];

  return (
    <div className="modal-backdrop workout-wizard-backdrop" role="presentation">
      <section className="module-modal workout-ai-wizard" role="dialog" aria-modal="true" aria-label="Tạo giáo án bằng AI">
        <header className="workout-wizard-header">
          <div>
            <p>AI programming</p>
            <h2>Tạo giáo án bằng AI</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>
        <div className="workout-wizard-body">
          <ol className="workout-wizard-progress" aria-label="Tiến trình tạo giáo án">
            {steps.map((label, index) => (
              <li
                key={label}
                className={index < step ? 'is-complete' : index === step ? 'is-active' : ''}
                aria-current={index === step ? 'step' : undefined}
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          {step === 0 && (
            <div className="module-form workout-wizard-form">
              <label className="module-field">
                Học viên
                <select
                  aria-label="Học viên"
                  value={customerId}
                  disabled={loading}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  <option value="">Chọn học viên...</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.fullName} · {customer.phone}
                    </option>
                  ))}
                </select>
              </label>
              <WorkoutAvailabilityEditor
                value={availabilitySlots}
                disabled={loading}
                onChange={setAvailabilitySlots}
              />
              {proposalDefaults.sessionsPerWeek > 0 && (
                <p className="workout-availability-calculation" aria-live="polite">
                  Tự tính: {proposalDefaults.sessionsPerWeek} buổi/tuần · {proposalDefaults.minutesPerSession} phút/buổi
                </p>
              )}
            </div>
          )}
          {proposal && step === 1 && (
            <div className="workout-wizard-summary">
              <div className="workout-wizard-summary-heading">
                <strong>Đề xuất phân tích</strong>
                <span>{proposal.trainingMethod}</span>
              </div>
              <p className="workout-availability-summary">{availabilityText}</p>
              <dl className="workout-wizard-review">
                <div><dt>Chu kỳ</dt><dd>{proposal.durationWeeks} tuần</dd></div>
                <div><dt>Tần suất</dt><dd>{proposal.sessionsPerWeek} buổi/tuần</dd></div>
                <div><dt>Thời lượng</dt><dd>{proposal.minutesPerSession} phút/buổi</dd></div>
                <div><dt>Phân bổ</dt><dd>{proposal.trainingSplit}</dd></div>
              </dl>
            </div>
          )}
          {proposal && step === 2 && (
            <div className="workout-wizard-summary">
              <div className="workout-wizard-summary-heading">
                <strong>Điều chỉnh đề xuất</strong>
                <span>{proposal.trainingMethod}</span>
              </div>
              <p className="workout-availability-summary">{availabilityText}</p>
              <div className="module-field-grid">
                <label className="module-field">
                  Số tuần
                  <input
                    aria-label="Số tuần"
                    type="number"
                    min="1"
                    max="12"
                    placeholder="Ví dụ: 8"
                    value={proposal.durationWeeks}
                    onChange={(event) => setProposal({ ...proposal, durationWeeks: Number(event.target.value) })}
                  />
                </label>
                <label className="module-field">
                  Số buổi mỗi tuần
                  <input
                    aria-label="Số buổi mỗi tuần"
                    type="number"
                    min="1"
                    max="7"
                    placeholder="Ví dụ: 4"
                    value={proposal.sessionsPerWeek}
                    onChange={(event) => setProposal({ ...proposal, sessionsPerWeek: Number(event.target.value) })}
                  />
                </label>
                <label className="module-field">
                  Số phút mỗi buổi
                  <input
                    aria-label="Số phút mỗi buổi"
                    type="number"
                    min="15"
                    max="240"
                    step="15"
                    placeholder="Ví dụ: 60"
                    value={proposal.minutesPerSession}
                    onChange={(event) => setProposal({ ...proposal, minutesPerSession: Number(event.target.value) })}
                  />
                </label>
              </div>
            </div>
          )}
          {proposal && step === 3 && (
            <div className="workout-wizard-summary">
              <div className="workout-wizard-summary-heading">
                <strong>Sẵn sàng tạo giáo án</strong>
                <span>{proposal.trainingMethod}</span>
              </div>
              <p className="workout-availability-summary">{availabilityText}</p>
              <dl className="workout-wizard-review">
                <div><dt>Chu kỳ</dt><dd>{proposal.durationWeeks} tuần</dd></div>
                <div><dt>Tần suất</dt><dd>{proposal.sessionsPerWeek} buổi/tuần</dd></div>
                <div><dt>Thời lượng</dt><dd>{proposal.minutesPerSession} phút/buổi</dd></div>
                <div><dt>Cấp độ</dt><dd>{proposal.level}</dd></div>
              </dl>
            </div>
          )}
          {error && <p className="module-error workout-wizard-error" role="alert">{error}</p>}
        </div>
        <footer className="module-actions workout-wizard-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Hủy</button>
          {step > 0 && (
            <button
              type="button"
              className="button button-secondary"
              disabled={loading}
              onClick={() => { setError(''); setStep((current) => current - 1); }}
            >
              Quay lại
            </button>
          )}
          <button type="button" className="button button-primary" disabled={loading} onClick={primaryAction}>
            {primaryLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
