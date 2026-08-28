import { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import type { InBodyRecordData } from '../../types/inbody';

export default function InBodyEvolutionChart({ records }: { records: InBodyRecordData[] }) {
  // Sort chronological for chart
  const sorted = useMemo(() => {
    return [...records]
      .filter((r) => r.weight != null && r.weight > 0)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());
  }, [records]);

  if (sorted.length < 2) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '24px 16px',
          background: '#f8fafc',
          borderRadius: '12px',
          color: '#64748b',
          fontSize: '0.86rem',
        }}
      >
        <LineChart size={24} style={{ margin: '0 auto 6px', color: '#94a3b8' }} />
        <span>Cần tối thiểu 2 lần đo InBody để vẽ biểu đồ tiến độ thay đổi.</span>
      </div>
    );
  }

  const weights = sorted.map((s) => s.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const spanW = maxW - minW || 1;

  const width = 640;
  const height = 160;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (idx: number) => paddingX + (idx * (width - paddingX * 2)) / (sorted.length - 1);
  const getYWeight = (w: number) => height - paddingY - ((w - minW) / spanW) * (height - paddingY * 2);

  const weightPoints = sorted.map((s, idx) => `${getX(idx)},${getYWeight(s.weight)}`).join(' ');

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <strong
          style={{
            fontSize: '0.94rem',
            color: '#003b70',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <LineChart size={17} color="#0284c7" /> Biểu Đồ Thay Đổi Cân Nặng & Thể Chất Qua Các Lần Đo ({sorted.length} lần)
        </strong>
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: '#475569' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }} /> Cân nặng (kg)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#15803d' }} /> Cơ xương (kg)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} /> % Mỡ
          </span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', minWidth: '480px', height: 'auto', overflow: 'visible' }}
        >
          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" />

          {/* Weight Polyline */}
          <polyline points={weightPoints} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Weight Data Points & Tooltip Labels */}
          {sorted.map((item, idx) => {
            const cx = getX(idx);
            const cy = getYWeight(item.weight);
            const dateStr = new Date(item.measurementDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            return (
              <g key={item._id || idx}>
                {/* Vertical dash to baseline */}
                <line x1={cx} y1={cy} x2={cx} y2={height - paddingY} stroke="#e2e8f0" strokeDasharray="2 2" />
                {/* Circle point */}
                <circle cx={cx} cy={cy} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                {/* Value text above */}
                <text x={cx} y={cy - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill="#003b70">
                  {item.weight}kg
                </text>
                {/* Muscle / Fat sub labels */}
                {item.muscleMass && (
                  <text x={cx} y={cy + 15} textAnchor="middle" fontSize="9" fontWeight="600" fill="#15803d">
                    {item.muscleMass}kg cơ
                  </text>
                )}
                {/* Date text bottom */}
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fontWeight="500" fill="#64748b">
                  {dateStr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
