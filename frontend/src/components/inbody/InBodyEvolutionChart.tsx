import { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Dumbbell,
  Flame,
  LineChart,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { InBodyRecordData } from '../../types/inbody';

type MetricTab = 'ALL' | 'WEIGHT' | 'MUSCLE' | 'FAT' | 'SCORE';

interface InBodyEvolutionChartProps {
  records: InBodyRecordData[];
  title?: string;
}

export default function InBodyEvolutionChart({ records, title }: InBodyEvolutionChartProps) {
  const [activeTab, setActiveTab] = useState<MetricTab>('ALL');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Filter & sort chronological (oldest to newest)
  const sorted = useMemo(() => {
    return [...records]
      .filter((r) => r.weight != null && r.weight > 0)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());
  }, [records]);

  // Overall summary deltas (latest vs first in list)
  const overallDelta = useMemo(() => {
    if (sorted.length < 2) return null;
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    return {
      deltaWeight: Number((latest.weight - first.weight).toFixed(1)),
      deltaMuscle:
        latest.muscleMass != null && first.muscleMass != null
          ? Number((latest.muscleMass - first.muscleMass).toFixed(1))
          : null,
      deltaFat:
        latest.bodyFatPercentage != null && first.bodyFatPercentage != null
          ? Number((latest.bodyFatPercentage - first.bodyFatPercentage).toFixed(1))
          : null,
      deltaScore:
        latest.inbodyScore != null && first.inbodyScore != null
          ? latest.inbodyScore - first.inbodyScore
          : null,
      firstDate: new Date(first.measurementDate).toLocaleDateString('vi-VN'),
      latestDate: new Date(latest.measurementDate).toLocaleDateString('vi-VN'),
    };
  }, [sorted]);

  if (sorted.length < 2) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px 20px',
          background: '#f8fafc',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '0.86rem',
        }}
      >
        <LineChart size={28} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
        <strong style={{ display: 'block', color: '#334155', marginBottom: '2px' }}>
          Chưa đủ dữ liệu để vẽ biểu đồ tiến độ
        </strong>
        <span>Cần tối thiểu 2 lần đo InBody của học viên này để phân tích xu hướng thay đổi thể chất.</span>
      </div>
    );
  }

  // SVG Dimension Constants
  const width = 720;
  const height = 220;
  const paddingX = 46;
  const paddingTop = 28;
  const paddingBottom = 42;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => paddingX + (idx * plotWidth) / (sorted.length - 1);

  // Min/Max Scale helper with safety margins
  const getBounds = (values: (number | null | undefined)[]) => {
    const valid = values.filter((v): v is number => v != null && Number.isFinite(v));
    if (valid.length === 0) return { min: 0, max: 100, span: 100 };
    const rawMin = Math.min(...valid);
    const rawMax = Math.max(...valid);
    if (rawMin === rawMax) {
      return { min: Math.max(0, rawMin - 2), max: rawMax + 2, span: 4 };
    }
    const margin = (rawMax - rawMin) * 0.15 || 1;
    return { min: rawMin - margin, max: rawMax + margin, span: rawMax - rawMin + margin * 2 };
  };

  const weightBounds = getBounds(sorted.map((s) => s.weight));
  const muscleBounds = getBounds(sorted.map((s) => s.muscleMass));
  const fatBounds = getBounds(sorted.map((s) => s.bodyFatPercentage));
  const scoreBounds = getBounds(sorted.map((s) => s.inbodyScore));

  const getYWeight = (w: number | null | undefined) => {
    if (w == null) return height - paddingBottom;
    return height - paddingBottom - ((w - weightBounds.min) / weightBounds.span) * plotHeight;
  };

  const getYMuscle = (m: number | null | undefined) => {
    if (m == null) return height - paddingBottom;
    return height - paddingBottom - ((m - muscleBounds.min) / muscleBounds.span) * plotHeight;
  };

  const getYFat = (f: number | null | undefined) => {
    if (f == null) return height - paddingBottom;
    return height - paddingBottom - ((f - fatBounds.min) / fatBounds.span) * plotHeight;
  };

  const getYScore = (s: number | null | undefined) => {
    if (s == null) return height - paddingBottom;
    return height - paddingBottom - ((s - scoreBounds.min) / scoreBounds.span) * plotHeight;
  };

  // Build SVG Path strings
  const buildPolyline = (getYFn: (val: any) => number, key: keyof InBodyRecordData) => {
    return sorted
      .map((item, idx) => {
        const val = item[key];
        if (val == null) return null;
        return `${getX(idx)},${getYFn(val)}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  const weightPoints = buildPolyline(getYWeight, 'weight');
  const musclePoints = buildPolyline(getYMuscle, 'muscleMass');
  const fatPoints = buildPolyline(getYFat, 'bodyFatPercentage');
  const scorePoints = buildPolyline(getYScore, 'inbodyScore');

  // Build Area Path for single metric mode
  const buildAreaPath = (pointsStr: string) => {
    if (!pointsStr) return '';
    const pts = pointsStr.split(' ');
    if (pts.length < 2) return '';
    const firstX = pts[0].split(',')[0];
    const lastX = pts[pts.length - 1].split(',')[0];
    const bottomY = height - paddingBottom;
    return `M ${pts[0]} L ${pts.join(' L ')} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
      }}
    >
      {/* Top Header & Metric Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '14px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 800,
              color: '#003b70',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <LineChart size={19} color="#0284c7" />
            {title || `Biểu Đồ Xu Hướng Thay Đổi Thể Chất (${sorted.length} lần đo)`}
          </h4>
          {overallDelta && (
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Từ ngày {overallDelta.firstDate} ➔ {overallDelta.latestDate}
            </p>
          )}
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
          {(
            [
              { id: 'ALL', label: 'Tất cả (Tổng hợp)' },
              { id: 'WEIGHT', label: 'Cân nặng' },
              { id: 'MUSCLE', label: 'Cơ nạc' },
              { id: 'FAT', label: '% Mỡ' },
              { id: 'SCORE', label: 'Điểm InBody' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#003b70' : '#64748b',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  padding: '5px 12px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Quick Summary Pills */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(activeTab === 'ALL' || activeTab === 'WEIGHT') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#0284c7' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#0284c7' }} />
              Cân nặng (kg)
            </span>
          )}
          {(activeTab === 'ALL' || activeTab === 'MUSCLE') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#15803d' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#15803d' }} />
              Khối lượng cơ (kg)
            </span>
          )}
          {(activeTab === 'ALL' || activeTab === 'FAT') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#e11d48' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#e11d48' }} />
              Tỷ lệ % Mỡ
            </span>
          )}
          {activeTab === 'SCORE' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#7c3aed' }}>
              <span style={{ width: '12px', height: '4px', borderRadius: '2px', background: '#7c3aed' }} />
              Điểm InBody Score (/100)
            </span>
          )}
        </div>

        {/* Delta Badges */}
        {overallDelta && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#f0f9ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
              }}
            >
              Δ Cân: {overallDelta.deltaWeight > 0 ? `+${overallDelta.deltaWeight}` : overallDelta.deltaWeight} kg
            </span>
            {overallDelta.deltaMuscle != null && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #bbf7d0',
                }}
              >
                Δ Cơ: {overallDelta.deltaMuscle > 0 ? `+${overallDelta.deltaMuscle}` : overallDelta.deltaMuscle} kg
              </span>
            )}
            {overallDelta.deltaFat != null && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: '#fff1f2',
                  color: '#e11d48',
                  border: '1px solid #fecdd3',
                }}
              >
                Δ Mỡ: {overallDelta.deltaFat > 0 ? `+${overallDelta.deltaFat}` : overallDelta.deltaFat}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', minWidth: '580px', height: 'auto', overflow: 'visible', userSelect: 'none' }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingTop} x2={width - paddingX} y2={paddingTop} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingTop + plotHeight * 0.33} x2={width - paddingX} y2={paddingTop + plotHeight * 0.33} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingTop + plotHeight * 0.66} x2={width - paddingX} y2={paddingTop + plotHeight * 0.66} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingBottom} x2={width - paddingX} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth="1.5" />

          {/* Area Fills for Single Metric mode */}
          {activeTab === 'WEIGHT' && weightPoints && (
            <path d={buildAreaPath(weightPoints)} fill="url(#weightGrad)" />
          )}
          {activeTab === 'MUSCLE' && musclePoints && (
            <path d={buildAreaPath(musclePoints)} fill="url(#muscleGrad)" />
          )}
          {activeTab === 'FAT' && fatPoints && (
            <path d={buildAreaPath(fatPoints)} fill="url(#fatGrad)" />
          )}
          {activeTab === 'SCORE' && scorePoints && (
            <path d={buildAreaPath(scorePoints)} fill="url(#scoreGrad)" />
          )}

          {/* Polylines */}
          {(activeTab === 'ALL' || activeTab === 'WEIGHT') && weightPoints && (
            <polyline points={weightPoints} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {(activeTab === 'ALL' || activeTab === 'MUSCLE') && musclePoints && (
            <polyline points={musclePoints} fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={activeTab === 'ALL' ? '4 2' : 'none'} />
          )}
          {(activeTab === 'ALL' || activeTab === 'FAT') && fatPoints && (
            <polyline points={fatPoints} fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={activeTab === 'ALL' ? '3 2' : 'none'} />
          )}
          {activeTab === 'SCORE' && scorePoints && (
            <polyline points={scorePoints} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data Points and Column Columns */}
          {sorted.map((item, idx) => {
            const cx = getX(idx);
            const cyWeight = getYWeight(item.weight);
            const cyMuscle = getYMuscle(item.muscleMass);
            const cyFat = getYFat(item.bodyFatPercentage);
            const cyScore = getYScore(item.inbodyScore);

            const isHovered = hoveredIdx === idx;
            const dateStr = new Date(item.measurementDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

            return (
              <g
                key={item._id || idx}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical guideline */}
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={height - paddingBottom}
                  stroke={isHovered ? '#0284c7' : '#f1f5f9'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  strokeDasharray="2 2"
                />

                {/* Circles for ALL or Single Metric */}
                {(activeTab === 'ALL' || activeTab === 'WEIGHT') && (
                  <g>
                    <circle cx={cx} cy={cyWeight} r={isHovered ? 6 : 4.5} fill="#ffffff" stroke="#0284c7" strokeWidth={2.5} />
                    <text x={cx} y={cyWeight - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284c7">
                      {item.weight}kg
                    </text>
                  </g>
                )}

                {(activeTab === 'ALL' || activeTab === 'MUSCLE') && item.muscleMass != null && (
                  <g>
                    <circle cx={cx} cy={cyMuscle} r={isHovered ? 6 : 4} fill="#ffffff" stroke="#15803d" strokeWidth={2} />
                    <text x={cx} y={activeTab === 'ALL' ? cyMuscle + 14 : cyMuscle - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#15803d">
                      {item.muscleMass}kg cơ
                    </text>
                  </g>
                )}

                {(activeTab === 'ALL' || activeTab === 'FAT') && item.bodyFatPercentage != null && (
                  <g>
                    <circle cx={cx} cy={cyFat} r={isHovered ? 6 : 4} fill="#ffffff" stroke="#e11d48" strokeWidth={2} />
                    <text x={cx} y={activeTab === 'ALL' ? cyFat - 8 : cyFat - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#e11d48">
                      {item.bodyFatPercentage}% mỡ
                    </text>
                  </g>
                )}

                {activeTab === 'SCORE' && item.inbodyScore != null && (
                  <g>
                    <circle cx={cx} cy={cyScore} r={isHovered ? 6 : 4.5} fill="#ffffff" stroke="#7c3aed" strokeWidth={2.5} />
                    <text x={cx} y={cyScore - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#7c3aed">
                      {item.inbodyScore} điểm
                    </text>
                  </g>
                )}

                {/* X Axis Date Label */}
                <text
                  x={cx}
                  y={height - 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isHovered ? '700' : '600'}
                  fill={isHovered ? '#003b70' : '#64748b'}
                >
                  {dateStr}
                </text>
                <text
                  x={cx}
                  y={height - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="500"
                  fill="#94a3b8"
                >
                  Lần {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating or Selected Point Details Box */}
      {hoveredIdx !== null && sorted[hoveredIdx] && (
        <div
          style={{
            marginTop: '14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.84rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} color="#0284c7" />
            <strong style={{ color: '#003b70' }}>
              Lần đo {hoveredIdx + 1}: {new Date(sorted[hoveredIdx].measurementDate).toLocaleDateString('vi-VN')}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#334155' }}>
            <span>⚖️ Cân nặng: <strong>{sorted[hoveredIdx].weight} kg</strong></span>
            {sorted[hoveredIdx].bodyFatPercentage != null && (
              <span>🔥 % Mỡ: <strong style={{ color: '#e11d48' }}>{sorted[hoveredIdx].bodyFatPercentage}%</strong></span>
            )}
            {sorted[hoveredIdx].muscleMass != null && (
              <span>💪 Cơ: <strong style={{ color: '#15803d' }}>{sorted[hoveredIdx].muscleMass} kg</strong></span>
            )}
            {sorted[hoveredIdx].visceralFatLevel != null && (
              <span>Mỡ nội tạng: <strong>Lv {sorted[hoveredIdx].visceralFatLevel}</strong></span>
            )}
            {sorted[hoveredIdx].inbodyScore != null && (
              <span>⭐ Điểm: <strong>{sorted[hoveredIdx].inbodyScore}/100</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
