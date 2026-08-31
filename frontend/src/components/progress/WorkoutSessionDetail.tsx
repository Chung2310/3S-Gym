import type { WorkoutSessionDto } from '../../types';

export default function WorkoutSessionDetail({ session }: { session: WorkoutSessionDto }) {
  const sets = session.exerciseLogs.flatMap((exercise) => exercise.sets.filter((set) => set.completed));
  const volume = sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
  const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
  const averageRpe = rpes.length
    ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10
    : null;

  return (
    <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 font-montserrat sm:p-6">
      <header>
        <h3 className="font-oswald text-xl font-bold uppercase text-primary">
          {session.planSnapshot.title || 'Buổi tập'} · {session.planSnapshot.session?.name || 'Không tên'}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{new Date(session.performedAt).toLocaleDateString('vi-VN')}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-sky-100">
          {volume.toLocaleString('vi-VN')} kg
        </span>
        {averageRpe !== null && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-100">
            RPE {averageRpe}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {session.exerciseLogs.map((exercise) => (
          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" key={exercise.name}>
            <h4 className="font-bold text-slate-900">{exercise.name}</h4>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {exercise.sets.map((set, index) => (
                <li className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" key={index}>
                  Set {index + 1}: {set.weight ?? '—'} kg × {set.reps ?? '—'} reps
                  {typeof set.rpe === 'number' ? ` · RPE ${set.rpe}` : ''}
                </li>
              ))}
            </ul>
            {exercise.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{exercise.notes}</p>}
          </section>
        ))}
      </div>

      {(session.feeling || session.notes) && (
        <dl className="grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
          {session.feeling && (
            <div>
              <dt className="font-semibold text-slate-500">Cảm nhận</dt>
              <dd className="mt-1 text-slate-900">{session.feeling}</dd>
            </div>
          )}
          {session.notes && (
            <div>
              <dt className="font-semibold text-slate-500">Ghi chú</dt>
              <dd className="mt-1 text-slate-900">{session.notes}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}
