import { useState } from 'react';
import CustomerWorkoutPlanPanel from './CustomerWorkoutPlanPanel';
import WorkoutBuilder from './WorkoutBuilder';
import WorkoutTemplateList, { type WorkoutTemplate } from './WorkoutTemplateList';
import { workoutTemplateToDraft, type CustomerWorkoutPlanDraft } from './workoutPlanMapper';

export default function WorkoutWorkspace() {
  const [tab, setTab] = useState<'templates' | 'customers'>('templates'); const [templateRefresh, setTemplateRefresh] = useState(0); const [editing, setEditing] = useState<WorkoutTemplate | null>(null); const [customerDraft, setCustomerDraft] = useState<CustomerWorkoutPlanDraft | null>(null);
  const assign = (template: WorkoutTemplate) => { setCustomerDraft(workoutTemplateToDraft(template)); setTab('customers'); };
  return <section><div className="section-header"><div><h1>Giáo án</h1><p>Xây dựng giáo án mẫu và cá nhân hóa kế hoạch tập cho từng khách hàng.</p></div></div><div className="browser-tabs" role="tablist" aria-label="Quản lý giáo án"><button type="button" role="tab" aria-selected={tab === 'templates'} onClick={() => setTab('templates')}>Giáo án mẫu</button><button type="button" role="tab" aria-selected={tab === 'customers'} onClick={() => setTab('customers')}>Giáo án khách hàng</button></div><div role="tabpanel">{tab === 'templates' ? <><WorkoutBuilder template={editing} onSaved={() => { setEditing(null); setTemplateRefresh((value) => value + 1); }} /><WorkoutTemplateList refreshKey={templateRefresh} onEdit={setEditing} onAssign={assign} /></> : <CustomerWorkoutPlanPanel initialDraft={customerDraft} onDraftConsumed={() => setCustomerDraft(null)} />}</div></section>;
}
