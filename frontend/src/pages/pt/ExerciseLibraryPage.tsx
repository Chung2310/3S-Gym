import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import DataList, { type DataColumn } from '../../components/ui/DataList';
import Pagination from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

// Components (mảnh UI)
import ExerciseFilter from '../../components/exercises/ExerciseFilter';
import ExerciseFormModal, { type Exercise } from '../../components/exercises/ExerciseFormModal';

export default function ExerciseLibraryPage() {
  const toast = useToast();

  // === STATE ===
  const [items, setItems] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [muscleGroup, setMuscleGroup] = useState('');
  const [level, setLevel] = useState('');
  const [formExercise, setFormExercise] = useState<Exercise | null | undefined>(undefined);

  // === DATA FETCHING ===
  const load = useCallback(async (page = 1) => {
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (muscleGroup) query.set('muscleGroup', muscleGroup);
    if (level) query.set('level', level);
    try {
      const result = await api.get<Exercise[]>(`/api/exercises?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [level, muscleGroup, toast]);

  useEffect(() => { void load(); }, [load]);

  const columns: DataColumn<Exercise>[] = [
    { key: 'name', label: 'Bài tập' },
    { key: 'muscleGroup', label: 'Nhóm cơ' },
    { key: 'level', label: 'Cấp độ' },
    { key: 'scope', label: 'Phạm vi' },
  ];

  // === LẮP RÁP COMPONENTS ===
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Thư viện bài tập</h1>
          <p>Bài global và bài private của PT.</p>
        </div>
        <button className="button button-primary" onClick={() => setFormExercise(null)}>
          <Plus size={18} /> Tạo bài tập
        </button>
      </div>

      <div className="panel">
        <ExerciseFilter
          muscleGroup={muscleGroup}
          level={level}
          onMuscleGroupChange={setMuscleGroup}
          onLevelChange={setLevel}
          onFilter={() => void load()}
          onClear={() => { setMuscleGroup(''); setLevel(''); }}
        />

        <DataList
          items={items}
          columns={columns}
          renderActions={(item) => (item.scope === 'PRIVATE' ? (
            <button className="text-button" onClick={() => setFormExercise(item)}>Sửa</button>
          ) : null)}
        />

        <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
      </div>

      <ExerciseFormModal
        open={formExercise !== undefined}
        exercise={formExercise}
        onClose={() => setFormExercise(undefined)}
        onSaved={() => { setFormExercise(undefined); void load(meta.page || 1); }}
      />
    </section>
  );
}
