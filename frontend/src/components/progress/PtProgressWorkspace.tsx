import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import type { CustomerJourneyDto } from '../../types';
import WorkoutSessionLogger from './WorkoutSessionLogger';
import WorkoutSessionDetail from './WorkoutSessionDetail';
import MeasurementForm from './MeasurementForm';
import ProgressCharts from './ProgressCharts';
import AchievementList from './AchievementList';
import ProgressOverview from './ProgressOverview';
import ProgressReportGenerator from './ProgressReportGenerator';

const tabs = ['Tổng quan', 'Buổi tập', 'Chỉ số cơ thể', 'Thành tích', 'Ảnh tiến độ', 'Giáo án', 'Báo cáo'] as const;
type Tab = typeof tabs[number];
type ActivePlan = { _id: string; sourceTemplateId?: string; title: string; sessions?: Array<{ name: string; exercises?: Array<{ name: string; sets?: number; reps?: string | number }> }> };

export default function PtProgressWorkspace({ journey, onRefresh }: { journey: CustomerJourneyDto; onRefresh: () => void }) {
  const [tab, setTab] = useState<Tab>('Tổng quan');
  const activePlan = journey.plans.active as ActivePlan | null;

  return <section className="progress-workspace">
    <div className="progress-workspace-header">
      <div>
        <p className="progress-workspace-kicker">Đang theo dõi</p>
        <h2 className="progress-workspace-title">{journey.customer.fullName}</h2>
      </div>
      <button type="button" className="button button-primary progress-workspace-button" onClick={() => setTab('Buổi tập')}>
        <Dumbbell size={17} /> Ghi nhận buổi tập
      </button>
    </div>

    <div className="progress-tabs" role="tablist" aria-label="Khu vực tiến độ">
      {tabs.map((item) => <button className={tab === item ? 'progress-tab progress-tab-active' : 'progress-tab'} role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}
    </div>

    {tab === 'Tổng quan' && <ProgressOverview analytics={journey.analytics} />}
    {tab === 'Buổi tập' && <div className="progress-workspace-section"><WorkoutSessionLogger customerId={journey.customer._id} activePlan={activePlan} onSaved={onRefresh} />{journey.sessions.map((session) => <WorkoutSessionDetail session={session} key={session._id} />)}</div>}
    {tab === 'Chỉ số cơ thể' && <div className="progress-workspace-section"><MeasurementForm customerId={journey.customer._id} onSaved={onRefresh} /><ProgressCharts measurements={journey.measurements} /></div>}
    {tab === 'Thành tích' && <AchievementList achievements={journey.analytics.achievements} />}
    {tab === 'Ảnh tiến độ' && <div className="progress-photo-grid">{journey.photos.map((photo) => <img className="progress-photo" src={String(photo.photoUrl)} alt={`Ảnh tiến độ ${String(photo.stage)}`} key={String(photo._id)} />)}</div>}
    {tab === 'Giáo án' && <div className="progress-plan-list"><h2 className="progress-plan-title">{String(activePlan?.title || 'Chưa có giáo án')}</h2>{journey.plans.history.map((plan) => <article className="progress-plan-card" key={String(plan._id)}>{String(plan.title)}</article>)}</div>}
    {tab === 'Báo cáo' && <ProgressReportGenerator customerId={journey.customer._id} onSaved={onRefresh} />}
  </section>;
}
