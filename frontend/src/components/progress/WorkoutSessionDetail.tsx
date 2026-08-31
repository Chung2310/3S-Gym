import type { WorkoutSessionDto } from '../../types';

export default function WorkoutSessionDetail({ session }: { session: WorkoutSessionDto }) {
  const sets = session.exerciseLogs.flatMap((exercise) => exercise.sets.filter((set) => set.completed));
  const volume = sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
  const rpes = sets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
  const averageRpe = rpes.length ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10 : null;
  return <article className="panel progress-session-card">
    <header className="progress-session-header"><h3 className="progress-session-title">{session.planSnapshot.title || 'Buổi tập'} · {session.planSnapshot.session?.name || 'Không tên'}</h3><p className="progress-session-date">{new Date(session.performedAt).toLocaleDateString('vi-VN')}</p></header>
    <div className="progress-session-tags"><span className="progress-session-tag progress-session-tag-volume">{volume.toLocaleString('vi-VN')} kg</span>{averageRpe !== null && <span className="progress-session-tag progress-session-tag-rpe">RPE {averageRpe}</span>}</div>
    <div className="progress-session-exercises">{session.exerciseLogs.map((exercise) => <section className="progress-session-exercise" key={exercise.name}><h4 className="progress-session-exercise-name">{exercise.name}</h4><ul className="progress-session-sets">{exercise.sets.map((set, index) => <li className="progress-session-set" key={index}>Set {index + 1}: {set.weight ?? '—'} kg × {set.reps ?? '—'} reps{typeof set.rpe === 'number' ? ` · RPE ${set.rpe}` : ''}</li>)}</ul>{exercise.notes && <p className="progress-session-exercise-notes">{exercise.notes}</p>}</section>)}</div>
    {(session.feeling || session.notes) && <dl className="progress-session-notes">{session.feeling && <div><dt>Cảm nhận</dt><dd>{session.feeling}</dd></div>}{session.notes && <div><dt>Ghi chú</dt><dd>{session.notes}</dd></div>}</dl>}
  </article>;
}
