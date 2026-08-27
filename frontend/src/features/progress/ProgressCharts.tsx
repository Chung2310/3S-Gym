export interface Measurement { _id: string; measuredAt: string; weight?: number; bodyFatPercentage?: number; muscleMass?: number }
function WeightChart({ values }: { values: Array<Measurement & { weight: number }> }) {
  if (values.length < 2) return <div aria-label="Biểu đồ cân nặng" className="empty-state">Không đủ dữ liệu</div>;
  const weights = values.map((item) => item.weight); const min = Math.min(...weights); const max = Math.max(...weights); const span = max - min || 1;
  const points = values.map((item, index) => `${20 + index * (260 / (values.length - 1))},${110 - ((item.weight - min) / span) * 80}`).join(' ');
  return <svg role="img" aria-label="Biểu đồ cân nặng" viewBox="0 0 300 140"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" />{values.map((item, index) => { const [x, y] = points.split(' ')[index].split(','); const date = new Date(item.measuredAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); return <circle key={item._id} cx={x} cy={y} r="5" aria-label={`${date}: ${item.weight} kg`}><title>{date}: {item.weight} kg</title></circle>; })}</svg>;
}
export default function ProgressCharts({ measurements }: { measurements: Measurement[] }) { return <section className="panel"><h2>Biểu đồ tiến độ</h2><WeightChart values={measurements.filter((item): item is Measurement & { weight: number } => typeof item.weight === 'number')} /></section>; }
