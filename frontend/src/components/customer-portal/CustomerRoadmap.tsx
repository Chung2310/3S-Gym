import { Map, Sparkles, User as UserIcon } from 'lucide-react';
import type { CustomerJourneyDto } from '../../types';
import type { Roadmap } from '../../types/roadmap';
import RoadmapDetailView from '../roadmap/RoadmapDetailView';

interface CustomerRoadmapProps {
  journey: CustomerJourneyDto;
}

export default function CustomerRoadmap({ journey }: CustomerRoadmapProps) {
  const { roadmaps } = journey;
  const activeRoadmap = roadmaps && roadmaps.length > 0 ? roadmaps[0] : null;

  if (!activeRoadmap) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 mb-3">
          <Map size={30} />
        </div>
        <h3 className="font-oswald text-xl font-bold uppercase text-slate-800">
          Chưa có lộ trình công bố
        </h3>
        <p className="mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
          Huấn luyện viên đang xây dựng lộ trình chi tiết theo từng giai đoạn và mốc đánh giá cho bạn. Vui lòng kiểm tra lại sau!
        </p>
      </div>
    );
  }

  // Map journey roadmap to Roadmap type expected by RoadmapDetailView
  const roadmapData: Roadmap = {
    _id: activeRoadmap._id || '',
    customerId: activeRoadmap.customerId || '',
    title: activeRoadmap.title || '',
    strategy: activeRoadmap.strategy,
    phases: activeRoadmap.phases || [],
    status: (activeRoadmap.status as 'DRAFT' | 'PUBLISHED') || 'PUBLISHED',
    version: activeRoadmap.version || 1,
    baseline: (activeRoadmap as any).baseline,
  };

  return (
    <div className="space-y-5">
      {/* Compact Roadmap Title Bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} color="#38bdf8" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  padding: '1px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}
              >
                Lộ trình cá nhân hóa
              </span>
              {journey.customer?.assignedPt?.fullName && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: '#f0fdf4',
                    color: '#166534',
                    border: '1px solid #bbf7d0',
                    padding: '1px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <UserIcon size={11} /> {journey.customer.assignedPt.fullName}
                </span>
              )}
            </div>
            <h2
              style={{
                margin: '4px 0 0',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--primary-color)',
                wordBreak: 'break-word',
              }}
            >
              {roadmapData.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Reuse the exact same detail view from PT side */}
      <RoadmapDetailView roadmap={roadmapData} />
    </div>
  );
}
