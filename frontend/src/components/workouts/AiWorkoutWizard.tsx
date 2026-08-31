import { useState } from 'react';
import { api } from '../../services/api';
import { errorMessage } from '../../types';

type Customer = { _id: string; fullName: string; phone: string };
type Proposal = { durationWeeks: number; sessionsPerWeek: number; minutesPerSession: number; level: string; trainingMethod: string; trainingSplit: string; priorityMuscleGroups: string[]; restrictions: string[] };
type Props = { open: boolean; customers: Customer[]; onClose(): void; onGenerated(value: unknown): void };

export default function AiWorkoutWizard({ open, customers, onClose, onGenerated }: Props) {
  const [customerId, setCustomerId] = useState('');
  const [proposal, setProposal] = useState<Proposal>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  const analyze = async () => { if (!customerId) return setError('Vui lòng chọn học viên.'); setLoading(true); setError(''); try { const result = await api.post<Proposal>('/api/ai/workout-proposals', { customerId }); setProposal(result.data); } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); } };
  const generate = async () => { if (!proposal) return; setLoading(true); setError(''); try { const result = await api.post('/api/ai/workout-generations', { customerId, proposal, additionalRequest: '' }); onGenerated(result.data); } catch (cause) { setError(errorMessage(cause)); } finally { setLoading(false); } };
  const step = loading && proposal ? 3 : proposal ? 2 : customerId ? 1 : 0;
  const steps = ['Chọn học viên', 'Duyệt phân tích', 'Cấu hình', 'Tạo giáo án'];
  return <div className="modal-backdrop workout-wizard-backdrop" role="presentation">
    <section className="module-modal workout-ai-wizard" role="dialog" aria-modal="true" aria-label="Tạo giáo án bằng AI">
      <header className="workout-wizard-header"><div><p>AI programming</p><h2>Tạo giáo án bằng AI</h2></div><button type="button" className="modal-close" aria-label="Đóng" onClick={onClose}>×</button></header>
      <div className="workout-wizard-body">
        <ol className="workout-wizard-progress" aria-label="Tiến trình tạo giáo án">
          {steps.map((label, index) => <li key={label} className={index < step ? 'is-complete' : index === step ? 'is-active' : ''} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{label}</li>)}
        </ol>
        {!proposal ? <div className="module-form workout-wizard-form"><label className="module-field">Học viên<select aria-label="Học viên" value={customerId} disabled={loading} onChange={(event) => setCustomerId(event.target.value)}><option value="">Chọn học viên...</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.fullName} · {customer.phone}</option>)}</select></label></div> : <div className="workout-wizard-summary"><div className="workout-wizard-summary-heading"><strong>Điều chỉnh đề xuất</strong><span>{proposal.trainingMethod}</span></div><div className="module-field-grid"><label className="module-field">Số tuần<input aria-label="Số tuần" type="number" min="1" placeholder="Ví dụ: 8" value={proposal.durationWeeks} onChange={(event) => setProposal({ ...proposal, durationWeeks: Number(event.target.value) })} /></label><label className="module-field">Số buổi mỗi tuần<input aria-label="Số buổi mỗi tuần" type="number" min="1" placeholder="Ví dụ: 4" value={proposal.sessionsPerWeek} onChange={(event) => setProposal({ ...proposal, sessionsPerWeek: Number(event.target.value) })} /></label><label className="module-field">Số phút mỗi buổi<input aria-label="Số phút mỗi buổi" type="number" min="15" step="15" placeholder="Ví dụ: 60" value={proposal.minutesPerSession} onChange={(event) => setProposal({ ...proposal, minutesPerSession: Number(event.target.value) })} /></label></div></div>}
        {error && <p className="module-error workout-wizard-error" role="alert">{error}</p>}
      </div>
      <footer className="module-actions workout-wizard-actions"><button type="button" className="button button-secondary" onClick={onClose}>Hủy</button><button type="button" className="button button-primary" disabled={loading} onClick={proposal ? generate : analyze}>{loading ? 'Đang xử lý...' : proposal ? 'Tạo giáo án' : 'Phân tích bằng AI'}</button></footer>
    </section>
  </div>;
}
