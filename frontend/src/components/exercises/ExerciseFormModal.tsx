import { useEffect, useState, type FormEvent } from 'react';
import FormModal from '../ui/FormModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';
import type { Exercise, TrackingType } from '../../types';
import ExerciseVideoFields, { type ExerciseVideo } from './ExerciseVideoFields';

interface ExerciseFormModalProps { open: boolean; exercise?: Exercise | null; onClose: () => void; onSaved: () => void }
interface ExerciseFormState { name: string; muscleGroup: string; level: Exercise['level']; defaultTrackingType: TrackingType | ''; equipment: string; technique: string; videos: ExerciseVideo[]; scope: Exercise['scope'] }
const emptyForm: ExerciseFormState = { name: '', muscleGroup: '', level: 'BEGINNER', defaultTrackingType: '', equipment: '', technique: '', videos: [], scope: 'PRIVATE' };

export default function ExerciseFormModal({ open, exercise, onClose, onSaved }: ExerciseFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!open) return;
    setUploading(false);
    setForm(exercise ? { name: exercise.name, muscleGroup: exercise.muscleGroup, level: exercise.level, defaultTrackingType: exercise.defaultTrackingType ?? '', equipment: exercise.equipment?.join(', ') ?? '', technique: exercise.technique ?? '', videos: exercise.videos ?? [], scope: exercise.scope } : { ...emptyForm, videos: [] });
  }, [exercise, open]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (uploading) return;
    const body = { name: form.name, muscleGroup: form.muscleGroup, level: form.level, defaultTrackingType: form.defaultTrackingType, equipment: form.equipment.split(',').map((item) => item.trim()).filter(Boolean), technique: form.technique, videos: form.videos };
    try {
      const result = exercise ? await api.patch(`/api/exercises/${exercise._id}`, body) : await api.post('/api/exercises', { ...body, scope: form.scope });
      toast.success(result.message);
      onSaved();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };
  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  return <FormModal open={open} title={exercise ? 'Sửa bài tập' : 'Tạo bài tập'} dirty={Object.values(form).some(Boolean)} loading={loading || uploading} submitLabel="Lưu bài tập" onClose={onClose} onSubmit={submit}><div className="form-grid">
    <label className="field"><span>Tên bài tập</span><input aria-label="Tên bài tập" placeholder="Ví dụ: Barbell Squat" value={form.name} onChange={(event) => change('name', event.target.value)} required /></label>
    <label className="field"><span>Nhóm cơ</span><input aria-label="Nhóm cơ" placeholder="Ví dụ: Chân" value={form.muscleGroup} onChange={(event) => change('muscleGroup', event.target.value)} required /></label>
    <label className="field"><span>Cấp độ</span><select aria-label="Cấp độ" value={form.level} onChange={(event) => change('level', event.target.value)}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
    <label className="field"><span>Cách ghi nhận</span><select aria-label="Cách ghi nhận" value={form.defaultTrackingType} onChange={(event) => change('defaultTrackingType', event.target.value)} required><option value="" disabled>Chọn cách ghi nhận...</option><option value="STRENGTH">Sức mạnh · mức tạ</option><option value="BODYWEIGHT">Trọng lượng cơ thể</option><option value="CARDIO">Cardio · quãng đường/thời gian</option><option value="INTERVAL">Interval · hiệp làm/nghỉ</option><option value="MOBILITY">Mobility · thời lượng/biên độ</option></select></label>
    {!exercise && <label className="field"><span>Phạm vi</span><select aria-label="Phạm vi" value={form.scope} onChange={(event) => change('scope', event.target.value)}><option value="PRIVATE">Riêng tư</option><option value="GLOBAL">Dùng chung</option></select></label>}
    <label className="field"><span>Thiết bị</span><input aria-label="Thiết bị" value={form.equipment} onChange={(event) => change('equipment', event.target.value)} placeholder="Phân cách bằng dấu phẩy" /></label>
    <label className="field"><span>Kỹ thuật</span><textarea aria-label="Kỹ thuật" placeholder="Mô tả cách thực hiện đúng..." value={form.technique} onChange={(event) => change('technique', event.target.value)} /></label>
  </div><ExerciseVideoFields videos={form.videos} onChange={(videos) => setForm((current) => ({ ...current, videos }))} onUploadingChange={setUploading} /></FormModal>;
}
