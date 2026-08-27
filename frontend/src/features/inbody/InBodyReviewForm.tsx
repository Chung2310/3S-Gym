import { useState } from 'react';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import { useToast } from '../../components/ToastProvider';

export interface InBodyOcrDraft {
  _id: string;
  customerId: string;
  measurementDate: string;
  weight?: number;
  bmi?: number;
  bodyFatPercentage?: number;
  muscleMass?: number;
  bmr?: number;
  confidence?: number;
  ocrWarnings?: string[];
  warnings?: string[];
  status: 'DRAFT';
  ocrStatus: 'REVIEW_REQUIRED' | 'CONFIRMED';
}

interface InBodyReviewFormProps {
  draft: InBodyOcrDraft;
  onConfirmed: (draft: InBodyOcrDraft) => void;
}

const numberValue = (value: string): number | undefined => value === '' ? undefined : Number(value);

export default function InBodyReviewForm({ draft, onConfirmed }: InBodyReviewFormProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    measurementDate: draft.measurementDate.slice(0, 10),
    weight: draft.weight?.toString() ?? '',
    bmi: draft.bmi?.toString() ?? '',
    bodyFatPercentage: draft.bodyFatPercentage?.toString() ?? '',
    muscleMass: draft.muscleMass?.toString() ?? '',
    bmr: draft.bmr?.toString() ?? '',
  });
  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        measurementDate: form.measurementDate,
        weight: numberValue(form.weight),
        bmi: numberValue(form.bmi),
        bodyFatPercentage: numberValue(form.bodyFatPercentage),
        muscleMass: numberValue(form.muscleMass),
        bmr: numberValue(form.bmr),
      };
      const result = await api.patch<InBodyOcrDraft>(`/api/inbody/${draft._id}/confirm-ocr`, payload);
      toast.success(result.message);
      onConfirmed(result.data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  const warnings = draft.ocrWarnings?.length ? draft.ocrWarnings : draft.warnings ?? [];

  return <div>
    <div className="published-card"><strong>Cần PT kiểm tra</strong><p>Kết quả OCR luôn là bản nháp cho tới khi PT xác nhận.</p>{draft.confidence !== undefined && draft.confidence < 0.8 && <strong>Độ tin cậy thấp</strong>}</div>
    {warnings.length > 0 && <ul className="panel" aria-label="Cảnh báo OCR">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
    <div className="form-grid">
      <label className="field"><span>Ngày đo</span><input aria-label="Ngày đo xác nhận" type="date" value={form.measurementDate} onChange={(event) => change('measurementDate', event.target.value)} required /></label>
      <label className="field"><span>Cân nặng (kg)</span><input aria-label="Cân nặng (kg)" type="number" step="0.1" value={form.weight} onChange={(event) => change('weight', event.target.value)} /></label>
      <label className="field"><span>BMI</span><input aria-label="BMI" type="number" step="0.1" value={form.bmi} onChange={(event) => change('bmi', event.target.value)} /></label>
      <label className="field"><span>Tỷ lệ mỡ (%)</span><input aria-label="Tỷ lệ mỡ (%)" type="number" step="0.1" value={form.bodyFatPercentage} onChange={(event) => change('bodyFatPercentage', event.target.value)} /></label>
      <label className="field"><span>Khối lượng cơ (kg)</span><input aria-label="Khối lượng cơ (kg)" type="number" step="0.1" value={form.muscleMass} onChange={(event) => change('muscleMass', event.target.value)} /></label>
      <label className="field"><span>BMR</span><input aria-label="BMR" type="number" value={form.bmr} onChange={(event) => change('bmr', event.target.value)} /></label>
    </div>
    <div className="modal-actions"><button className="button button-primary" type="button" onClick={() => void submit()} disabled={loading}>{loading ? 'Đang xác nhận...' : 'Xác nhận dữ liệu'}</button></div>
  </div>;
}
