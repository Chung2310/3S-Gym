import { useState } from 'react';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import { useToast } from '../ui/ToastProvider';

import type { InBodyOcrDraft } from '../../types/inbody';
export type { InBodyOcrDraft };

interface InBodyReviewFormProps {
  draft: InBodyOcrDraft;
  onConfirmed: (draft: InBodyOcrDraft) => void;
}

const numberValue = (value: string): number | undefined => (value.trim() === '' ? undefined : Number(value));

export default function InBodyReviewForm({ draft, onConfirmed }: InBodyReviewFormProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    measurementDate: draft.measurementDate.slice(0, 10),
    weight: draft.weight?.toString() ?? '',
    bmi: draft.bmi?.toString() ?? '',
    bodyFatPercentage: draft.bodyFatPercentage?.toString() ?? '',
    bodyFatMass: draft.bodyFatMass?.toString() ?? '',
    muscleMass: draft.muscleMass?.toString() ?? '',
    bmr: draft.bmr?.toString() ?? '',
    visceralFatLevel: draft.visceralFatLevel?.toString() ?? '',
    inbodyScore: draft.inbodyScore?.toString() ?? '',
    bodyWater: draft.bodyWater?.toString() ?? '',
    boneMineral: draft.boneMineral?.toString() ?? '',
    waistHipRatio: draft.waistHipRatio?.toString() ?? '',
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
        bodyFatMass: numberValue(form.bodyFatMass),
        muscleMass: numberValue(form.muscleMass),
        bmr: numberValue(form.bmr),
        visceralFatLevel: numberValue(form.visceralFatLevel),
        inbodyScore: numberValue(form.inbodyScore),
        bodyWater: numberValue(form.bodyWater),
        boneMineral: numberValue(form.boneMineral),
        waistHipRatio: numberValue(form.waistHipRatio),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0 16px' }}>
      <div
        className="published-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          margin: 0,
        }}
      >
        <div>
          <strong>Cần PT kiểm tra</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            Kết quả quét tự động là bản nháp để PT đối chiếu và xác nhận tính chính xác của các số liệu.
          </p>
        </div>
        {draft.confidence !== undefined && draft.confidence < 0.8 && (
          <strong style={{ color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem' }}>
            Độ tin cậy thấp
          </strong>
        )}
      </div>

      {warnings.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#92400e',
          }}
          aria-label="Cảnh báo OCR"
        >
          <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Lưu ý kiểm tra:</strong>
          <ul className="panel" aria-label="Cảnh báo OCR" style={{ margin: 0, paddingLeft: '18px' }}>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="inbody-form-row-2">
        <label className="inbody-input-label">
          <span>
            Ngày đo <strong style={{ color: '#e11d48' }}>*</strong>
          </span>
          <input
            aria-label="Ngày đo xác nhận"
            type="date"
            value={form.measurementDate}
            onChange={(event) => change('measurementDate', event.target.value)}
            required
          />
        </label>

        <label className="inbody-input-label">
          <span>Cân nặng (kg) <strong style={{ color: '#e11d48' }}>*</strong></span>
          <input
            aria-label="Cân nặng (kg)"
            type="number"
            step="0.1"
            placeholder="vd: 65.5"
            value={form.weight}
            onChange={(event) => change('weight', event.target.value)}
          />
        </label>
      </div>

      <div className="inbody-form-row-3">
        <label className="inbody-input-label">
          <span>BMI</span>
          <input
            aria-label="BMI"
            type="number"
            step="0.1"
            placeholder="vd: 22.4"
            value={form.bmi}
            onChange={(event) => change('bmi', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>Tỷ lệ mỡ (%)</span>
          <input
            aria-label="Tỷ lệ mỡ (%)"
            type="number"
            step="0.1"
            placeholder="vd: 18.5"
            value={form.bodyFatPercentage}
            onChange={(event) => change('bodyFatPercentage', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>Khối lượng cơ (kg SMM)</span>
          <input
            aria-label="Khối lượng cơ (kg)"
            type="number"
            step="0.1"
            placeholder="vd: 28.2"
            value={form.muscleMass}
            onChange={(event) => change('muscleMass', event.target.value)}
          />
        </label>
      </div>

      <div className="inbody-form-row-3">
        <label className="inbody-input-label">
          <span>Mỡ nội tạng (Level)</span>
          <input
            aria-label="Mỡ nội tạng"
            type="number"
            step="1"
            placeholder="vd: 4"
            value={form.visceralFatLevel}
            onChange={(event) => change('visceralFatLevel', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>BMR (kcal)</span>
          <input
            aria-label="BMR"
            type="number"
            placeholder="vd: 1540"
            value={form.bmr}
            onChange={(event) => change('bmr', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>Điểm InBody (/100)</span>
          <input
            aria-label="Điểm InBody"
            type="number"
            placeholder="vd: 78"
            value={form.inbodyScore}
            onChange={(event) => change('inbodyScore', event.target.value)}
          />
        </label>
      </div>

      <div className="inbody-form-row-3">
        <label className="inbody-input-label">
          <span>Lượng nước (L)</span>
          <input
            aria-label="Lượng nước"
            type="number"
            step="0.1"
            placeholder="vd: 41.5"
            value={form.bodyWater}
            onChange={(event) => change('bodyWater', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>Khoáng xương (kg)</span>
          <input
            aria-label="Khoáng xương"
            type="number"
            step="0.01"
            placeholder="vd: 3.1"
            value={form.boneMineral}
            onChange={(event) => change('boneMineral', event.target.value)}
          />
        </label>

        <label className="inbody-input-label">
          <span>Tỷ lệ eo/mông (WHR)</span>
          <input
            aria-label="Tỷ lệ eo/mông"
            type="number"
            step="0.01"
            placeholder="vd: 0.85"
            value={form.waistHipRatio}
            onChange={(event) => change('waistHipRatio', event.target.value)}
          />
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', gap: '10px' }}>
        <button
          className="button button-primary"
          type="button"
          aria-label="Xác nhận dữ liệu"
          onClick={() => void submit()}
          disabled={loading}
          style={{ minWidth: '180px', padding: '10px 20px', fontSize: '0.92rem', fontWeight: 700 }}
        >
          {loading ? 'Đang xác nhận...' : 'Xác nhận dữ liệu'}
        </button>
      </div>
    </div>
  );
}
