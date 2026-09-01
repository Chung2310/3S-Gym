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

function formatInBodyWarning(text: string): string {
  const t = text.trim();
  const lower = t.toLowerCase();
  if (lower.includes('segmental fat') && lower.includes('estimated')) {
    return 'Chỉ số phân bố mỡ từng phần (tay, chân, thân) là giá trị ước tính từ thuật toán máy đo.';
  }
  if ((lower.includes('segmental lean') || lower.includes('segmental muscle')) && lower.includes('estimated')) {
    return 'Chỉ số phân bố cơ từng phần (tay, chân, thân) là giá trị ước tính từ thuật toán máy đo.';
  }
  if (lower.includes('ecw') && lower.includes('estimated')) {
    return 'Tỷ lệ nước ngoại bào (ECW/TBW) là số liệu ước tính từ điện trở kháng.';
  }
  if (lower.includes('body composition') && lower.includes('estimated')) {
    return 'Thành phần cơ thể là số liệu ước tính từ dòng điện sinh học BIA.';
  }
  if (lower.includes('impedance')) {
    return 'Dữ liệu trở kháng điện sinh học đo được từ các điện cực tiếp xúc.';
  }
  if (lower.includes('blurry') || lower.includes('blur') || lower.includes('unclear')) {
    return 'Ảnh chụp phiếu đo có vùng hơi mờ, PT vui lòng đối chiếu kỹ lại số đo trên phiếu gốc.';
  }
  if (lower.includes('confidence') && (lower.includes('low') || lower.includes('thấp'))) {
    return 'Độ nét của ảnh phiếu đo chưa cao, vui lòng rà soát lại các số liệu.';
  }
  return t;
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
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.84rem',
            color: '#92400e',
          }}
          aria-label="Cảnh báo OCR"
        >
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span>⚠️</span> <span>Lưu ý kiểm tra từ phiếu đo:</span>
          </strong>
          <ul className="panel" aria-label="Cảnh báo OCR" style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            {warnings.map((warning) => (
              <li key={warning}>{formatInBodyWarning(warning)}</li>
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
          <span>BMI (Chỉ số thể trọng)</span>
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
          <span>Tỷ lệ mỡ cơ thể (%)</span>
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
          <span>Khối lượng cơ (SMM kg)</span>
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
          <span>Mỡ nội tạng (Level 1-20)</span>
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
          <span>BMR - Trao đổi chất (kcal)</span>
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
          <span>Lượng nước cơ thể - TBW (L)</span>
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
          <span>Khoáng chất xương (kg)</span>
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
          <span>Tỷ lệ eo / hông (WHR)</span>
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
