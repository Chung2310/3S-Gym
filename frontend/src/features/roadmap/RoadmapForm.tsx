import { useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import { useToast } from '../../components/ToastProvider';

interface RoadmapWeek { week: number; focus: string; sessionTargets?: number }
interface RoadmapPhase { order: number; name: string; durationWeeks: number; goals: string[]; weeks: RoadmapWeek[] }
export interface Roadmap { _id: string; customerId: string; title: string; phases: RoadmapPhase[]; status: 'DRAFT' | 'PUBLISHED'; version: number }
interface RoadmapFormProps { onSaved: () => void; onCancel: () => void }

const newPhase = (order: number): RoadmapPhase => ({ order, name: '', durationWeeks: 1, goals: [], weeks: [] });

export default function RoadmapForm({ onSaved, onCancel }: RoadmapFormProps) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [title, setTitle] = useState('');
  const [phases, setPhases] = useState<RoadmapPhase[]>([newPhase(1)]);
  const [phaseError, setPhaseError] = useState('');
  const [loading, setLoading] = useState(false);
  const updatePhase = (index: number, change: Partial<RoadmapPhase>) => setPhases((current) => current.map((phase, phaseIndex) => phaseIndex === index ? { ...phase, ...change } : phase));
  const addWeek = (phaseIndex: number) => setPhases((current) => current.map((phase, index) => index === phaseIndex ? { ...phase, weeks: [...phase.weeks, { week: phase.weeks.length + 1, focus: '' }] } : phase));
  const updateWeek = (phaseIndex: number, weekIndex: number, focus: string) => setPhases((current) => current.map((phase, index) => index === phaseIndex ? { ...phase, weeks: phase.weeks.map((week, indexOfWeek) => indexOfWeek === weekIndex ? { ...week, focus } : week) } : phase));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (new Set(phases.map((phase) => phase.order)).size !== phases.length) {
      setPhaseError('Thứ tự phase không được trùng.');
      return;
    }
    setPhaseError('');
    setLoading(true);
    try {
      const result = await api.post<Roadmap>('/api/roadmaps', { customerId, title, baseline: {}, phases });
      toast.success(result.message);
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return <form className="panel" onSubmit={submit}>
    <div className="form-grid"><label className="field"><span>Mã khách hàng</span><input aria-label="Mã khách hàng" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required /></label><label className="field"><span>Tên roadmap</span><input aria-label="Tên roadmap" value={title} onChange={(event) => setTitle(event.target.value)} required /></label></div>
    {phases.map((phase, phaseIndex) => <fieldset className="panel" key={phaseIndex}><legend>Phase {phaseIndex + 1}</legend><div className="form-grid"><label className="field"><span>Thứ tự</span><input aria-label={`Thứ tự phase ${phaseIndex + 1}`} type="number" min="1" value={phase.order} onChange={(event) => updatePhase(phaseIndex, { order: Number(event.target.value) })} required /></label><label className="field"><span>Tên phase</span><input aria-label={`Tên phase ${phaseIndex + 1}`} value={phase.name} onChange={(event) => updatePhase(phaseIndex, { name: event.target.value })} required /></label><label className="field"><span>Thời lượng (tuần)</span><input aria-label={`Thời lượng phase ${phaseIndex + 1}`} type="number" min="1" value={phase.durationWeeks} onChange={(event) => updatePhase(phaseIndex, { durationWeeks: Number(event.target.value) })} required /></label></div>
      {phase.weeks.map((week, weekIndex) => <label className="field" key={weekIndex}><span>Trọng tâm tuần {week.week}</span><input aria-label={`Trọng tâm tuần ${week.week} phase ${phaseIndex + 1}`} value={week.focus} onChange={(event) => updateWeek(phaseIndex, weekIndex, event.target.value)} required /></label>)}
      <button className="button button-secondary" type="button" onClick={() => addWeek(phaseIndex)}>Thêm tuần vào phase {phaseIndex + 1}</button>
    </fieldset>)}
    {phaseError && <p className="field-error" role="alert">{phaseError}</p>}
    <div className="modal-actions"><button className="button button-secondary" type="button" onClick={onCancel}>Hủy</button><button className="button button-secondary" type="button" onClick={() => setPhases((current) => [...current, newPhase(current.length + 1)])}>Thêm phase</button><button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu roadmap'}</button></div>
  </form>;
}
