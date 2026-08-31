import { Calendar, Dumbbell, MessageSquare, StickyNote } from 'lucide-react';
import type { WorkoutSessionDto } from '../../types';
import { exerciseRpes, exerciseVolume } from '../../utils/sessionTracking';
import TrackingResultSummary from './tracking/TrackingResultSummary';

export default function WorkoutSessionDetail({ session }: { session: WorkoutSessionDto }) {
  const volume = session.exerciseLogs.reduce((sum, exercise) => sum + exerciseVolume(exercise), 0);
  const rpes = session.exerciseLogs.flatMap(exerciseRpes);
  const averageRpe = rpes.length
    ? Math.round((rpes.reduce((sum, value) => sum + value, 0) / rpes.length) * 10) / 10
    : null;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
      {/* Session Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-[#003b70] m-0">
            {session.planSnapshot.title || 'Buổi tập'} · {session.planSnapshot.session?.name || 'Không tên'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
            <Calendar size={13} className="text-slate-400" />
            <span>{new Date(session.performedAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 border border-sky-200/60">
            <Dumbbell size={13} className="text-sky-600" />
            <span>{volume.toLocaleString('vi-VN')} kg</span>
          </span>
          {averageRpe !== null && (
            <span className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/60">
              RPE {averageRpe}
            </span>
          )}
        </div>
      </header>

      {/* Exercises List */}
      <div className="space-y-3">
        {session.exerciseLogs.map((exercise) => (
          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4" key={exercise.name}>
            <h4 className="font-bold text-slate-900">{exercise.name}</h4>
            <div className="mt-3"><TrackingResultSummary exercise={exercise} /></div>
            {exercise.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{exercise.notes}</p>}
          </section>
        ))}
      </div>

      {/* Feedback & Notes footer */}
      {(session.feeling || session.notes) && (
        <div className="grid gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
          {session.feeling && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-600 mb-1">
                <MessageSquare size={13} className="text-slate-400" />
                <span>Cảm nhận</span>
              </div>
              <p className="text-slate-800 m-0">{session.feeling}</p>
            </div>
          )}
          {session.notes && (
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-slate-600 mb-1">
                <StickyNote size={13} className="text-slate-400" />
                <span>Ghi chú</span>
              </div>
              <p className="text-slate-800 m-0">{session.notes}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
