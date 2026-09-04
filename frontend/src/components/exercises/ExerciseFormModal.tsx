import { useEffect, useState, type FormEvent } from 'react';
import FormModal from '../ui/FormModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { errorMessage, type Exercise, type TrackingType } from '../../types';
import ExerciseVideoFields, { type ExerciseVideo } from './ExerciseVideoFields';

interface ExerciseFormModalProps {
  open: boolean;
  exercise?: Exercise | null;
  muscleGroups?: string[];
  onClose: () => void;
  onSaved: () => void;
  onMuscleGroupCreated?: (name: string) => void;
}

interface ExerciseFormState {
  name: string;
  muscleGroup: string;
  level: Exercise['level'];
  defaultTrackingType: TrackingType | '';
  equipment: string;
  technique: string;
  videos: ExerciseVideo[];
}

const DEFAULT_FALLBACK_GROUPS = [
  'Ngực',
  'Lưng',
  'Vai',
  'Tay trước',
  'Tay sau',
  'Chân',
  'Mông',
  'Bụng / Core',
  'Toàn thân',
  'Tim mạch / Cardio',
];

const emptyForm: ExerciseFormState = {
  name: '',
  muscleGroup: '',
  level: 'BEGINNER',
  defaultTrackingType: '',
  equipment: '',
  technique: '',
  videos: [],
};

