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

  return <section className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đang theo dõi</p>
        <h2 className="font-oswald text-2xl font-bold uppercase text-primary">{journey.customer.fullName}</h2>
      </div>
      <button type="button" className="button button-primary min-h-11" onClick={() => setTab('Buổi tập')}>
        <Dumbbell size={17} /> Ghi nhận buổi tập
      </button>
    </div>

    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Khu vực tiến độ">
      {tabs.map((item) => <button className={tab === item ? 'min-h-11 whitespace-nowrap rounded-lg bg-white px-4 text-sm font-bold text-primary shadow-sm' : 'min-h-11 whitespace-nowrap rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-white/70'} role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}
    </div>

    {tab === 'Tổng quan' && <ProgressOverview analytics={journey.analytics} />}
    {tab === 'Buổi tập' && <div className="space-y-4"><WorkoutSessionLogger customerId={journey.customer._id} activePlan={activePlan} onSaved={onRefresh} />{journey.sessions.map((session) => <WorkoutSessionDetail session={session} key={session._id} />)}</div>}
    {tab === 'Chỉ số cơ thể' && <div className="space-y-4"><MeasurementForm customerId={journey.customer._id} onSaved={onRefresh} /><ProgressCharts measurements={journey.measurements} /></div>}
    {tab === 'Thành tích' && <AchievementList achievements={journey.analytics.achievements} />}
    {tab === 'Ảnh tiến độ' && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{journey.photos.map((photo) => <img className="aspect-[3/4] w-full rounded-xl object-cover" src={String(photo.photoUrl)} alt={`Ảnh tiến độ ${String(photo.stage)}`} key={String(photo._id)} />)}</div>}
    {tab === 'Giáo án' && <div className="space-y-3"><h2 className="font-oswald text-2xl font-bold uppercase text-primary">{String(activePlan?.title || 'Chưa có giáo án')}</h2>{journey.plans.history.map((plan) => <article className="rounded-lg border border-slate-200 bg-white p-4" key={String(plan._id)}>{String(plan.title)}</article>)}</div>}
    {tab === 'Báo cáo' && <ProgressReportGenerator customerId={journey.customer._id} onSaved={onRefresh} />}
  </section>;
}
