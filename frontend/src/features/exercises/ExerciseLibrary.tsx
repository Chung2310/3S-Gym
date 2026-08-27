import { useCallback, useEffect, useState } from 'react';
import DataList, { type DataColumn } from '../../components/DataList';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import ExerciseFormModal, { type Exercise } from './ExerciseFormModal';

export default function ExerciseLibrary() {
  const toast = useToast();
  const [items, setItems] = useState<Exercise[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [muscleGroup, setMuscleGroup] = useState('');
  const [level, setLevel] = useState('');
  const [formExercise, setFormExercise] = useState<Exercise | null | undefined>(undefined);
  const load = useCallback(async (page = 1) => {
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (muscleGroup) query.set('muscleGroup', muscleGroup);
    if (level) query.set('level', level);
    try {
      const result = await api.get<Exercise[]>(`/api/exercises?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) { toast.error(errorMessage(error)); }
  }, [level, muscleGroup, toast]);
  useEffect(() => { void load(); }, [load]);
  const columns: DataColumn<Exercise>[] = [{ key: 'name', label: 'Bài tập' }, { key: 'muscleGroup', label: 'Nhóm cơ' }, { key: 'level', label: 'Cấp độ' }, { key: 'scope', label: 'Phạm vi' }];
  return <section><div className="section-header"><div><h1>Thư viện bài tập</h1><p>Bài global và bài private của PT.</p></div><button className="button button-primary" onClick={() => setFormExercise(null)}>Tạo bài tập</button></div>
    <div className="filter-bar panel"><label className="field"><span>Nhóm cơ</span><input aria-label="Nhóm cơ" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)} /></label><label className="field"><span>Cấp độ</span><select aria-label="Cấp độ" value={level} onChange={(event) => setLevel(event.target.value)}><option value="">Tất cả</option><option value="BEGINNER">Cơ bản</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option></select></label><button className="button button-secondary" onClick={() => void load()}>Lọc bài tập</button></div>
    <div className="panel"><DataList items={items} columns={columns} renderActions={(item) => item.scope === 'PRIVATE' ? <button className="text-button" onClick={() => setFormExercise(item)}>Sửa</button> : null} /><Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} /></div>
    <ExerciseFormModal open={formExercise !== undefined} exercise={formExercise} onClose={() => setFormExercise(undefined)} onSaved={() => { setFormExercise(undefined); void load(meta.page || 1); }} />
  </section>;
}
