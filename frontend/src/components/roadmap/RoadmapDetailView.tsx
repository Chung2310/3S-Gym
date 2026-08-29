/**
 * RoadmapDetailView — shared read-only view for roadmap content.
 * Used by both PT's RoadmapDetailModal and Customer's CustomerRoadmap page.
 * Renders: Key Metrics → Strategy Details → Phase/Week Accordion → Checkpoints.
 */
import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  HeartPulse,
  Target,
  Utensils,
  Zap,
} from 'lucide-react';
import type { Roadmap } from '../../types';

interface RoadmapDetailViewProps {
  roadmap: Roadmap;
  /** Optional – hides baseline section when viewing as customer (customer doesn't have this data) */
  hideBaseline?: boolean;
}

export default function RoadmapDetailView({ roadmap, hideBaseline }: RoadmapDetailViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>(() => {
    // Auto-expand the first phase
    if (roadmap.phases?.length > 0) return { [roadmap.phases[0].order]: true };
    return {};
  });

  const strategy = roadmap.strategy;
  const baseline = roadmap.baseline;

  const togglePhase = (order: number) => {
    setExpandedPhases((prev) => ({ ...prev, [order]: !prev[order] }));
  };

  const expandAllPhases = () => {
    const map: Record<number, boolean> = {};
    roadmap.phases.forEach((p) => {
      map[p.order] = true;
    });
    setExpandedPhases(map);
  };

  const collapseAllPhases = () => {
    setExpandedPhases({});
  };

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      {/* ── Top Key Metrics Banner ── */}
      {strategy && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Thời lượng kế hoạch</span>
            <strong style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>
              {strategy.estimatedWeeks} Tuần • {strategy.sessionsPerWeek} Buổi/tuần
            </strong>
          </div>

          {strategy.nutrition && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, display: 'block' }}>Calo mục tiêu</span>
              <strong style={{ fontSize: '1rem', color: '#15803d' }}>
                {strategy.nutrition.targetCalories} kcal/ngày
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>
                P: {strategy.nutrition.proteinGrams || 0}g • C: {strategy.nutrition.carbsGrams || 0}g • F: {strategy.nutrition.fatGrams || 0}g
              </div>
            </div>
          )}

          {!hideBaseline && baseline && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Chỉ số ban đầu</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                {baseline.initialWeight ? `${baseline.initialWeight} kg` : '—'}
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                % Mỡ: {baseline.initialBodyFat ? `${baseline.initialBodyFat}%` : '—'} • Cơ: {baseline.initialMuscleMass ? `${baseline.initialMuscleMass}kg` : '—'}
              </div>
            </div>
          )}

          {strategy.nutrition?.waterLiters && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 600, display: 'block' }}>Nước uống mỗi ngày</span>
              <strong style={{ fontSize: '1rem', color: '#2563eb' }}>
                {strategy.nutrition.waterLiters} Lít / ngày
              </strong>
            </div>
          )}
        </div>
      )}

      {/* ── Strategy Details Block ── */}
      {strategy && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'grid',
            gap: '12px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} color="var(--secondary-color)" /> Định hướng Phương pháp & Dinh dưỡng
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Zap size={14} color="#eab308" /> Phương pháp & Lịch tập
              </strong>
              <p style={{ margin: '0 0 4px', color: '#334155', lineHeight: 1.4 }}>{strategy.trainingMethod}</p>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                <strong>Lịch:</strong> {strategy.trainingSplit}
              </div>
            </div>

            {strategy.cardioProtocol && (
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <HeartPulse size={14} /> Chiến lược Cardio
                </strong>
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{strategy.cardioProtocol}</p>
              </div>
            )}
          </div>

          {(strategy.nutrition?.advice || strategy.nutritionStrategy) && (
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <strong style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Utensils size={14} /> Lời khuyên dinh dưỡng
              </strong>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{strategy.nutrition?.advice || strategy.nutritionStrategy}</p>
            </div>
          )}

          {/* Checkpoints */}
          {strategy.checkpoints && strategy.checkpoints.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Các mốc đánh giá & Đo InBody (Checkpoints):
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {strategy.checkpoints.map((cp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#ede9fe',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Tuần {cp.week}: {cp.title}
                    </div>
                    {cp.description && (
                      <div style={{ color: '#6d28d9', marginTop: '2px', fontSize: '0.74rem' }}>{cp.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Phase & Weekly Breakdown Accordion ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="var(--primary-color)" /> Chi tiết các Phase & Giáo án từng tuần ({roadmap.phases?.length || 0} Phase)
          </h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={expandAllPhases}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Mở rộng tất cả
            </button>
            <button
              type="button"
              onClick={collapseAllPhases}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Thu gọn
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {[...(roadmap.phases || [])]
            .sort((a, b) => a.order - b.order)
            .map((phase) => {
              const isExpanded = Boolean(expandedPhases[phase.order]);

              return (
                <div
                  key={phase.order}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Phase Header */}
                  <div
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isExpanded ? '#f1f5f9' : '#f8fafc',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => togglePhase(phase.order)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          background: 'var(--primary-color)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Phase {phase.order}
                      </span>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', wordBreak: 'break-word' }}>
                        {phase.name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#475569',
                          background: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 600,
                        }}
                      >
                        {phase.durationWeeks} tuần • {phase.weeks?.length || 0} tuần chi tiết
                      </span>
                      {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                    </div>
                  </div>

                  {/* Phase Body */}
                  {isExpanded && (
                    <div style={{ padding: '14px', borderTop: '1px solid #e2e8f0', display: 'grid', gap: '10px', background: '#fafbfc' }}>
                      {/* Phase Goals */}
                      {phase.goals && phase.goals.length > 0 && (
                        <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                          <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>Mục tiêu giai đoạn:</strong>
                          <ul style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                            {phase.goals.map((g, gIdx) => (
                              <li key={gIdx}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weeks List */}
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {phase.weeks?.map((w, wIdx) => (
                          <div
                            key={wIdx}
                            style={{
                              background: '#ffffff',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.82rem' }}>
                                Tuần {w.week}: {w.focus}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{w.sessionTargets || 3} buổi/tuần</span>
                            </div>

                            {w.sessions && w.sessions.length > 0 && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                  gap: '8px',
                                  borderTop: '1px dashed #e2e8f0',
                                  paddingTop: '8px',
                                }}
                              >
                                {w.sessions.map((sess, sIdx) => (
                                  <div
                                    key={sIdx}
                                    style={{
                                      background: '#f8fafc',
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '0.74rem',
                                    }}
                                  >
                                    <strong style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                      <Dumbbell size={11} color="var(--secondary-color)" /> {sess.name}
                                    </strong>
                                    <div style={{ color: '#475569', marginBottom: '4px' }}>{sess.focus}</div>
                                    {sess.exercises && sess.exercises.length > 0 && (
                                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                        {sess.exercises.map((ex, eIdx) => (
                                          <div key={eIdx}>• {ex}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
