import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Dumbbell, Plus } from 'lucide-react';
import ExerciseLibraryPage from '../../pages/pt/ExerciseLibraryPage';
import WorkoutTemplateList from './WorkoutTemplateList';

export default function MyWorkoutPlans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const refreshKey = 0;
  const activeTab = searchParams.get('tab') === 'exercises' ? 'exercises' : 'plans';
  const selectTab = (tab: 'plans' | 'exercises') => setSearchParams({ tab });

  return (
    <section className="space-y-6">
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Nội dung Giáo án của tôi">
        <button id="workout-tab-plans" type="button" role="tab" aria-selected={activeTab === 'plans'} aria-controls="workout-panel-plans" className={activeTab === 'plans' ? 'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-montserrat text-sm font-bold text-primary shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary' : 'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-montserrat text-sm font-semibold text-slate-600 transition-colors hover:bg-white/70 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'} onClick={() => selectTab('plans')}>
          <BookOpen size={18} /> Giáo án của tôi
        </button>
        <button id="workout-tab-exercises" type="button" role="tab" aria-selected={activeTab === 'exercises'} aria-controls="workout-panel-exercises" className={activeTab === 'exercises' ? 'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 font-montserrat text-sm font-bold text-primary shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary' : 'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-montserrat text-sm font-semibold text-slate-600 transition-colors hover:bg-white/70 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary'} onClick={() => selectTab('exercises')}>
          <Dumbbell size={18} /> Thư viện bài tập
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div id="workout-panel-plans" role="tabpanel" aria-labelledby="workout-tab-plans" className="space-y-6">
          <header className="section-header">
            <div>
              <h1 className="font-oswald text-3xl font-bold uppercase text-primary">Giáo án của tôi</h1>
              <p className="mt-2 font-montserrat text-sm text-slate-600">Xây dựng và tái sử dụng thư viện giáo án riêng của bạn.</p>
            </div>
            <button type="button" className="button button-primary" onClick={() => navigate('/pt/my-workout-plans/new')}><Plus size={18} /> Tạo giáo án</button>
          </header>
          <WorkoutTemplateList refreshKey={refreshKey} onEdit={(template) => navigate(`/pt/my-workout-plans/${template._id}/edit`)} />
        </div>
      ) : (
        <div id="workout-panel-exercises" role="tabpanel" aria-labelledby="workout-tab-exercises">
          <ExerciseLibraryPage />
        </div>
      )}
    </section>
  );
}
