import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Flame,
  Layers,
  Ruler,
  Scale,
  Sparkles,
  User,
} from 'lucide-react';
import FormModal from '../ui/FormModal';
import CustomerSelect from '../ui/CustomerSelect';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import type { InBodyRecordData, SegmentalMap } from '../../types/inbody';
import { classifyBmi, classifyBodyFat, classifyVisceralFat } from '../../services/inbodyAnalytics';

interface InBodyManualModalProps {
  open: boolean;
  editingItem?: InBodyRecordData | null;
  defaultCustomerId?: string;
  onClose: () => void;
  onSaved: (saved: InBodyRecordData) => void;
}

const numVal = (v: string): number | null => (v.trim() === '' ? null : Number(v));

export default function InBodyManualModal({
  open,
  editingItem,
  defaultCustomerId = '',
  onClose,
  onSaved,
}: InBodyManualModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('170');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [bodyFatMass, setBodyFatMass] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [bmr, setBmr] = useState('');
  const [visceralFatLevel, setVisceralFatLevel] = useState('');
  const [inbodyScore, setInbodyScore] = useState('');
  const [bodyWater, setBodyWater] = useState('');
  const [boneMineral, setBoneMineral] = useState('');
  const [waistHipRatio, setWaistHipRatio] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');

  // Segmental State
  const [showSegmental, setShowSegmental] = useState(false);
  const [segmentalMuscle, setSegmentalMuscle] = useState<Record<keyof SegmentalMap, string>>({
    rightArm: '',
    leftArm: '',
    trunk: '',
    rightLeg: '',
    leftLeg: '',
  });
  const [segmentalFat, setSegmentalFat] = useState<Record<keyof SegmentalMap, string>>({
    rightArm: '',
    leftArm: '',
    trunk: '',
    rightLeg: '',
    leftLeg: '',
  });

  // Populate data when editing
  useEffect(() => {
    if (editingItem) {
      const cId = typeof editingItem.customerId === 'object' && editingItem.customerId !== null
        ? editingItem.customerId._id
        : String(editingItem.customerId || '');
      setCustomerId(cId);
      setMeasurementDate(editingItem.measurementDate ? editingItem.measurementDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setWeight(editingItem.weight ? String(editingItem.weight) : '');
      setBodyFatPercentage(editingItem.bodyFatPercentage != null ? String(editingItem.bodyFatPercentage) : '');
      setBodyFatMass(editingItem.bodyFatMass != null ? String(editingItem.bodyFatMass) : '');
      setMuscleMass(editingItem.muscleMass != null ? String(editingItem.muscleMass) : '');
      setBmr(editingItem.bmr != null ? String(editingItem.bmr) : '');
      setVisceralFatLevel(editingItem.visceralFatLevel != null ? String(editingItem.visceralFatLevel) : '');
      setInbodyScore(editingItem.inbodyScore != null ? String(editingItem.inbodyScore) : '');
      setBodyWater(editingItem.bodyWater != null ? String(editingItem.bodyWater) : '');
      setBoneMineral(editingItem.boneMineral != null ? String(editingItem.boneMineral) : '');
      setWaistHipRatio(editingItem.waistHipRatio != null ? String(editingItem.waistHipRatio) : '');
      setConsultationNotes(editingItem.consultationNotes || '');

      if (editingItem.segmentalMuscle || editingItem.segmentalFat) {
        setShowSegmental(true);
        setSegmentalMuscle({
          rightArm: editingItem.segmentalMuscle?.rightArm != null ? String(editingItem.segmentalMuscle.rightArm) : '',
          leftArm: editingItem.segmentalMuscle?.leftArm != null ? String(editingItem.segmentalMuscle.leftArm) : '',
          trunk: editingItem.segmentalMuscle?.trunk != null ? String(editingItem.segmentalMuscle.trunk) : '',
          rightLeg: editingItem.segmentalMuscle?.rightLeg != null ? String(editingItem.segmentalMuscle.rightLeg) : '',
          leftLeg: editingItem.segmentalMuscle?.leftLeg != null ? String(editingItem.segmentalMuscle.leftLeg) : '',
        });
        setSegmentalFat({
          rightArm: editingItem.segmentalFat?.rightArm != null ? String(editingItem.segmentalFat.rightArm) : '',
          leftArm: editingItem.segmentalFat?.leftArm != null ? String(editingItem.segmentalFat.leftArm) : '',
          trunk: editingItem.segmentalFat?.trunk != null ? String(editingItem.segmentalFat.trunk) : '',
          rightLeg: editingItem.segmentalFat?.rightLeg != null ? String(editingItem.segmentalFat.rightLeg) : '',
          leftLeg: editingItem.segmentalFat?.leftLeg != null ? String(editingItem.segmentalFat.leftLeg) : '',
        });
      }
    } else {
      setCustomerId(defaultCustomerId);
      setMeasurementDate(new Date().toISOString().slice(0, 10));
      setWeight('');
      setBodyFatPercentage('');
      setBodyFatMass('');
      setMuscleMass('');
      setBmr('');
      setVisceralFatLevel('');
      setInbodyScore('');
      setBodyWater('');
      setBoneMineral('');
      setWaistHipRatio('');
      setConsultationNotes('');
      setShowSegmental(false);
      setSegmentalMuscle({ rightArm: '', leftArm: '', trunk: '', rightLeg: '', leftLeg: '' });
      setSegmentalFat({ rightArm: '', leftArm: '', trunk: '', rightLeg: '', leftLeg: '' });
    }
  }, [editingItem, defaultCustomerId, open]);

  // Real-time BMI calculation
  const calculatedBmi = useMemo(() => {
    const w = Number(weight);
    const h = Number(height) / 100;
    if (w > 0 && h > 0) {
      return Number((w / (h * h)).toFixed(1));
    }
    return null;
  }, [weight, height]);

  // Real-time auto-calculation of Body Fat Mass if Fat% and Weight are given
  useEffect(() => {
    const w = Number(weight);
    const fPct = Number(bodyFatPercentage);
    if (w > 0 && fPct > 0 && (!bodyFatMass || !editingItem)) {
      setBodyFatMass(((w * fPct) / 100).toFixed(1));
    }
  }, [weight, bodyFatPercentage, editingItem]);

  // Real-time estimated BMR if weight is given
  useEffect(() => {
    const w = Number(weight);
    if (w > 0 && !bmr && !editingItem) {
      // Harris-Benedict baseline estimate ~ 22 kcal/kg
      setBmr(String(Math.round(w * 22)));
    }
  }, [weight, bmr, editingItem]);

  // Real-time classifications
  const bmiCls = classifyBmi(calculatedBmi);
  const fatCls = classifyBodyFat(Number(bodyFatPercentage));
  const visCls = classifyVisceralFat(Number(visceralFatLevel));

  const isDirty = Boolean(weight || bodyFatPercentage || muscleMass || customerId !== defaultCustomerId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn học viên.');
      return;
    }
    const w = Number(weight);
    if (!w || w <= 0) {
      toast.error('Vui lòng nhập cân nặng hợp lệ (> 0 kg).');
      return;
    }

    const payload: Record<string, unknown> = {
      customerId,
      measurementDate: new Date(measurementDate).toISOString(),
      weight: w,
      bmi: calculatedBmi ?? numVal(weight) ? calculatedBmi : null,
      bodyFatPercentage: numVal(bodyFatPercentage),
      bodyFatMass: numVal(bodyFatMass),
      muscleMass: numVal(muscleMass),
      bmr: numVal(bmr),
      visceralFatLevel: numVal(visceralFatLevel),
      inbodyScore: numVal(inbodyScore),
      bodyWater: numVal(bodyWater),
      boneMineral: numVal(boneMineral),
      waistHipRatio: numVal(waistHipRatio),
      consultationNotes,
      source: 'MANUAL',
    };

    if (showSegmental) {
      payload.segmentalMuscle = {
        rightArm: numVal(segmentalMuscle.rightArm),
        leftArm: numVal(segmentalMuscle.leftArm),
        trunk: numVal(segmentalMuscle.trunk),
        rightLeg: numVal(segmentalMuscle.rightLeg),
        leftLeg: numVal(segmentalMuscle.leftLeg),
      };
      payload.segmentalFat = {
        rightArm: numVal(segmentalFat.rightArm),
        leftArm: numVal(segmentalFat.leftArm),
        trunk: numVal(segmentalFat.trunk),
        rightLeg: numVal(segmentalFat.rightLeg),
        leftLeg: numVal(segmentalFat.leftLeg),
      };
    }

    setLoading(true);
    try {
      if (editingItem?._id) {
        const res = await api.patch<InBodyRecordData>(`/api/inbody/${editingItem._id}`, payload);
        toast.success(res.message || 'Đã cập nhật kết quả InBody!');
        onSaved(res.data);
      } else {
        const res = await api.post<InBodyRecordData>('/api/inbody', payload);
        toast.success(res.message || 'Đã lưu kết quả InBody mới!');
        onSaved(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      size="lg"
      title={editingItem ? 'Chỉnh sửa phiếu đo InBody' : 'Nhập kết quả InBody thủ công'}
      description="Nhập đầy đủ các chỉ số thể chất từ máy đo InBody. Hệ thống sẽ tự động phân tích và đưa ra gợi ý tư vấn cho PT."
      dirty={isDirty}
      loading={loading}
      submitLabel={editingItem ? 'Cập nhật chỉ số' : 'Lưu kết quả InBody'}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '4px 0 16px' }}>
        {/* 1. Customer Select & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 180px', gap: '14px', alignItems: 'start' }}>
          <CustomerSelect
            label="Học viên / Khách hàng"
            name="manualCustomerId"
            ariaLabel="Chọn học viên"
            value={customerId}
            onChange={(selectedId) => setCustomerId(selectedId)}
            required
            placeholder="Tìm và chọn học viên..."
          />

          <label className="field" style={{ margin: 0 }}>
            <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.86rem' }}>
              Ngày đo <strong style={{ color: '#e11d48' }}>*</strong>
            </span>
            <input
              type="date"
              aria-label="Ngày đo InBody"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              required
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </label>
        </div>

        {/* 2. Primary Metrics: Weight, Height (for BMI auto-calc), Body Fat %, Muscle Mass */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#003b70', fontWeight: 700, fontSize: '0.92rem' }}>
            <Scale size={18} color="#0284c7" /> Chỉ Số Thành Phần Chính
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
            {/* Cân nặng */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                Cân nặng (kg) <strong style={{ color: '#e11d48' }}>*</strong>
              </span>
              <input
                type="number"
                step="0.1"
                min="10"
                max="300"
                required
                placeholder="vd: 68.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Chiều cao (để tính BMI) */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.84rem' }}>
                Chiều cao (cm)
              </span>
              <input
                type="number"
                step="1"
                min="100"
                max="250"
                placeholder="vd: 172"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Tỷ lệ mỡ % */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                Tỷ lệ mỡ (% Body Fat)
              </span>
              <input
                type="number"
                step="0.1"
                min="3"
                max="70"
                placeholder="vd: 18.5"
                value={bodyFatPercentage}
                onChange={(e) => setBodyFatPercentage(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              {fatCls && (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: fatCls.color, marginTop: '2px', display: 'block' }}>
                  {fatCls.label}
                </span>
              )}
            </label>

            {/* Khối lượng cơ xương */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                Khối lượng cơ (kg SMM)
              </span>
              <input
                type="number"
                step="0.1"
                min="5"
                max="100"
                placeholder="vd: 31.2"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>
          </div>

          {/* Quick Auto Calculation Feedback Strip */}
          {calculatedBmi != null && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <span>
                🎯 <strong>BMI tự tính:</strong> <span style={{ fontWeight: 700, color: bmiCls?.color }}>{calculatedBmi} ({bmiCls?.label})</span>
              </span>
              {bodyFatMass && (
                <span>
                  • <strong>Khối lượng mỡ:</strong> <strong>{bodyFatMass} kg</strong>
                </span>
              )}
              {weight && muscleMass && (
                <span>
                  • <strong>Tỷ lệ cơ:</strong> <strong>{((Number(muscleMass) / Number(weight)) * 100).toFixed(1)}%</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Secondary Metrics: Visceral Fat, BMR, InBody Score, Water, WHR */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#003b70', fontWeight: 700, fontSize: '0.92rem' }}>
            <Activity size={18} color="#0284c7" /> Chỉ Số Trao Đổi Chất & Sức Khỏe
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
            {/* Mỡ nội tạng */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                Mỡ nội tạng (Level 1-20)
              </span>
              <input
                type="number"
                step="1"
                min="1"
                max="20"
                placeholder="vd: 4"
                value={visceralFatLevel}
                onChange={(e) => setVisceralFatLevel(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              {visCls && (
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: visCls.color, marginTop: '2px', display: 'block' }}>
                  {visCls.label}
                </span>
              )}
            </label>

            {/* BMR */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                BMR (kcal/ngày)
              </span>
              <input
                type="number"
                step="1"
                min="500"
                max="4000"
                placeholder="vd: 1550"
                value={bmr}
                onChange={(e) => setBmr(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Điểm InBody */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.84rem' }}>
                Điểm InBody Score (/100)
              </span>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="vd: 78"
                value={inbodyScore}
                onChange={(e) => setInbodyScore(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Tổng lượng nước */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.84rem' }}>
                Nước cơ thể (L TBW)
              </span>
              <input
                type="number"
                step="0.1"
                min="10"
                max="80"
                placeholder="vd: 42.5"
                value={bodyWater}
                onChange={(e) => setBodyWater(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Tỷ lệ eo / mông (WHR) */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.84rem' }}>
                Tỷ lệ eo/mông (WHR)
              </span>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="1.5"
                placeholder="vd: 0.85"
                value={waistHipRatio}
                onChange={(e) => setWaistHipRatio(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>

            {/* Khối lượng mỡ (kg) */}
            <label className="field" style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.84rem' }}>
                Khối lượng mỡ (kg)
              </span>
              <input
                type="number"
                step="0.1"
                placeholder="vd: 12.8"
                value={bodyFatMass}
                onChange={(e) => setBodyFatMass(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </label>
          </div>
        </div>

        {/* 4. Segmental Muscle & Fat Collapsible Section */}
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowSegmental(!showSegmental)}
            style={{
              width: '100%',
              background: '#f1f5f9',
              border: 'none',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: '#003b70',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#0284c7" /> Phân Tích Cơ & Mỡ Từng Phân Vùng (Segmental - Tùy chọn)
            </span>
            {showSegmental ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showSegmental && (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
              <div>
                <strong style={{ fontSize: '0.84rem', color: '#15803d', display: 'block', marginBottom: '8px' }}>
                  💪 Khối lượng cơ từng phần (kg):
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { key: 'rightArm', label: 'Tay Phải' },
                    { key: 'leftArm', label: 'Tay Trái' },
                    { key: 'trunk', label: 'Thân Mình' },
                    { key: 'rightLeg', label: 'Chân Phải' },
                    { key: 'leftLeg', label: 'Chân Trái' },
                  ].map((item) => (
                    <label key={item.key} style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                      <span>{item.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="kg"
                        value={segmentalMuscle[item.key as keyof SegmentalMap]}
                        onChange={(e) =>
                          setSegmentalMuscle((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '2px', fontSize: '0.82rem' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.84rem', color: '#b45309', display: 'block', marginBottom: '8px' }}>
                  🧀 Khối lượng mỡ từng phần (kg):
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  {[
                    { key: 'rightArm', label: 'Tay Phải' },
                    { key: 'leftArm', label: 'Tay Trái' },
                    { key: 'trunk', label: 'Thân Mình' },
                    { key: 'rightLeg', label: 'Chân Phải' },
                    { key: 'leftLeg', label: 'Chân Trái' },
                  ].map((item) => (
                    <label key={item.key} style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                      <span>{item.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="kg"
                        value={segmentalFat[item.key as keyof SegmentalMap]}
                        onChange={(e) =>
                          setSegmentalFat((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '2px', fontSize: '0.82rem' }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. PT Consultation Notes */}
        <label className="field" style={{ margin: 0 }}>
          <span style={{ fontWeight: 600, color: '#003b70', fontSize: '0.86rem' }}>
            Ghi chú tư vấn riêng của PT (Tùy chọn)
          </span>
          <textarea
            rows={3}
            placeholder="Nhập nhận định thêm, mục tiêu trao đổi hoặc lưu ý bệnh lý/cơ xương khớp của học viên..."
            value={consultationNotes}
            onChange={(e) => setConsultationNotes(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
          />
        </label>
      </div>
    </FormModal>
  );
}
