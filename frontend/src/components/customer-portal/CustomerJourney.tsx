import { useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Camera,
  Dumbbell,
  FileText,
  LineChart,
} from 'lucide-react';
import type { CustomerJourneyDto } from '../../types';
import AchievementList from '../progress/AchievementList';
import ProgressCharts from '../progress/ProgressCharts';
import ProgressOverview from '../progress/ProgressOverview';
import WorkoutSessionDetail from '../progress/WorkoutSessionDetail';
import CustomerProgress from './CustomerProgress';

type TabId = 'overview' | 'sessions' | 'charts' | 'calendar' | 'achievements' | 'reports';

export default function CustomerJourney({ journey }: { journey: CustomerJourneyDto }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: Array<{ id: TabId; label: string; icon: typeof Activity; count?: number }> = [
    { id: 'overview', label: 'Chỉ số & Giáo án', icon: Activity },
    { id: 'sessions', label: 'Buổi tập', icon: Dumbbell, count: journey.sessions.length },
    { id: 'charts', label: 'Biểu đồ cơ thể', icon: LineChart },
    { id: 'calendar', label: 'Lịch tập', icon: Calendar, count: journey.calendar.length },
    { id: 'achievements', label: 'Thành tích & Ảnh', icon: Award, count: journey.photos.length + journey.analytics.achievements.length },
    { id: 'reports', label: 'Báo cáo', icon: FileText, count: journey.reports.length },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Thanh Tab Cố Định (Sticky Top) — Dùng class .workout-tabs từ index.css */}
      <div className="workout-tabs" role="tablist" aria-label="Danh mục tiến độ">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="badge-tag">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Nội dung từng phần — Sử dụng hoàn toàn class có sẵn từ index.css */}
      <div className="flex flex-col gap-5 min-h-[340px] mt-1">
        {/* Tab 1: Chỉ số & Giáo án */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            <ProgressOverview analytics={journey.analytics} />

            {/* Giáo án đang áp dụng — dùng profile-form-section, pt-detail-info-card, pt-detail-chips từ index.css */}
            {journey.plans.active && (
              <div className="profile-form-section">
                <h3>
                  <BookOpen size={16} />
                  <span>Giáo án đang áp dụng</span>
                </h3>
                <div className="pt-detail-info-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase">
                        Tên giáo án
                      </div>
                      <div className="text-base font-bold text-[#003b70] mt-0.5">
                        {String(journey.plans.active.title)}
                      </div>
                    </div>
                    {Array.isArray((journey.plans.active as { sessions?: unknown[] })?.sessions) && (
                      <div className="pt-detail-chip">
                        {((journey.plans.active as { sessions?: unknown[] }).sessions || []).length} Buổi tập
                      </div>
                    )}
                  </div>

                  {Array.isArray((journey.plans.active as { sessions?: Array<{ name?: string }> })?.sessions) && (
                    <div className="pt-detail-chips mt-3">
                      {(journey.plans.active as { sessions?: Array<{ name?: string }> }).sessions?.map((s, idx) => (
                        <span key={idx} className="pt-detail-chip">
                          <Dumbbell size={13} />
                          <span>{s.name || `Buổi ${idx + 1}`}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Giáo án trước đây */}
            {journey.plans.history.length > 0 && (
              <div className="profile-form-section">
                <h3>
                  <span>Giáo án trước đây</span>
                </h3>
                <div className="pt-detail-grid">
                  {journey.plans.history.map((plan) => (
                    <div key={String(plan._id)} className="pt-detail-info-card">
                      <div className="font-bold text-[#003b70] text-sm">
                        {String(plan.title)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Lịch sử buổi tập */}
        {activeTab === 'sessions' && (
          <div>
            {journey.sessions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {journey.sessions.map((session) => (
                  <WorkoutSessionDetail session={session} key={session._id} />
                ))}
              </div>
            ) : (
              <div className="pt-detail-info-card text-center p-6 text-slate-500">
                Chưa có buổi tập nào được ghi nhận.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Biểu đồ chỉ số cơ thể */}
        {activeTab === 'charts' && (
          <ProgressCharts measurements={journey.measurements} />
        )}

        {/* Tab 4: Lịch tập & Buổi hẹn */}
        {activeTab === 'calendar' && (
          <div className="profile-form-section">
            <h3>
              <Calendar size={16} />
              <span>Lịch tập & Buổi hẹn ({journey.calendar.length})</span>
            </h3>
            {journey.calendar.length > 0 ? (
              <div className="pt-detail-grid">
                {journey.calendar.map((event) => (
                  <article key={String(event._id)} className="pt-detail-info-card">
                    <div className="font-bold text-slate-800 text-sm">
                      {String(event.title)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5">
                      {new Date(String(event.startsAt)).toLocaleString('vi-VN')}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="pt-detail-info-card text-slate-500 italic">
                Chưa có lịch hẹn nào.
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Thành tích & Ảnh tiến độ */}
        {activeTab === 'achievements' && (
          <div className="flex flex-col gap-4">
            <AchievementList achievements={journey.analytics.achievements} />

            {/* Ảnh tiến độ */}
            <div className="profile-form-section">
              <h3>
                <Camera size={16} />
                <span>Ảnh tiến độ ({journey.photos.length})</span>
              </h3>
              {journey.photos.length > 0 ? (
                <div className="pt-grid">
                  {journey.photos.map((photo) => (
                    <div key={String(photo._id)} className="pt-card overflow-hidden">
                      <img
                        className="w-full aspect-[3/4] object-cover"
                        src={String(photo.photoUrl)}
                        alt={`Ảnh tiến độ ${String(photo.stage)}`}
                      />
                      <div className="p-2.5 bg-slate-50 font-bold text-xs text-[#003b70]">
                        {String(photo.stage || 'Ảnh tiến độ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-detail-info-card text-slate-500 italic">
                  Chưa có ảnh tiến độ định kỳ.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Báo cáo tiến độ */}
        {activeTab === 'reports' && (
          <CustomerProgress reports={journey.reports} />
        )}
      </div>
    </div>
  );
}
