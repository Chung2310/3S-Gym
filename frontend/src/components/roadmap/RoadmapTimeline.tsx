import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  HeartPulse,
  Utensils,
  Zap,
} from 'lucide-react';
import type { Roadmap } from './RoadmapForm';

export default function RoadmapTimeline({ roadmap }: { roadmap: Roadmap }) {
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({});
  const strategy = roadmap.strategy;

  const togglePhase = (order: number) => {
    setExpandedPhases((prev) => ({ ...prev, [order]: !prev[order] }));
  };

  return (
    <div style={{ display: 'grid', gap: '14px', marginTop: '12px' }}>
      {/* Strategy Summary Pills if available */}
      {strategy && (
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gap: '8px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: '#003b70', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="#eab308" /> {strategy.trainingSplit || `${strategy.sessionsPerWeek} buổi/tuần`}
            </span>
            {strategy.nutrition && (
              <span style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Utensils size={13} /> {strategy.nutrition.targetCalories} kcal (P: {strategy.nutrition.proteinGrams}g)
              </span>
            )}
          </div>

          {strategy.cardioProtocol && (
            <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem' }}>
              <HeartPulse size={13} color="#ef4444" /> <span>{strategy.cardioProtocol}</span>
            </div>
          )}

          {strategy.checkpoints && strategy.checkpoints.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              {strategy.checkpoints.map((cp, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#ede9fe',
                    color: '#5b21b6',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={11} /> Tuần {cp.week}: {cp.title.split(':')[0]}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase Timeline List */}
      <ol
        aria-label={`Timeline ${roadmap.title}`}
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'grid',
          gap: '10px',
        }}
      >
        {[...roadmap.phases]
          .sort((left, right) => left.order - right.order)
          .map((phase) => {
            const isExpanded = Boolean(expandedPhases[phase.order]);

            return (
              <li
                key={phase.order}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: '#f8fafc',
                  }}
                  onClick={() => togglePhase(phase.order)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'var(--secondary-color)',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      P{phase.order}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{phase.name}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{phase.durationWeeks} tuần</span>
                    {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                  </div>
                </div>

                {isExpanded && phase.weeks && phase.weeks.length > 0 && (
                  <div style={{ padding: '10px 12px', display: 'grid', gap: '8px', borderTop: '1px solid #e2e8f0' }}>
                    {phase.weeks.map((w, wIdx) => (
                      <div key={wIdx} style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <strong style={{ color: '#0284c7' }}>Tuần {w.week}:</strong>
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{w.sessionTargets || 3} buổi</span>
                        </div>
                        <div style={{ color: '#334155' }}>{w.focus}</div>

                        {w.sessions && w.sessions.length > 0 && (
                          <div style={{ marginTop: '6px', display: 'grid', gap: '4px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                            {w.sessions.map((sess, sIdx) => (
                              <div key={sIdx} style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Dumbbell size={11} color="var(--secondary-color)" />
                                <strong>{sess.name}:</strong> {sess.focus}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
      </ol>
    </div>
  );
}
