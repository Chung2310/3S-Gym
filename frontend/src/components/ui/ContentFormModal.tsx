import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import FormField from './FormField';
import FormModal from './FormModal';
import { useToast } from './ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';

export type Resource = 'inbody' | 'goals' | 'workout-plans' | 'nutrition-plans';
interface ExerciseForm { name: string; sets: number; reps: string; weight: string; rest: string; tempo: string; notes: string }
interface SessionForm { name: string; exercises: ExerciseForm[] }
interface MealForm { name: string; foods: string; calories: number | string | null }
interface ContentFormState {
  customerId: string; title: string; measurementDate: string; weight: string; bmi: string; bodyFatPercentage: string; bodyFatMass: string;
  muscleMass: string; bmr: string; visceralFatLevel: string; inbodyScore: string; strengths: string; priorities: string; recommendation: string;
  source: string; type: string; targetValue: string; targetUnit: string; deadline: string; sessionsPerWeek: string; cardioNotes: string;
  evaluationNotes: string; startDate: string; endDate: string; sessions: SessionForm[]; tdee: string; targetCalories: string;
  protein: string | number; carbs: string | number; fat: string | number; menu: MealForm[]; notes: string;
}
export type ContentItem = Partial<ContentFormState> & { _id?: string; macros?: { protein?: number; carbs?: number; fat?: number } };
interface ContentFormModalProps { open: boolean; resource: Resource; item?: ContentItem | null; onClose: () => void; onSaved: (data: unknown) => void }

const empty: ContentFormState = { customerId: '', title: '', measurementDate: '', weight: '', bmi: '', bodyFatPercentage: '', bodyFatMass: '', muscleMass: '', bmr: '', visceralFatLevel: '', inbodyScore: '', strengths: '', priorities: '', recommendation: '', source: 'MANUAL', type: 'FAT_LOSS', targetValue: '', targetUnit: '', deadline: '', sessionsPerWeek: '3', cardioNotes: '', evaluationNotes: '', startDate: '', endDate: '', sessions: [], tdee: '', targetCalories: '', protein: '', carbs: '', fat: '', menu: [], notes: '' };
const labels = { inbody: 'InBody', goals: 'mục tiêu', 'workout-plans': 'giáo án', 'nutrition-plans': 'dinh dưỡng' };
const date = (value?: string): string => value?.slice(0, 10) || '';
const numberOrNull = (value: string | number | null | undefined): number | null => value === '' || value == null ? null : Number(value);

