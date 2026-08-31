import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Dumbbell, Plus } from 'lucide-react';
import ExerciseLibraryPage from '../../pages/pt/ExerciseLibraryPage';
import WorkoutTemplateList from './WorkoutTemplateList';
import AiWorkoutWizard from './AiWorkoutWizard';
import { api } from '../../services/api';

export default function MyWorkoutPlans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const refreshKey = 0;
  const [aiOpen, setAiOpen] = useState(false);
  const [customers, setCustomers] = useState<Array<{ _id: string; fullName: string; phone: string }>>([]);
  useEffect(() => { if (aiOpen) void api.get<Array<{ _id: string; fullName: string; phone: string }>>('/api/customers?page=1&limit=100').then((result) => setCustomers(result.data)).catch(() => setCustomers([])); }, [aiOpen]);
  const activeTab = searchParams.get('tab') === 'exercises' ? 'exercises' : 'plans';
  const selectTab = (tab: 'plans' | 'exercises') => setSearchParams({ tab });

  return (
    <section className="space-y-6">
      <div className="flex border-b border-slate-200 gap-1.5 px-2" role="tablist" aria-label="Nội dung Giáo án của tôi">
        <button
          id="workout-tab-plans"
          type="button"
          role="tab"
          aria-selected={activeTab === 'plans'}
          aria-controls="workout-panel-plans"
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-montserrat transition-all rounded-t-lg border-t border-x -mb-px z-10 cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-white border-slate-200 text-primary border-b-white'
              : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-850 border-b-slate-200'
          }`}
          onClick={() => selectTab('plans')}
        >
          <BookOpen size={14} /> Giáo án của tôi
        </button>
        <button
          id="workout-tab-exercises"
          type="button"
          role="tab"
          aria-selected={activeTab === 'exercises'}
          aria-controls="workout-panel-exercises"
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold font-montserrat transition-all rounded-t-lg border-t border-x -mb-px z-10 cursor-pointer ${
            activeTab === 'exercises'
              ? 'bg-white border-slate-200 text-primary border-b-white'
              : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-850 border-b-slate-200'
          }`}
          onClick={() => selectTab('exercises')}
        >
          <Dumbbell size={14} /> Thư viện bài tập
        </button>
      </div>

      {activeTab === 'plans' ? (
        <div id="workout-panel-plans" role="tabpanel" aria-labelledby="workout-tab-plans" className="space-y-6">
          <header className="section-header">
            <div>
              <h1 className="font-oswald text-3xl font-bold uppercase text-primary">Giáo án của tôi</h1>
              <p className="mt-2 font-montserrat text-sm text-slate-600">Xây dựng và tái sử dụng thư viện giáo án riêng của bạn.</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="button button-primary" onClick={() => navigate('/pt/my-workout-plans/new')}><Plus size={18} /> Tạo giáo án</button>
              <button type="button" className="button button-secondary" onClick={() => setAiOpen(true)}>Tạo bằng AI</button>
            </div>
          </header>
          <WorkoutTemplateList refreshKey={refreshKey} onEdit={(template) => navigate(`/pt/my-workout-plans/${template._id}/edit`)} />
          <AiWorkoutWizard open={aiOpen} customers={customers} onClose={() => setAiOpen(false)} onGenerated={(draft) => navigate('/pt/my-workout-plans/new', { state: { aiWorkoutDraft: draft } })} />
        </div>
      ) : (
        <div id="workout-panel-exercises" role="tabpanel" aria-labelledby="workout-tab-exercises">
          <ExerciseLibraryPage />
        </div>
      )}
    </section>
  );
}
