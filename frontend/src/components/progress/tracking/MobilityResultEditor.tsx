import type { MobilityPrescription, MobilityResult } from '../../../types';
import TrackingNumberField from './TrackingNumberField';

interface Props { exerciseName: string; prescription: MobilityPrescription; value: MobilityResult; onChange: (value: MobilityResult) => void }

export default function MobilityResultEditor({ exerciseName, prescription, value, onChange }: Props) {
  const set = (field: keyof MobilityResult, next: number | string | undefined) => onChange({ ...value, [field]: next });
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><TrackingNumberField label="Thời lượng (phút)" ariaLabel={`${exerciseName} thời lượng (phút)`} value={value.durationMinutes} placeholder={prescription.durationMinutes} onChange={(next) => set('durationMinutes', next)} /><TrackingNumberField label="REPS" ariaLabel={`${exerciseName} REPS`} value={value.reps} placeholder={prescription.reps} onChange={(next) => set('reps', next)} /><label className="grid gap-1 text-xs font-semibold text-slate-600"><span>Bên tập</span><select className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20" aria-label={`${exerciseName} bên tập`} value={value.side ?? prescription.side ?? 'BOTH'} onChange={(event) => set('side', event.target.value)}><option value="BOTH">Hai bên</option><option value="LEFT">Trái</option><option value="RIGHT">Phải</option></select></label><TrackingNumberField label="Mức khó chịu" ariaLabel={`${exerciseName} mức khó chịu`} value={value.discomfort} placeholder={prescription.targetDiscomfort} max={10} step="0.1" onChange={(next) => set('discomfort', next)} /></div>;
}
