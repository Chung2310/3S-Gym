import { useEffect, useState, type FormEvent } from 'react';
import FormModal from '../ui/FormModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import ExerciseVideoFields, { type ExerciseVideo } from './ExerciseVideoFields';

export interface Exercise {
  [key: string]: unknown;
  _id: string;
  name: string;
  muscleGroup: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  equipment?: string[];
  technique?: string;
  videos?: ExerciseVideo[];
  scope: 'GLOBAL' | 'PRIVATE';
  canManage: boolean;
}

interface ExerciseFormModalProps { open: boolean; exercise?: Exercise | null; onClose: () => void; onSaved: () => void }
interface ExerciseFormState { name: string; muscleGroup: string; level: Exercise['level']; equipment: string; technique: string; videos: ExerciseVideo[]; scope: Exercise['scope'] }
const emptyForm: ExerciseFormState = { name: '', muscleGroup: '', level: 'BEGINNER', equipment: '', technique: '', videos: [], scope: 'PRIVATE' };

export default function ExerciseFormModal({ open, exercise, onClose, onSaved }: ExerciseFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!open) return;
    setUploading(false);
    setForm(exercise ? { name: exercise.name, muscleGroup: exercise.muscleGroup, level: exercise.level, equipment: exercise.equipment?.join(', ') ?? '', technique: exercise.technique ?? '', videos: exercise.videos ?? [], scope: exercise.scope } : { ...emptyForm, videos: [] });
  }, [exercise, open]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (uploading) return;
    const body = { name: form.name, muscleGroup: form.muscleGroup, level: form.level, equipment: form.equipment.split(',').map((item) => item.trim()).filter(Boolean), technique: form.technique, videos: form.videos };
    try {
      const result = exercise ? await api.patch(`/api/exercises/${exercise._id}`, body) : await api.post('/api/exercises', { ...body, scope: form.scope });
      toast.success(result.message);
      onSaved();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };
  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  return <FormModal className="module-modal exercise-form-modal" open={open} title={exercise ? 'Sửa bài tập' : 'Tạo bài tập'} dirty={Object.values(form).some(Boolean)} loading={loading || uploading} submitLabel="Lưu bài tập" onClose={onClose} onSubmit={submit}><div className="module-form exercise-form">
    <section className="exercise-form-section" aria-labelledby="exercise-form-basics">
      <div className="exercise-form-section-heading"><h3 id="exercise-form-basics">Thông tin cơ bản</h3><p>Tên, nhóm cơ và phạm vi sử dụng của bài tập.</p></div>
      <div className="module-field-grid">
        <label className="module-field"><span>Tên bài tập</span><input aria-label="Tên bài tập" placeholder="Ví dụ: Barbell Squat" value={form.name} onChange={(event) => change('name', event.target.value)} required /></label>
        <label className="module-field"><span>Nhóm cơ</span><input aria-label="Nhóm cơ" placeholder="Ví dụ: Chân" value={form.muscleGroup} onChange={(event) => change('muscleGroup', event.target.value)} required /></label>
        <label className="module-field"><span>Cấp độ</span><select aria-label="Cấp độ" value={form.level} onChange={(event) => change('level', event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
        {!exercise && <label className="module-field"><span>Phạm vi</span><select aria-label="Phạm vi" value={form.scope} onChange={(event) => change('scope', event.target.value)}><option value="PRIVATE">Riêng tư</option><option value="GLOBAL">Dùng chung</option></select></label>}
      </div>
    </section>
    <section className="exercise-form-section" aria-labelledby="exercise-form-technique">
      <div className="exercise-form-section-heading"><h3 id="exercise-form-technique">Thiết bị & kỹ thuật</h3><p>Ghi rõ yêu cầu chuẩn bị và chỉ dẫn thực hiện.</p></div>
      <label className="module-field"><span>Thiết bị</span><input aria-label="Thiết bị" value={form.equipment} onChange={(event) => change('equipment', event.target.value)} placeholder="Phân cách bằng dấu phẩy" /></label>
      <label className="module-field"><span>Kỹ thuật</span><textarea aria-label="Kỹ thuật" placeholder="Mô tả cách thực hiện đúng..." value={form.technique} onChange={(event) => change('technique', event.target.value)} /></label>
    </section>
    <ExerciseVideoFields videos={form.videos} onChange={(videos) => setForm((current) => ({ ...current, videos }))} onUploadingChange={setUploading} />
  </div></FormModal>;
}
