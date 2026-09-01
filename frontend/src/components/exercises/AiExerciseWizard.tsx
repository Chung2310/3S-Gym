import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import FormModal from '../ui/FormModal';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import {
  errorMessage,
  type AiExerciseDraft,
  type AiExerciseGenerationMode,
  type AiExerciseGenerationRequest,
  type ClassifiedTrackingType,
  type Exercise,
} from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface RequestForm {
  mode: AiExerciseGenerationMode;
  muscleGroup: string;
  level: Exercise['level'];
  defaultTrackingType: ClassifiedTrackingType;
  equipment: string;
  quantity: number;
  additionalRequest: string;
}

const initialRequest: RequestForm = {
  mode: 'SINGLE', muscleGroup: '', level: 'BEGINNER', defaultTrackingType: 'STRENGTH',
  equipment: '', quantity: 1, additionalRequest: '',
};

const trackingOptions: Array<{ value: ClassifiedTrackingType; label: string }> = [
  { value: 'STRENGTH', label: 'Sức mạnh · mức tạ' },
  { value: 'BODYWEIGHT', label: 'Trọng lượng cơ thể' },
  { value: 'CARDIO', label: 'Cardio · quãng đường/thời gian' },
  { value: 'INTERVAL', label: 'Interval · hiệp làm/nghỉ' },
  { value: 'MOBILITY', label: 'Mobility · thời lượng/biên độ' },
];

const arrayFields = ['equipment', 'commonMistakes', 'contraindications', 'variants'] as const;
type ArrayField = typeof arrayFields[number];

function lines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function isValidDraft(draft: AiExerciseDraft): boolean {
  return Boolean(draft.name.trim() && draft.muscleGroup.trim() && draft.level && draft.defaultTrackingType);
}

