import type { WorkoutSessionDto } from '../../types';

export default function WorkoutSessionDetail({ session }: { session: WorkoutSessionDto }) {
  const sets = session.exerciseLogs.flatMap((exercise) => exercise.sets.filter((set) => set.completed));
  const volume = sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
  const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
  const averageRpe = rpes.length ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10 : null;
  return <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
    <header><h3 className="font-oswald text-xl font-bold uppercase text-primary">{session.planSnapshot.title || 'Buổi tập'} · {session.planSnapshot.session?.name || 'Không tên'}</h3><p className="mt-1 text-sm text-slate-500">{new Date(session.performedAt).toLocaleDateString('vi-VN')}</p></header>
    <div className="flex flex-wrap gap-2"><span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-primary">{volume.toLocaleString('vi-VN')} kg</span>{averageRpe !== null && <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">RPE {averageRpe}</span>}</div>
    <div className="space-y-3">{session.exerciseLogs.map((exercise) => <section className="rounded-lg bg-slate-50 p-3" key={exercise.name}><h4 className="font-bold text-slate-900">{exercise.name}</h4><ul className="mt-2 grid gap-2 sm:grid-cols-2">{exercise.sets.map((set, index) => <li className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" key={index}>Set {index + 1}: {set.weight ?? '—'} kg × {set.reps ?? '—'} reps{typeof set.rpe === 'number' ? ` · RPE ${set.rpe}` : ''}</li>)}</ul>{exercise.notes && <p className="mt-2 text-sm text-slate-600">{exercise.notes}</p>}</section>)}</div>
    {(session.feeling || session.notes) && <dl className="grid gap-3 text-sm sm:grid-cols-2">{session.feeling && <div><dt className="font-semibold text-slate-500">Cảm nhận</dt><dd className="mt-1 text-slate-900">{session.feeling}</dd></div>}{session.notes && <div><dt className="font-semibold text-slate-500">Ghi chú</dt><dd className="mt-1 text-slate-900">{session.notes}</dd></div>}</dl>}
  </article>;
}