export default function ContentFormModal({ open, resource, item, onClose, onSaved }: ContentFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [initial, setInitial] = useState(empty);
  const [loading, setLoading] = useState(false);
  const editing = Boolean(item?._id);
  useEffect(() => {
    if (!open) return;
    const next = { ...empty, ...item, measurementDate: date(item?.measurementDate), deadline: date(item?.deadline), startDate: date(item?.startDate), endDate: date(item?.endDate), protein: item?.macros?.protein ?? '', carbs: item?.macros?.carbs ?? '', fat: item?.macros?.fat ?? '', sessions: item?.sessions || [], menu: item?.menu || [] };
    setForm(next); setInitial(next);
  }, [open, item, resource]);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const set = (key: keyof ContentFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));
  const field = (label: string, key: keyof ContentFormState, props: (InputHTMLAttributes<HTMLInputElement> & { as?: 'input' }) | (TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' }) = {}) => {
    if (props.as === 'textarea') {
      const { as, ...textareaProps } = props;
      return <FormField as={as} label={label} name={`content-${key}`} value={String(form[key] ?? '')} onChange={set(key)} {...textareaProps} />;
    }
    return <FormField label={label} name={`content-${key}`} value={String(form[key] ?? '')} onChange={set(key)} {...props} />;
  };
  const addSession = () => setForm((value) => ({ ...value, sessions: [...value.sessions, { name: '', exercises: [] }] }));
  const changeSession = (index: number, name: string) => setForm((value) => ({ ...value, sessions: value.sessions.map((session, position) => position === index ? { ...session, name } : session) }));
  const removeSession = (index: number) => setForm((value) => ({ ...value, sessions: value.sessions.filter((_, position) => position !== index) }));
  const addExercise = (sessionIndex: number) => setForm((value) => ({ ...value, sessions: value.sessions.map((session, position) => position === sessionIndex ? { ...session, exercises: [...session.exercises, { name: '', sets: 3, reps: '8-12', weight: '', rest: '', tempo: '', notes: '' }] } : session) }));
  const changeExercise = (sessionIndex: number, exerciseIndex: number, key: keyof ExerciseForm, value: string) => setForm((current) => ({ ...current, sessions: current.sessions.map((session, position) => position === sessionIndex ? { ...session, exercises: session.exercises.map((exercise, exercisePosition) => exercisePosition === exerciseIndex ? { ...exercise, [key]: key === 'sets' ? Number(value) : value } : exercise) } : session) }));
  const removeExercise = (sessionIndex: number, exerciseIndex: number) => setForm((value) => ({ ...value, sessions: value.sessions.map((session, position) => position === sessionIndex ? { ...session, exercises: session.exercises.filter((_, exercisePosition) => exercisePosition !== exerciseIndex) } : session) }));
  const addMeal = () => setForm((value) => ({ ...value, menu: [...value.menu, { name: '', foods: '', calories: '' }] }));
  const changeMeal = (index: number, key: keyof MealForm, value: string) => setForm((current) => ({ ...current, menu: current.menu.map((meal, position) => position === index ? { ...meal, [key]: key === 'calories' ? numberOrNull(value) : value } : meal) }));
  const removeMeal = (index: number) => setForm((value) => ({ ...value, menu: value.menu.filter((_, position) => position !== index) }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true);
    try {
      let body: Record<string, unknown> = { customerId: form.customerId };
      if (resource === 'inbody') body = { ...body, measurementDate: form.measurementDate, weight: Number(form.weight), bmi: numberOrNull(form.bmi), bodyFatPercentage: numberOrNull(form.bodyFatPercentage), bodyFatMass: numberOrNull(form.bodyFatMass), muscleMass: numberOrNull(form.muscleMass), bmr: numberOrNull(form.bmr), visceralFatLevel: numberOrNull(form.visceralFatLevel), inbodyScore: numberOrNull(form.inbodyScore), strengths: form.strengths, priorities: form.priorities, recommendation: form.recommendation, source: form.source };
      if (resource === 'goals') body = { ...body, title: form.title, type: form.type, targetValue: numberOrNull(form.targetValue), targetUnit: form.targetUnit, deadline: form.deadline, sessionsPerWeek: Number(form.sessionsPerWeek), cardioNotes: form.cardioNotes, evaluationNotes: form.evaluationNotes };
      if (resource === 'workout-plans') body = { ...body, title: form.title, startDate: form.startDate || null, endDate: form.endDate || null, sessions: form.sessions };
      if (resource === 'nutrition-plans') body = { ...body, title: form.title, bmr: numberOrNull(form.bmr), tdee: numberOrNull(form.tdee), targetCalories: Number(form.targetCalories), macros: { protein: Number(form.protein), carbs: Number(form.carbs), fat: Number(form.fat) }, menu: form.menu, notes: form.notes };
      const result = editing ? await api.patch(`/api/${resource}/${item?._id}`, body) : await api.post(`/api/${resource}`, body);
      toast.success(result.message); onSaved(result.data);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };
  return <FormModal open={open} title={`${editing ? 'Sửa' : 'Tạo'} ${labels[resource]}`} dirty={dirty} loading={loading} onClose={onClose} onSubmit={submit} submitLabel={editing ? 'Lưu thay đổi' : 'Lưu bản nháp'}><section className="profile-form-section"><div className="profile-form-grid">
    {field('Mã khách hàng', 'customerId', { required: true })}
    {resource === 'inbody' && <>{field('Ngày đo', 'measurementDate', { type: 'date', required: true })}{field('Cân nặng (kg)', 'weight', { type: 'number', min: 0, step: '0.1', required: true })}{field('BMI', 'bmi', { type: 'number', min: 0, step: '0.1' })}{field('Mỡ cơ thể (%)', 'bodyFatPercentage', { type: 'number', min: 0, max: 100, step: '0.1' })}{field('Khối lượng mỡ (kg)', 'bodyFatMass', { type: 'number', min: 0, step: '0.1' })}{field('Cơ xương (kg)', 'muscleMass', { type: 'number', min: 0, step: '0.1' })}{field('BMR (kcal)', 'bmr', { type: 'number', min: 0 })}{field('Mỡ nội tạng', 'visceralFatLevel', { type: 'number', min: 0 })}{field('Điểm InBody', 'inbodyScore', { type: 'number', min: 0 })}<FormField label="Nguồn dữ liệu" name="content-source" as="select" value={form.source} onChange={set('source')}><option value="MANUAL">Nhập thủ công</option><option value="AI_SCAN">Quét AI</option></FormField>{field('Điểm mạnh', 'strengths', { as: 'textarea' })}{field('Điểm cần ưu tiên', 'priorities', { as: 'textarea' })}{field('Khuyến nghị', 'recommendation', { as: 'textarea' })}</>}
    {resource === 'goals' && <>{field('Tên mục tiêu', 'title', { required: true })}<FormField label="Loại mục tiêu" name="content-type" as="select" value={form.type} onChange={set('type')}><option value="WEIGHT_LOSS">Giảm cân</option><option value="FAT_LOSS">Giảm mỡ</option><option value="WEIGHT_GAIN">Tăng cân</option><option value="MUSCLE_GAIN">Tăng cơ</option><option value="RECOMPOSITION">Tái cấu trúc cơ thể</option><option value="FITNESS">Thể lực</option></FormField>{field('Giá trị mục tiêu', 'targetValue', { type: 'number', step: '0.1' })}{field('Đơn vị', 'targetUnit')}{field('Thời hạn', 'deadline', { type: 'date', required: true })}{field('Số buổi mỗi tuần', 'sessionsPerWeek', { type: 'number', min: 1, max: 14, required: true })}{field('Ghi chú cardio', 'cardioNotes', { as: 'textarea' })}{field('Ghi chú đánh giá', 'evaluationNotes', { as: 'textarea' })}</>}
    {resource === 'workout-plans' && <>{field('Tên giáo án', 'title', { required: true })}{field('Ngày bắt đầu', 'startDate', { type: 'date' })}{field('Ngày kết thúc', 'endDate', { type: 'date' })}<div className="dynamic-list"><div className="form-heading"><strong>Các buổi tập</strong><button type="button" className="button button-secondary" onClick={addSession}>Thêm buổi tập</button></div>{form.sessions.map((session, sessionIndex) => <section className="published-card" key={sessionIndex}><FormField label={`Tên buổi ${sessionIndex + 1}`} name={`session-${sessionIndex}`} value={session.name} onChange={(event) => changeSession(sessionIndex, event.target.value)} required /><div className="inline-actions"><button type="button" className="text-button" onClick={() => addExercise(sessionIndex)}>Thêm bài tập</button><button type="button" className="text-button text-danger" onClick={() => removeSession(sessionIndex)}>Xóa buổi</button></div>{session.exercises.map((exercise, exerciseIndex) => <div className="exercise-row" key={exerciseIndex}><FormField label="Tên bài tập" name={`exercise-name-${sessionIndex}-${exerciseIndex}`} value={exercise.name} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'name', event.target.value)} required /><FormField label="Số hiệp" name={`exercise-sets-${sessionIndex}-${exerciseIndex}`} type="number" min="1" value={exercise.sets} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'sets', event.target.value)} /><FormField label="Số lần" name={`exercise-reps-${sessionIndex}-${exerciseIndex}`} value={exercise.reps} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'reps', event.target.value)} /><FormField label="Mức tạ" name={`exercise-weight-${sessionIndex}-${exerciseIndex}`} value={exercise.weight} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'weight', event.target.value)} /><FormField label="Nghỉ" name={`exercise-rest-${sessionIndex}-${exerciseIndex}`} value={exercise.rest} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'rest', event.target.value)} /><FormField label="Tempo" name={`exercise-tempo-${sessionIndex}-${exerciseIndex}`} value={exercise.tempo} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'tempo', event.target.value)} /><FormField label="Ghi chú bài tập" name={`exercise-notes-${sessionIndex}-${exerciseIndex}`} value={exercise.notes} onChange={(event) => changeExercise(sessionIndex, exerciseIndex, 'notes', event.target.value)} /><button type="button" className="text-button text-danger" onClick={() => removeExercise(sessionIndex, exerciseIndex)}>Xóa bài tập</button></div>)}</section>)}</div></>}
    {resource === 'nutrition-plans' && <>{field('Tên thực đơn', 'title', { required: true })}{field('BMR (kcal)', 'bmr', { type: 'number', min: 0 })}{field('TDEE (kcal)', 'tdee', { type: 'number', min: 0 })}{field('Calories mục tiêu', 'targetCalories', { type: 'number', min: 1, required: true })}{field('Protein (g)', 'protein', { type: 'number', min: 0, required: true })}{field('Carb (g)', 'carbs', { type: 'number', min: 0, required: true })}{field('Fat (g)', 'fat', { type: 'number', min: 0, required: true })}<div className="dynamic-list"><div className="form-heading"><strong>Thực đơn cơ bản</strong><button type="button" className="button button-secondary" onClick={addMeal}>Thêm bữa ăn</button></div>{form.menu.map((meal, index) => <div className="published-card" key={index}><FormField label="Tên bữa" name={`meal-name-${index}`} value={meal.name || ''} onChange={(event) => changeMeal(index, 'name', event.target.value)} required /><FormField label="Món ăn" name={`meal-foods-${index}`} value={meal.foods || ''} onChange={(event) => changeMeal(index, 'foods', event.target.value)} /><FormField label="Calories" name={`meal-calories-${index}`} type="number" min="0" value={meal.calories ?? ''} onChange={(event) => changeMeal(index, 'calories', event.target.value)} /><button type="button" className="text-button text-danger" onClick={() => removeMeal(index)}>Xóa bữa ăn</button></div>)}</div>{field('Ghi chú', 'notes', { as: 'textarea' })}</>}
  </div></section></FormModal>;
}
