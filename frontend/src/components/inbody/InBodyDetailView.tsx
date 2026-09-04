/**
 * InBodyDetailView — shared read-only view for InBody record details.
 * Used by both PT's InBodyDetailModal (inside modal) and Customer's CustomerInBodyGoals page.
 * Renders: Score/Comparison banner → Goal alignment → Body Composition grid → Segmental Analysis → Strengths/Priorities → PT Consultation Notes → Alerts → Evolution Chart.
 */
import { useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Flame,
  Info,
  Layers,
  MessageSquare,
  Salad,
  Scale,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { InBodyRecordData, CustomerGoalData } from '../../types/inbody';
import { analyzeInBody } from '../../services/inbodyAnalytics';
import InBodyEvolutionChart from './InBodyEvolutionChart';

interface InBodyDetailViewProps {
  record: InBodyRecordData;
  previousRecord?: InBodyRecordData | null;
  historyRecords?: InBodyRecordData[];
  customerMeta?: { fullName?: string; gender?: string; height?: number; phone?: string };
  customerGoal?: CustomerGoalData | null;
  /** Hide PT-only sections like internal talking points script */
  hideConsultation?: boolean;
}

export default function InBodyDetailView({
  record,
  previousRecord,
  historyRecords,
  customerMeta,
  customerGoal,
  hideConsultation,
}: InBodyDetailViewProps) {
  const analysis = useMemo(() => {
    return analyzeInBody(record, previousRecord, customerMeta, customerGoal);
  }, [record, previousRecord, customerMeta, customerGoal]);

  if (!analysis) return null;

  const sm = record.segmentalMuscle;
  const sf = record.segmentalFat;
  const hasSegmental = Boolean(
    sm?.rightArm || sm?.leftArm || sm?.trunk || sm?.rightLeg || sm?.leftLeg ||
    sf?.rightArm || sf?.leftArm || sf?.trunk || sf?.rightLeg || sf?.leftLeg
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Section 1: InBody Score & Comparison Summary Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: record.inbodyScore ? 'minmax(180px, 220px) 1fr' : '1fr',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* Score Box */}
        {record.inbodyScore != null && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '14px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Điểm InBody Score
            </span>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#15803d', lineHeight: 1.1, margin: '6px 0' }}>
              <span>{record.inbodyScore}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16a34a' }}>/100</span>
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                background: '#15803d',
                color: '#ffffff',
              }}
            >
              {analysis.classifications.inbodyScore?.label || 'Đạt chuẩn'}
            </span>
          </div>
        )}

        {/* Comparison / Delta Card or Status Banner */}
        <div
          style={{
            background: analysis.comparison
              ? analysis.comparison.trendType === 'EXCELLENT'
                ? '#f0fdf4'
                : analysis.comparison.trendType === 'NEEDS_ADJUSTMENT'
                  ? '#fff1f2'
                  : '#f0f9ff'
              : '#f8fafc',
            border: `1px solid ${analysis.comparison
                ? analysis.comparison.trendType === 'EXCELLENT'
                  ? '#bbf7d0'
                  : analysis.comparison.trendType === 'NEEDS_ADJUSTMENT'
                    ? '#fecdd3'
                    : '#bae6fd'
                : '#e2e8f0'
              }`,
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {analysis.comparison ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} color={analysis.comparison.trendType === 'NEEDS_ADJUSTMENT' ? '#e11d48' : '#0284c7'} />
                <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                  So sánh với lần đo ngày {previousRecord?.measurementDate ? new Date(previousRecord.measurementDate).toLocaleDateString('vi-VN') : 'trước'} (cách {analysis.comparison.daysBetween} ngày):
                </strong>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                {analysis.comparison.trendSummary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {/* Cân nặng */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>Cân nặng:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {previousRecord?.weight != null ? `${previousRecord.weight} kg` : '—'} ➔ {record.weight} kg
                  </strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: analysis.comparison.deltaWeight > 0 ? '#b45309' : analysis.comparison.deltaWeight < 0 ? '#15803d' : '#64748b',
                    }}
                  >
                    ({analysis.comparison.deltaWeight > 0 ? `+${analysis.comparison.deltaWeight} kg` : analysis.comparison.deltaWeight < 0 ? `${analysis.comparison.deltaWeight} kg` : 'Không đổi'})
                  </span>
                </div>

                {/* % Mỡ */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>% Mỡ:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {previousRecord?.bodyFatPercentage != null ? `${previousRecord.bodyFatPercentage}%` : '—'} ➔ {record.bodyFatPercentage != null ? `${record.bodyFatPercentage}%` : '—'}
                  </strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: analysis.comparison.deltaFatPercentage < 0 ? '#15803d' : analysis.comparison.deltaFatPercentage > 0 ? '#e11d48' : '#64748b',
                    }}
                  >
                    ({analysis.comparison.deltaFatPercentage > 0 ? `+${analysis.comparison.deltaFatPercentage}%` : analysis.comparison.deltaFatPercentage < 0 ? `${analysis.comparison.deltaFatPercentage}%` : 'Không đổi'})
                  </span>
                </div>

                {/* Khối lượng cơ */}
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#64748b' }}>Khối lượng cơ:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {previousRecord?.muscleMass != null ? `${previousRecord.muscleMass} kg` : '—'} ➔ {record.muscleMass != null ? `${record.muscleMass} kg` : '—'}
                  </strong>
                  <span
                    style={{
                      fontWeight: 700,
                      color: analysis.comparison.deltaMuscleMass > 0 ? '#15803d' : analysis.comparison.deltaMuscleMass < 0 ? '#b45309' : '#64748b',
                    }}
                  >
                    ({analysis.comparison.deltaMuscleMass > 0 ? `+${analysis.comparison.deltaMuscleMass} kg` : analysis.comparison.deltaMuscleMass < 0 ? `${analysis.comparison.deltaMuscleMass} kg` : 'Không đổi'})
                  </span>
                </div>

                {/* Mỡ nội tạng */}
                {previousRecord?.visceralFatLevel != null && record.visceralFatLevel != null && (
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ color: '#64748b' }}>Mỡ nội tạng:</span>
                    <strong style={{ color: '#0f172a' }}>
                      Lv {previousRecord.visceralFatLevel} ➔ Lv {record.visceralFatLevel}
                    </strong>
                    <span
                      style={{
                        fontWeight: 700,
                        color: analysis.comparison.deltaVisceralFat < 0 ? '#15803d' : analysis.comparison.deltaVisceralFat > 0 ? '#e11d48' : '#64748b',
                      }}
                    >
                      ({analysis.comparison.deltaVisceralFat > 0 ? `+${analysis.comparison.deltaVisceralFat} Lv` : analysis.comparison.deltaVisceralFat < 0 ? `${analysis.comparison.deltaVisceralFat} Lv` : 'Không đổi'})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={24} color="#0284c7" />
              <div>
                <strong style={{ color: '#003b70', display: 'block', fontSize: '0.94rem' }}>
                  Phiếu InBody khởi điểm (Baseline)
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Đây là kết quả đo đầu tiên hoặc chưa có dữ liệu đối chiếu. Các lần đo tiếp theo sẽ tự động so sánh mức độ tiến bộ.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 1.5: Active Customer Goal Alignment Card */}
      {analysis.goalAlignment && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: '280px', flex: '1 1 300px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <strong style={{ fontSize: '0.96rem', color: '#003b70' }}>
                  Mục tiêu đang theo đuổi: {analysis.goalAlignment.goal.title}
                </strong>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: '#0284c7',
                    color: '#ffffff',
                  }}
                >
                  {analysis.goalAlignment.goalTypeLabel}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#0369a1', fontWeight: 600 }}>
                {analysis.goalAlignment.statusSummary}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: '#334155' }}>
            {analysis.goalAlignment.goal.deadline && (
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>HẠN CHÓT</span>
                <strong style={{ color: '#0f172a' }}>{new Date(analysis.goalAlignment.goal.deadline).toLocaleDateString('vi-VN')}</strong>
              </div>
            )}
            {analysis.goalAlignment.goal.sessionsPerWeek && (
              <div style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>LỊCH TẬP</span>
                <strong style={{ color: '#0f172a' }}>{analysis.goalAlignment.goal.sessionsPerWeek} buổi/tuần</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Core Body Composition Metrics Grid */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.02rem', fontWeight: 800, color: '#003b70', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} color="#0284c7" /> Phân Tích Thành Phần Cơ Thể (Body Composition)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          {/* 1. Cân nặng */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Cân nặng (Weight)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#003b70', margin: '4px 0' }}>
              <span>{record.weight}</span> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kg</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {analysis.classifications.bmi && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: analysis.classifications.bmi.color }}>
                  BMI: {record.bmi || '—'} ({analysis.classifications.bmi.label})
                </span>
              )}
              {(record.height || customerMeta?.height || (typeof record.customerId === 'object' && record.customerId?.height)) && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                  Chiều cao: <strong style={{ color: '#0f172a' }}>{record.height || customerMeta?.height || (typeof record.customerId === 'object' && record.customerId?.height)} cm</strong>
                </span>
              )}
            </div>
          </div>

          {/* 2. Tỷ lệ mỡ */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Tỷ lệ mỡ (Body Fat %)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
              <span>{record.bodyFatPercentage != null ? record.bodyFatPercentage : '—'}</span>{' '}
              {record.bodyFatPercentage != null && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>%</span>}
            </div>
            {analysis.classifications.bodyFat && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: analysis.classifications.bodyFat.color }}>
                {analysis.classifications.bodyFat.label}
              </span>
            )}
          </div>

          {/* 3. Khối lượng cơ xương */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Khối lượng cơ (Muscle)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', margin: '4px 0' }}>
              <span>{record.muscleMass != null ? record.muscleMass : '—'}</span>{' '}
              {record.muscleMass != null && <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kg</span>}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {record.weight && record.muscleMass ? `~${((record.muscleMass / record.weight) * 100).toFixed(1)}% cơ thể` : 'Cơ xương (SMM)'}
            </span>
          </div>

          {/* 4. Khối lượng mỡ (Body Fat Mass) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Khối lượng mỡ (Fat Mass)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
              <span>
                {record.bodyFatMass != null
                  ? record.bodyFatMass
                  : record.weight && record.bodyFatPercentage
                    ? ((record.weight * record.bodyFatPercentage) / 100).toFixed(1)
                    : '—'}
              </span>{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kg</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Tổng lượng mỡ tích tụ</span>
          </div>

          {/* 5. Mỡ nội tạng (Visceral Fat) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Mỡ nội tạng (Visceral Fat)</span>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: record.visceralFatLevel && record.visceralFatLevel >= 10 ? '#dc2626' : '#0f172a',
                margin: '4px 0',
              }}
            >
              Level <span>{record.visceralFatLevel != null ? record.visceralFatLevel : '—'}</span>
            </div>
            {analysis.classifications.visceralFat && (
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: analysis.classifications.visceralFat.color }}>
                {analysis.classifications.visceralFat.label}
              </span>
            )}
          </div>

          {/* 6. BMR Trao đổi chất */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Trao đổi chất cơ bản (BMR)</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0369a1', margin: '4px 0' }}>
              <span>{record.bmr != null ? record.bmr : '—'}</span> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kcal</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Đốt thụ động / ngày</span>
          </div>

          {/* 7. Lượng nước (Body Water) */}
          {record.bodyWater != null && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Tổng lượng nước (TBW)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', margin: '4px 0' }}>
                <span>{record.bodyWater}</span> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>L</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Độ hydrat hóa cơ thể</span>
            </div>
          )}

          {/* 8. Khoáng chất xương (Bone Mineral) */}
          {record.boneMineral != null && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Khoáng chất xương (BMC)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                <span>{record.boneMineral}</span> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kg</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Mật độ khoáng xương</span>
            </div>
          )}

          {/* 9. Tỷ lệ eo / mông (WHR) */}
          {record.waistHipRatio != null && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Tỷ lệ eo / mông (WHR)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', margin: '4px 0' }}>
                <span>{record.waistHipRatio}</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Phân bố mỡ bụng</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Segmental Muscle & Fat Breakdown */}
      {hasSegmental && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 800, color: '#003b70', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={17} color="#0284c7" /> Phân Tích Cơ & Mỡ Từng Phần (Segmental Lean & Fat)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Tay Phải (Right Arm)', m: sm?.rightArm, f: sf?.rightArm },
              { label: 'Tay Trái (Left Arm)', m: sm?.leftArm, f: sf?.leftArm },
              { label: 'Thân mình (Trunk)', m: sm?.trunk, f: sf?.trunk },
              { label: 'Chân Phải (Right Leg)', m: sm?.rightLeg, f: sf?.rightLeg },
              { label: 'Chân Trái (Left Leg)', m: sm?.leftLeg, f: sf?.leftLeg },
            ].map((part) => (
              <div key={part.label} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 12px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block' }}>{part.label}</span>
                <div style={{ marginTop: '4px', fontSize: '0.84rem' }}>
                  <span style={{ color: '#15803d', fontWeight: 700, display: 'block' }}>
                    Cơ: {part.m != null ? `${part.m} kg` : '—'}
                  </span>
                  <span style={{ color: '#b45309', fontWeight: 600, fontSize: '0.78rem', display: 'block' }}>
                    Mỡ: {part.f != null ? `${part.f} kg` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {(analysis.segmentalAnalysis.muscleImbalanceArm.hasImbalance || analysis.segmentalAnalysis.muscleImbalanceLeg.hasImbalance) && (
            <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', color: '#92400e' }}>
              <strong>⚠️ Lưu ý mất cân đối cơ:</strong>
              {analysis.segmentalAnalysis.muscleImbalanceArm.hasImbalance && (
                <div>• {analysis.segmentalAnalysis.muscleImbalanceArm.note}</div>
              )}
              {analysis.segmentalAnalysis.muscleImbalanceLeg.hasImbalance && (
                <div>• {analysis.segmentalAnalysis.muscleImbalanceLeg.note}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Section 4: Strengths & Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '16px' }}>
        {/* Box: Strengths & Highlights */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#15803d' }}>
            <CheckCircle2 size={20} />
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Điểm Mạnh Của Học Viên</h4>
          </div>
          {record.strengths ? (
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#166534', lineHeight: 1.5 }}>{record.strengths}</p>
          ) : analysis.strengths.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: '#166534' }}>
              {analysis.strengths.map((s, idx) => (
                <li key={idx} style={{ lineHeight: 1.45 }}>{s}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#166534' }}>Thể trạng ở mức khởi đầu, sẵn sàng cho lộ trình rèn luyện mới.</p>
          )}
        </div>

        {/* Box: Improvements & Priority Focus */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#b45309' }}>
            <Flame size={20} />
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Điểm Cần Cải Thiện & Vấn Đề Ưu Tiên</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: '#92400e' }}>
            {record.priorities ? (
              <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #b45309' }}>
                <strong style={{ color: '#78350f', display: 'block', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  🎯 Ưu tiên từ PT:
                </strong>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#92400e' }}>
                  {record.priorities}
                </p>
              </div>
            ) : analysis.priorities.length > 0 ? (
              <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #b45309' }}>
                <strong style={{ color: '#78350f', display: 'block', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                  🎯 Mục Tiêu Ưu Tiên Số 1:
                </strong>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#92400e' }}>
                  {analysis.priorities[0]}
                </p>
              </div>
            ) : null}

            {analysis.improvements.length > 0 && !record.priorities && (
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Cần cải thiện:</strong>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {analysis.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 4.5: PT Consultation Notes & Advice */}
      {(record.consultationNotes || record.recommendation) && (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '14px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0369a1' }}>
            <MessageSquare size={18} />
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>Tư Vấn & Lời Khuyên Từ Huấn Luyện Viên</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#0c4a6e', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
            {record.consultationNotes || record.recommendation}
          </p>
        </div>
      )}

      {/* Section 5: Health & Biometric Alerts */}
      {analysis.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Cảnh Báo Chỉ Số Sức Khỏe Cần Theo Dõi Sát
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
            {analysis.alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: alert.level === 'danger' ? '#fff1f2' : '#fffbeb',
                  border: `1px solid ${alert.level === 'danger' ? '#fecdd3' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: alert.level === 'danger' ? '#9f1239' : '#92400e',
                }}
              >
                <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '2px' }}>
                  ⚠️ {alert.title}
                </strong>
                <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.4 }}>{alert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 6: History Evolution Chart */}
      {historyRecords && historyRecords.length >= 2 && (
        <InBodyEvolutionChart records={historyRecords} title="Biểu Đồ Xu Hướng Thay Đổi Thể Chất Qua Các Lần Đo" />
      )}

      {/* Section 7: PT Consultation Guide (when not hidden) */}
      {!hideConsultation && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '20px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#003b70' }}>
            <MessageSquare size={20} color="#0284c7" />
            <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>
              Kịch Bản & Hướng Dẫn Tư Vấn Chuyên Sâu Cho PT
            </h4>
          </div>

          {/* Talking Points */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
            <strong style={{ color: '#003b70', display: 'block', fontSize: '0.86rem', marginBottom: '8px' }}>
              🗣️ Lời thoại gợi ý khi trao đổi trực tiếp với học viên:
            </strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.86rem', color: '#334155' }}>
              {analysis.consultationGuide.talkingPoints.map((tp, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
                    {idx + 1}
                  </span>
                  <p style={{ margin: 0, lineHeight: 1.45 }}>{tp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition & Workout Targets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
              <strong style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', marginBottom: '6px' }}>
                <Salad size={16} /> Định hướng Dinh dưỡng:
              </strong>
              <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: '#334155', lineHeight: 1.4 }}>
                {analysis.consultationGuide.nutritionAdvice}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                💧 <strong>Nước & Protein:</strong> {analysis.consultationGuide.proteinRecommendation}. {analysis.consultationGuide.waterRecommendation}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px' }}>
              <strong style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', marginBottom: '6px' }}>
                <Dumbbell size={16} /> Định hướng Tập luyện:
              </strong>
              <p style={{ margin: '0 0 6px', fontSize: '0.84rem', color: '#334155', lineHeight: 1.4 }}>
                {analysis.consultationGuide.workoutAdvice}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f0f9ff', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                ⚡ <strong>Calo đề xuất:</strong> Giảm mỡ: {analysis.consultationGuide.targetCaloriesRecommendation.fatLoss} kcal | Tăng cơ: {analysis.consultationGuide.targetCaloriesRecommendation.muscleGain} kcal/ngày.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
