import type { ScheduledExercise, TemplateMetadata } from '../../types/workoutStudio';
import ExerciseInspector from './ExerciseInspector';
import TemplateMetadataForm from './TemplateMetadataForm';

interface Props {
  activeTab: 'template' | 'exercise';
  metadata: TemplateMetadata;
  muscleGroupOptions: string[];
  readOnly?: boolean;
  selected?: ScheduledExercise;
  days: number[];
  onTabChange: (tab: 'template' | 'exercise') => void;
  onMetadataChange: (value: TemplateMetadata) => void;
  onExerciseUpdate: (patch: Partial<ScheduledExercise>) => void;
  onUnscheduled: () => void;
}

export default function StudioSidebar(props: Props) {
  const tabClass = (active: boolean) => `flex-1 border-b-2 px-2 py-2 text-xs font-bold transition ${active ? 'border-secondary text-primary' : 'border-transparent text-slate-500 hover:text-primary'}`;
  return <aside aria-label="Thuộc tính Studio" className="studio-inspector !block !rounded-2xl !border !border-slate-200 !bg-white !p-5 shadow-[0_8px_24px_rgba(0,59,112,0.05)] max-[1000px]:!max-h-[70vh] min-[1001px]:sticky min-[1001px]:top-4 min-[1001px]:max-h-[calc(100dvh-2rem)] min-[1001px]:overflow-y-auto">
    <div className="mb-3 flex border-b border-slate-200" role="tablist" aria-label="Thuộc tính Studio">
      <button type="button" role="tab" aria-selected={props.activeTab === 'template'} className={tabClass(props.activeTab === 'template')} onClick={() => props.onTabChange('template')}>Giáo án</button>
      <button type="button" role="tab" aria-selected={props.activeTab === 'exercise'} className={tabClass(props.activeTab === 'exercise')} onClick={() => props.onTabChange('exercise')}>Bài tập</button>
    </div>
    {props.activeTab === 'template'
      ? <TemplateMetadataForm value={props.metadata} muscleGroupOptions={props.muscleGroupOptions} readOnly={props.readOnly} onChange={props.onMetadataChange} />
      : <ExerciseInspector selected={props.selected} days={props.days} onUpdate={props.onExerciseUpdate} onUnscheduled={props.onUnscheduled} />}
  </aside>;
}
