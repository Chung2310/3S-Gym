type Attendance = 'PRESENT' | 'LATE' | 'ABSENT';
interface SetInput { reps?: number; weight?: number; rpe?: number; completed?: boolean }
interface ExerciseInput { name: string; sets?: SetInput[] }
interface SessionInput { _id?: unknown; performedAt: Date | string; attendance: Attendance | string; exerciseLogs?: ExerciseInput[] }
interface MeasurementInput { measuredAt: Date | string; weight?: number; bodyFatPercentage?: number; muscleMass?: number; measurements?: Record<string, number | undefined> }
interface AnalyticsInput { sessions: SessionInput[]; measurements: MeasurementInput[]; periodStart?: Date | string; periodEnd?: Date | string }
type AchievementKind = 'MAX_WEIGHT' | 'MAX_REPS' | 'MAX_SET_VOLUME' | 'ESTIMATED_1RM';
interface Achievement { exerciseName: string; kind: AchievementKind; value: number; achievedAt: string; sessionId: string; isNewInPeriod: boolean }

const round = (value: number) => Math.round(value * 10) / 10;
const time = (value: Date | string) => new Date(value).getTime();
const iso = (value: Date | string) => new Date(value).toISOString();

export function estimatedOneRepMax(weight: number, reps: number) {
  return round(weight * (1 + reps / 30));
}

function inPeriod(value: Date | string, start?: Date | string, end?: Date | string) {
  const current = time(value);
  return (!start || current >= time(start)) && (!end || current <= time(end));
}

function weekKey(value: Date | string) {
  const date = new Date(value); const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1); date.setUTCHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 604_800_000);
}

function achievementsFrom(sessions: SessionInput[], periodStart?: Date | string, periodEnd?: Date | string) {
  const records = new Map<string, Achievement>();
  const consider = (exerciseName: string, kind: AchievementKind, value: number, session: SessionInput) => {
    if (!Number.isFinite(value)) return;
    const key = `${exerciseName.toLocaleLowerCase()}::${kind}`; const current = records.get(key);
    if (!current || value > current.value) records.set(key, { exerciseName, kind, value: round(value), achievedAt: iso(session.performedAt), sessionId: String(session._id || ''), isNewInPeriod: inPeriod(session.performedAt, periodStart, periodEnd) });
  };
  for (const session of sessions) for (const exercise of session.exerciseLogs || []) for (const set of exercise.sets || []) {
    if (set.completed === false) continue;
    if (typeof set.weight === 'number') consider(exercise.name, 'MAX_WEIGHT', set.weight, session);
    if (typeof set.reps === 'number') consider(exercise.name, 'MAX_REPS', set.reps, session);
    if (typeof set.weight === 'number' && typeof set.reps === 'number') {
      consider(exercise.name, 'MAX_SET_VOLUME', set.weight * set.reps, session);
      consider(exercise.name, 'ESTIMATED_1RM', estimatedOneRepMax(set.weight, set.reps), session);
    }
  }
  return [...records.values()].sort((a, b) => a.exerciseName.localeCompare(b.exerciseName) || a.kind.localeCompare(b.kind));
}

function bodyDeltasFrom(measurements: MeasurementInput[]) {
  const sorted = [...measurements].sort((a, b) => time(a.measuredAt) - time(b.measuredAt));
  const keys = ['weight', 'bodyFatPercentage', 'muscleMass', 'chest', 'waist', 'hips', 'arm', 'thigh', 'calf'] as const;
  const result: Record<string, number> = {};
  for (const key of keys) {
    const values = sorted.map((item) => key in item ? item[key as 'weight'] : item.measurements?.[key]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (values.length >= 2) result[key] = round(values.at(-1)! - values[0]);
  }
  return result;
}

export function analyzeProgress(input: AnalyticsInput) {
  const sessions = input.sessions.filter((item) => inPeriod(item.performedAt, input.periodStart, input.periodEnd)).sort((a, b) => time(a.performedAt) - time(b.performedAt));
  const measurements = input.measurements.filter((item) => inPeriod(item.measuredAt, input.periodStart, input.periodEnd)).sort((a, b) => time(a.measuredAt) - time(b.measuredAt));
  const completedSets = sessions.flatMap((session) => (session.exerciseLogs || []).flatMap((exercise) => (exercise.sets || []).filter((set) => set.completed !== false)));
  const totalVolume = round(completedSets.reduce((sum, set) => sum + (typeof set.weight === 'number' && typeof set.reps === 'number' ? set.weight * set.reps : 0), 0));
  const rpes = completedSets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const counts = { present: sessions.filter((item) => item.attendance === 'PRESENT').length, late: sessions.filter((item) => item.attendance === 'LATE').length, absent: sessions.filter((item) => item.attendance === 'ABSENT').length };
  const activeWeeks = [...new Set(sessions.filter((item) => item.attendance !== 'ABSENT').map((item) => weekKey(item.performedAt)))].sort((a, b) => a - b);
  let streakWeeks = activeWeeks.length ? 1 : 0;
  for (let index = activeWeeks.length - 1; index > 0 && activeWeeks[index] - activeWeeks[index - 1] === 1; index -= 1) streakWeeks += 1;
  const bodyDeltas = bodyDeltasFrom(measurements);
  const reasons: string[] = [];
  if (!sessions.length) reasons.push('Chưa có dữ liệu buổi tập.');
  if (measurements.length < 2) reasons.push('Cần ít nhất hai lần đo để so sánh.');
  else if (!('weight' in bodyDeltas) || !('bodyFatPercentage' in bodyDeltas) || !('muscleMass' in bodyDeltas)) reasons.push('Một số chỉ số cơ thể chưa đủ dữ liệu đối chiếu.');
  const level = !sessions.length && !measurements.length ? 'INSUFFICIENT' : reasons.length ? 'PARTIAL' : 'COMPLETE';
  return {
    totalVolume,
    averageRpe: rpes.length ? round(rpes.reduce((sum, value) => sum + value, 0) / rpes.length) : null,
    attendance: { ...counts, rate: sessions.length ? round(((counts.present + counts.late) / sessions.length) * 100) : null },
    streakWeeks,
    bodyDeltas,
    achievements: achievementsFrom(sessions, input.periodStart, input.periodEnd),
    dataQuality: { level, reasons },
  } as const;
}
