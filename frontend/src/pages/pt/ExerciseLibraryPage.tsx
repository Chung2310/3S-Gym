import { useCallback, useEffect, useState } from 'react';
import { Dumbbell, Plus } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

// Components (mảnh UI)
import ExerciseFilter from '../../components/exercises/ExerciseFilter';
import ExerciseFormModal from '../../components/exercises/ExerciseFormModal';
import type { Exercise } from '../../types';
import ExerciseLibraryCard from '../../components/exercises/ExerciseLibraryCard';

export default function ExerciseLibraryPage() {
  const toast = useToast();

  // === STATE ===
  const [items, setItems] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [muscleGroup, setMuscleGroup] = useState('');
  const [level, setLevel] = useState('');
  const [trackingType, setTrackingType] = useState('');
  const [formExercise, setFormExercise] = useState<Exercise | null | undefined>(undefined);
  const [deleteExercise, setDeleteExercise] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  // === DATA FETCHING ===
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (muscleGroup) query.set('muscleGroup', muscleGroup);
    if (level) query.set('level', level);
    if (trackingType) query.set('defaultTrackingType', trackingType);
    try {
      const result = await api.get<Exercise[]>(`/api/exercises?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [level, muscleGroup, toast, trackingType]);

  useEffect(() => { void load(); }, [load]);

  const confirmDelete = async () => {
    if (!deleteExercise) return;
    setDeleting(true);
    try {
      const result = await api.delete(`/api/exercises/${deleteExercise._id}`);
      toast.success(result.message);
      const currentPage = meta.page || 1;
      const targetPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setDeleteExercise(null);
      await load(targetPage);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // === LẮP RÁP COMPONENTS ===
  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(0,59,112,0.05)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 font-montserrat text-xs font-bold uppercase tracking-[0.16em] text-secondary">Workout resources</p>
          <h1 className="font-oswald text-3xl font-bold uppercase text-primary">Thư viện bài tập</h1>
          <p className="mt-2 font-montserrat text-sm text-slate-600">Quản lý bài tập cá nhân và nội dung dùng chung trong một thư viện thống nhất.</p>
        </div>
        <button type="button" className="button button-primary shrink-0" onClick={() => setFormExercise(null)}>
          <Plus size={18} /> Tạo bài tập
        </button>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(0,59,112,0.04)] sm:p-6">
        <ExerciseFilter
          muscleGroup={muscleGroup}
          level={level}
          trackingType={trackingType}
          onMuscleGroupChange={setMuscleGroup}
          onLevelChange={setLevel}
          onTrackingTypeChange={setTrackingType}
          onFilter={() => void load()}
          onClear={() => { setMuscleGroup(''); setLevel(''); setTrackingType(''); }}
        />

      </div>

      {loading ? <div aria-label="Đang tải bài tập" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 motion-reduce:animate-none"><div className="size-10 rounded-xl bg-slate-100" /><div className="mt-4 h-6 w-2/3 rounded bg-slate-200" /><div className="mt-7 h-20 rounded bg-slate-100" /></div>)}</div> : items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <ExerciseLibraryCard key={item._id} exercise={item} onEdit={setFormExercise} onDelete={setDeleteExercise} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center font-montserrat"><Dumbbell className="mx-auto mb-3 text-slate-300" size={30} /><h2 className="font-oswald text-lg font-bold uppercase text-primary">Chưa tìm thấy bài tập</h2><p className="mt-2 text-sm text-slate-500">Thử đổi bộ lọc hoặc tạo bài tập đầu tiên của bạn.</p></div>}
      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />

      <ExerciseFormModal
        open={formExercise !== undefined}
        exercise={formExercise}
        onClose={() => setFormExercise(undefined)}
        onSaved={() => { setFormExercise(undefined); void load(meta.page || 1); }}
      />
      <ConfirmModal
        open={deleteExercise !== null}
        title="Xóa bài tập"
        description={deleteExercise ? `Bạn có chắc muốn xóa “${deleteExercise.name}”? Thao tác này không thể hoàn tác.` : undefined}
        confirmLabel="Xóa bài tập"
        danger
        loading={deleting}
        onClose={() => { if (!deleting) setDeleteExercise(null); }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