export default function AiExerciseWizard({ open, onClose, onSaved }: Props) {
  const toast = useToast();
  const [request, setRequest] = useState<RequestForm>(initialRequest);
  const [drafts, setDrafts] = useState<AiExerciseDraft[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'CONFIG' | 'REVIEW'>('CONFIG');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discardedCount, setDiscardedCount] = useState(0);

  const reset = () => {
    setRequest(initialRequest);
    setDrafts([]);
    setSelected(new Set());
    setStep('CONFIG');
    setError('');
    setDiscardedCount(0);
  };

  const close = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const changeMode = (mode: AiExerciseGenerationMode) => {
    setRequest((current) => ({ ...current, mode, quantity: mode === 'SINGLE' ? 1 : 2 }));
  };

  const generate = async () => {
    if (!request.muscleGroup.trim()) {
      setError('Vui lòng nhập nhóm cơ.');
      return;
    }
    if (request.mode === 'BATCH' && (!Number.isInteger(request.quantity) || request.quantity < 2 || request.quantity > 10)) {
      setError('Số lượng phải từ 2 đến 10.');
      return;
    }
    const payload: AiExerciseGenerationRequest = {
      ...request,
      muscleGroup: request.muscleGroup.trim(),
      equipment: request.equipment.split(',').map((item) => item.trim()).filter(Boolean),
      quantity: request.mode === 'SINGLE' ? 1 : request.quantity,
      additionalRequest: request.additionalRequest.trim(),
    };
    setLoading(true);
    setError('');
    try {
      const result = await api.post<{ drafts: AiExerciseDraft[]; discardedCount: number }>('/api/ai/exercise-generations', payload);
      setDrafts(result.data.drafts);
      setSelected(new Set(result.data.drafts.map((_, index) => index)));
      setDiscardedCount(result.data.discardedCount);
      setStep('REVIEW');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = <K extends keyof AiExerciseDraft>(index: number, key: K, value: AiExerciseDraft[K]) => {
    setDrafts((current) => current.map((draft, position) => position === index ? { ...draft, [key]: value } : draft));
  };

  const toggle = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectedDrafts = drafts.filter((draft, index) => selected.has(index) && isValidDraft(draft));
  const selectedInvalid = drafts.some((draft, index) => selected.has(index) && !isValidDraft(draft));

  const save = async () => {
    if (!selected.size) {
      setError('Vui lòng chọn ít nhất một bài tập.');
      return;
    }
    if (selectedInvalid) {
      setError('Vui lòng điền đủ tên, nhóm cơ, cấp độ và cách ghi nhận cho các bài đã chọn.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.post<AiExerciseDraft[]>('/api/exercises/bulk', { exercises: selectedDrafts });
      toast.success(result.message);
      reset();
      onSaved();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (step === 'CONFIG') void generate();
    else void save();
  };

  const saveLabel = `Lưu ${selected.size} bài tập`;

  return (
    <FormModal
      open={open}
      title="Tạo bài tập bằng AI"
      description="AI tạo bản nháp để bạn kiểm tra và chỉnh sửa trước khi lưu."
      size="xl"
      className="max-h-[94vh] overflow-hidden"
      dirty={Boolean(request.muscleGroup || request.equipment || request.additionalRequest || drafts.length)}
      loading={loading}
      submitLabel={step === 'CONFIG' ? 'Tạo bản nháp' : saveLabel}
      submitDisabled={step === 'REVIEW' && (!selected.size || selectedInvalid)}
      onClose={close}
      onSubmit={submit}
    >
      <ol className="mb-5 grid grid-cols-2 gap-2" aria-label="Tiến trình tạo bài tập AI">
        {['Cấu hình', 'Duyệt & lưu'].map((label, index) => {
          const active = step === (index === 0 ? 'CONFIG' : 'REVIEW');
          return <li key={label} aria-current={active ? 'step' : undefined} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${active ? 'border-sky-500 bg-sky-50 text-primary' : 'border-slate-200 text-slate-500'}`}><span className="flex size-6 items-center justify-center rounded-full bg-white text-xs">{index + 1}</span>{label}</li>;
        })}
      </ol>

      {step === 'CONFIG' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="module-field"><span>Chế độ tạo</span><select aria-label="Chế độ tạo" value={request.mode} disabled={loading} onChange={(event) => changeMode(event.target.value as AiExerciseGenerationMode)}><option value="SINGLE">Một bài tập</option><option value="BATCH">Nhiều bài tập</option></select></label>
          <label className="module-field"><span>Nhóm cơ</span><input aria-label="Nhóm cơ" placeholder="Ví dụ: Lưng, chân hoặc toàn thân" value={request.muscleGroup} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, muscleGroup: event.target.value }))} required /></label>
          <label className="module-field"><span>Cấp độ</span><select aria-label="Cấp độ" value={request.level} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, level: event.target.value as Exercise['level'] }))}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
          <label className="module-field"><span>Cách ghi nhận</span><select aria-label="Cách ghi nhận" value={request.defaultTrackingType} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, defaultTrackingType: event.target.value as ClassifiedTrackingType }))}>{trackingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="module-field"><span>Thiết bị</span><input aria-label="Thiết bị" placeholder="Ví dụ: Cáp, tạ đơn; phân cách bằng dấu phẩy" value={request.equipment} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, equipment: event.target.value }))} /></label>
          {request.mode === 'BATCH' && <label className="module-field"><span>Số lượng</span><input aria-label="Số lượng" type="number" placeholder="Từ 2 đến 10" value={request.quantity} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label>}
          <label className="module-field md:col-span-2"><span>Yêu cầu thêm</span><textarea aria-label="Yêu cầu thêm" placeholder="Ví dụ: ưu tiên bài dễ hướng dẫn cho người mới..." value={request.additionalRequest} disabled={loading} onChange={(event) => setRequest((current) => ({ ...current, additionalRequest: event.target.value }))} /></label>
          <div className="md:col-span-2 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700"><Sparkles className="mt-0.5 shrink-0 text-sky-600" size={18} /><p>Video không do AI tạo. Bạn có thể bổ sung video đã xác minh sau khi lưu bài tập.</p></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="button button-secondary" disabled={loading} onClick={() => { setError(''); setStep('CONFIG'); }}><ArrowLeft size={16} /> Quay lại cấu hình</button>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={selected.size === drafts.length && drafts.length > 0} onChange={(event) => setSelected(event.target.checked ? new Set(drafts.map((_, index) => index)) : new Set())} /> Chọn tất cả</label>
          </div>
          {discardedCount > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">AI có {discardedCount} kết quả không hợp lệ đã được loại bỏ.</p>}
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <section key={index} className={`rounded-2xl border p-4 transition-colors ${selected.has(index) ? 'border-sky-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
                <header className="mb-4 flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 font-bold text-primary"><input aria-label={`Chọn bài tập ${index + 1}`} type="checkbox" checked={selected.has(index)} onChange={() => toggle(index)} /> Bài tập {index + 1}</label>{selected.has(index) && <Check className="text-emerald-600" size={18} aria-hidden="true" />}</header>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="module-field"><span>Tên bài tập</span><input aria-label={`Tên bài tập ${index + 1}`} placeholder="Nhập tên bài tập" value={draft.name} onChange={(event) => updateDraft(index, 'name', event.target.value)} /></label>
                  <label className="module-field"><span>Nhóm cơ</span><input aria-label={`Nhóm cơ ${index + 1}`} placeholder="Nhập nhóm cơ" value={draft.muscleGroup} onChange={(event) => updateDraft(index, 'muscleGroup', event.target.value)} /></label>
                  <label className="module-field"><span>Cấp độ</span><select aria-label={`Cấp độ ${index + 1}`} value={draft.level} onChange={(event) => updateDraft(index, 'level', event.target.value as Exercise['level'])}><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label>
                  <label className="module-field"><span>Cách ghi nhận</span><select aria-label={`Cách ghi nhận ${index + 1}`} value={draft.defaultTrackingType} onChange={(event) => updateDraft(index, 'defaultTrackingType', event.target.value as ClassifiedTrackingType)}>{trackingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="module-field md:col-span-2"><span>Thiết bị, mỗi dòng một mục</span><textarea aria-label={`Thiết bị ${index + 1}`} placeholder="Ví dụ: Tạ đơn" value={draft.equipment.join('\n')} onChange={(event) => updateDraft(index, 'equipment', lines(event.target.value))} /></label>
                  <label className="module-field md:col-span-2"><span>Mô tả</span><textarea aria-label={`Mô tả ${index + 1}`} placeholder="Mô tả mục đích bài tập" value={draft.description} onChange={(event) => updateDraft(index, 'description', event.target.value)} /></label>
                  <label className="module-field md:col-span-2"><span>Kỹ thuật</span><textarea aria-label={`Kỹ thuật ${index + 1}`} placeholder="Hướng dẫn kỹ thuật chính" value={draft.technique} onChange={(event) => updateDraft(index, 'technique', event.target.value)} /></label>
                  {arrayFields.filter((field) => field !== 'equipment').map((field) => {
                    const labels: Record<Exclude<ArrayField, 'equipment'>, string> = { commonMistakes: 'Lỗi thường gặp', contraindications: 'Chống chỉ định', variants: 'Biến thể' };
                    return <label className="module-field" key={field}><span>{labels[field]}</span><textarea aria-label={`${labels[field]} ${index + 1}`} placeholder="Mỗi dòng một mục" value={draft[field].join('\n')} onChange={(event) => updateDraft(index, field, lines(event.target.value))} /></label>;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
    </FormModal>
  );
}
