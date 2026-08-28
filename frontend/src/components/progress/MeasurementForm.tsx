import { useState, type FormEvent } from 'react'; import { api } from '../../services/api'; import { useToast } from '../ui/ToastProvider'; import { errorMessage } from '../../types';
export default function MeasurementForm({ customerId, onSaved }: { customerId: string; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ measuredAt: '', weight: '', bodyFatPercentage: '', muscleMass: '' });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, key === 'measuredAt' ? value : value ? Number(value) : undefined]));
      const result = await api.post('/api/body-measurements', { customerId, ...body });
      toast.success(result.message);
      onSaved();
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const metricPlaceholders: Record<string, string> = {
    weight: 'Ví dụ: 68.5 (kg)',
    bodyFatPercentage: 'Ví dụ: 18.5 (%)',
    muscleMass: 'Ví dụ: 30.2 (kg)',
  };
  return <form className="panel" onSubmit={submit}>
    <h2>Ghi số đo</h2>
    <div className="form-grid">
      <label className="field"><span>Ngày đo</span><input type="date" aria-label="Ngày đo" value={form.measuredAt} onChange={(e) => setForm({ ...form, measuredAt: e.target.value })} required /></label>
      {[['weight','Cân nặng (kg)'],['bodyFatPercentage','Tỷ lệ mỡ (%)'],['muscleMass','Khối lượng cơ (kg)']].map(([key,label]) => (
        <label className="field" key={key}>
          <span>{label}</span>
          <input type="number" step="0.1" aria-label={label} placeholder={metricPlaceholders[key]} value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
        </label>
      ))}
    </div>
    <button className="button button-primary">Lưu số đo</button>
  </form>;
}
