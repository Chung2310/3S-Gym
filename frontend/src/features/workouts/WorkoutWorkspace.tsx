import { useState } from 'react';
import WorkoutBuilder from './WorkoutBuilder';
import WorkoutCheckIn from './WorkoutCheckIn';
import WorkoutSessionHistory from './WorkoutSessionHistory';
import WorkoutTemplateList, { type WorkoutTemplate } from './WorkoutTemplateList';

export default function WorkoutWorkspace() {
  const [templateRefresh, setTemplateRefresh] = useState(0); const [sessionRefresh, setSessionRefresh] = useState(0); const [editing, setEditing] = useState<WorkoutTemplate | null>(null); const [customerId, setCustomerId] = useState('');
  return <section><div className="section-header"><div><h1>Giáo án và buổi tập</h1><p>Xây giáo án, check-in an toàn và theo dõi lịch sử.</p></div></div><WorkoutBuilder template={editing} onSaved={() => { setEditing(null); setTemplateRefresh((value) => value + 1); }} /><WorkoutTemplateList refreshKey={templateRefresh} onEdit={setEditing} /><WorkoutCheckIn onCompleted={() => setSessionRefresh((value) => value + 1)} /><label className="field panel"><span>Mã khách hàng cần xem lịch sử</span><input aria-label="Mã khách hàng xem lịch sử" value={customerId} onChange={(event) => setCustomerId(event.target.value)} /></label><WorkoutSessionHistory customerId={customerId} refreshKey={sessionRefresh} /></section>;
}