export default function ExerciseFormModal({
  open,
  exercise,
  muscleGroups = [],
  onClose,
  onSaved,
  onMuscleGroupCreated,
}: ExerciseFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUploading(false);
    setIsAddingCustom(false);
    setNewGroupName('');

    const baseList = muscleGroups.length > 0 ? muscleGroups : DEFAULT_FALLBACK_GROUPS;
    const initialExerciseGroup = exercise?.muscleGroup?.trim() || '';
    const merged = Array.from(new Set([...baseList, ...(initialExerciseGroup ? [initialExerciseGroup] : [])]));
    setAvailableGroups(merged);

    setForm(
      exercise
        ? {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            level: exercise.level,
            defaultTrackingType: exercise.defaultTrackingType ?? '',
            equipment: exercise.equipment?.join(', ') ?? '',
            technique: exercise.technique ?? '',
            videos: exercise.videos ?? [],
          }
        : {
            ...emptyForm,
            muscleGroup: merged[0] || '',
            videos: [],
          },
    );
  }, [exercise, muscleGroups, open]);

  const handleAddMuscleGroup = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    setCreatingGroup(true);
    try {
      const res = await api.post<{ name: string }>('/api/exercises/muscle-groups', { name: trimmed });
      const createdName = res.data?.name || trimmed;
      setAvailableGroups((prev) => (prev.includes(createdName) ? prev : [...prev, createdName]));
      change('muscleGroup', createdName);
      onMuscleGroupCreated?.(createdName);
      toast.success(`Đã thêm nhóm cơ "${createdName}".`);
      setIsAddingCustom(false);
      setNewGroupName('');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setCreatingGroup(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    if (uploading) return;
    const body = {
      name: form.name,
      muscleGroup: form.muscleGroup,
      level: form.level,
      defaultTrackingType: form.defaultTrackingType,
      equipment: form.equipment.split(',').map((item) => item.trim()).filter(Boolean),
      technique: form.technique,
      videos: form.videos,
    };
    try {
      const result = exercise
        ? await api.patch(`/api/exercises/${exercise._id}`, body)
        : await api.post('/api/exercises', { ...body, scope: 'GLOBAL' });
      toast.success(result.message);
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const change = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <FormModal
      className="module-modal exercise-form-modal"
      open={open}
      title={exercise ? 'Sửa bài tập' : 'Tạo bài tập'}
      dirty={Object.values(form).some(Boolean)}
      loading={loading || uploading}
      submitLabel="Lưu bài tập"
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="module-form exercise-form">
        <section className="exercise-form-section" aria-labelledby="exercise-form-basics">
          <div className="exercise-form-section-heading">
            <h3 id="exercise-form-basics">Thông tin cơ bản</h3>
          </div>
          <div className="module-field-grid">
            <label className="module-field">
              <span>Tên bài tập</span>
              <input
                aria-label="Tên bài tập"
                placeholder="Ví dụ: Barbell Squat"
                value={form.name}
                onChange={(event) => change('name', event.target.value)}
                required
              />
            </label>
            <div className="module-field exercise-form-muscle-field">
              <div className="exercise-form-muscle-header">
                <span>Nhóm cơ</span>
                {!isAddingCustom && (
                  <button
                    type="button"
                    className="exercise-form-muscle-toggle"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setNewGroupName('');
                    }}
                  >
                    + Thêm nhóm cơ mới
                  </button>
                )}
              </div>
              {isAddingCustom ? (
                <div className="exercise-form-custom-muscle">
                  <input
                    aria-label="Tên nhóm cơ mới"
                    placeholder="Nhập tên nhóm cơ..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddMuscleGroup();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="button button-secondary exercise-form-muscle-btn"
                    disabled={creatingGroup || !newGroupName.trim()}
                    onClick={() => void handleAddMuscleGroup()}
                  >
                    {creatingGroup ? '...' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    className="button button-ghost exercise-form-muscle-btn"
                    disabled={creatingGroup}
                    onClick={() => {
                      setIsAddingCustom(false);
                      setNewGroupName('');
                    }}
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <select
                  aria-label="Nhóm cơ"
                  value={form.muscleGroup}
                  onChange={(event) => {
                    if (event.target.value === '__NEW__') {
                      setIsAddingCustom(true);
                      setNewGroupName('');
                    } else {
                      change('muscleGroup', event.target.value);
                    }
                  }}
                  required
                >
                  <option value="" disabled>Chọn nhóm cơ...</option>
                  {availableGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                  <option value="__NEW__">+ Thêm nhóm cơ mới...</option>
                </select>
              )}
            </div>
            <label className="module-field">
              <span>Cấp độ</span>
              <select
                aria-label="Cấp độ"
                value={form.level}
                onChange={(event) => change('level', event.target.value)}
              >
                <option value="BEGINNER">Cơ bản</option>
                <option value="INTERMEDIATE">Trung cấp</option>
                <option value="ADVANCED">Nâng cao</option>
              </select>
            </label>
            <label className="module-field">
              <span>Cách ghi nhận</span>
              <select
                aria-label="Cách ghi nhận"
                value={form.defaultTrackingType}
                onChange={(event) => change('defaultTrackingType', event.target.value)}
                required
              >
                <option value="" disabled>Chọn cách ghi nhận...</option>
                <option value="STRENGTH">Sức mạnh · mức tạ</option>
                <option value="BODYWEIGHT">Trọng lượng cơ thể</option>
                <option value="CARDIO">Cardio · quãng đường/thời gian</option>
                <option value="INTERVAL">Interval · hiệp làm/nghỉ</option>
                <option value="MOBILITY">Mobility · thời lượng/biên độ</option>
              </select>
            </label>
          </div>
        </section>
        <section className="exercise-form-section" aria-labelledby="exercise-form-technique">
          <div className="exercise-form-section-heading">
            <h3 id="exercise-form-technique">Thiết bị & kỹ thuật</h3>
          </div>
          <label className="module-field">
            <span>Thiết bị</span>
            <input
              aria-label="Thiết bị"
              value={form.equipment}
              onChange={(event) => change('equipment', event.target.value)}
              placeholder="Phân cách bằng dấu phẩy"
            />
          </label>
          <label className="module-field">
            <span>Kỹ thuật</span>
            <textarea
              aria-label="Kỹ thuật"
              placeholder="Mô tả cách thực hiện đúng..."
              value={form.technique}
              onChange={(event) => change('technique', event.target.value)}
            />
          </label>
        </section>
        <ExerciseVideoFields
          videos={form.videos}
          onChange={(videos) => setForm((current) => ({ ...current, videos }))}
          onUploadingChange={setUploading}
        />
      </div>
    </FormModal>
  );
}
