import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dumbbell, Filter, RotateCcw, Search } from 'lucide-react';
import Pagination from '../ui/Pagination';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import WorkoutTemplateCard from './WorkoutTemplateCard';
import type { TrackingPrescription, TrackingType } from '../../types';

export interface WorkoutTemplate {
  [key: string]: unknown;
  _id: string;
  title: string;
  goal: string;
  level: string;
  version: number;
  status: 'ACTIVE' | 'ARCHIVED';
  sessions: Array<{
    name: string;
    exercises: Array<{ exerciseId?: string; name: string; trackingType?: TrackingType; prescription?: TrackingPrescription; sets?: number; reps?: string; weight?: string; rpe?: number; rir?: number; tempo?: string; restSeconds?: number; notes?: string }>;
  }>;
  durationDays?: number;
  muscleGroups?: string[];
  defaultSets?: number;
  defaultReps?: string;
  defaultWeight?: string;
  defaultTempo?: string;
  technicalNotes?: string;
  scheduledExercises?: Array<Record<string, unknown>>;
  unscheduledExercises?: Array<Record<string, unknown>>;
}

interface Props {
  refreshKey: number;
  onEdit: (template: WorkoutTemplate) => void;
  onAssign?: (template: WorkoutTemplate) => void;
}

export default function WorkoutTemplateList({ refreshKey, onEdit, onAssign }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<WorkoutTemplate[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) query.set('status', status);
      const result = await api.get<WorkoutTemplate[]>(`/api/workout-templates?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const archive = async (item: WorkoutTemplate) => {
    try {
      const result = await api.patch(`/api/workout-templates/${item._id}/archive`);
      toast.success(result.message);
      void load(meta.page);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (item: WorkoutTemplate) => {
    try {
      const result = await api.delete(`/api/workout-templates/${item._id}`);
      toast.success(result.message);
      void load(meta.page);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const visibleItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    if (!keyword) return items;
    return items.filter((item) => `${item.title} ${item.goal}`.toLocaleLowerCase('vi').includes(keyword));
  }, [items, search]);

  return (
    <section className="space-y-4" aria-labelledby="workout-template-list-title">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(0,59,112,0.04)] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="workout-template-list-title" className="flex items-center gap-2 font-oswald text-xl font-bold uppercase text-primary"><Filter size={18} className="text-secondary" /> Tìm giáo án</h2>
          <p className="mt-1 font-montserrat text-xs text-slate-500">Tìm nhanh theo tên, mục tiêu hoặc trạng thái sử dụng.</p>
        </div>
          {(status || search) && <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary" onClick={() => { setStatus(''); setSearch(''); }}><RotateCcw size={13} /> Xóa bộ lọc</button>}
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]">
          <label className="relative block">
            <span className="sr-only">Tìm giáo án</span>
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input aria-label="Tìm giáo án" placeholder="Tìm theo tên hoặc mục tiêu giáo án..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-montserrat text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus-visible:border-secondary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-secondary/20" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-montserrat text-sm text-slate-700 outline-none transition focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/20"
            aria-label="Trạng thái giáo án"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang dùng</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div aria-label="Đang tải giáo án" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 motion-reduce:animate-none"><div className="h-4 w-24 rounded bg-slate-100" /><div className="mt-4 h-6 w-3/4 rounded bg-slate-200" /><div className="mt-8 h-20 rounded bg-slate-100" /></div>)}</div>
      ) : visibleItems.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => <WorkoutTemplateCard key={item._id} template={item} onEdit={onEdit} onAssign={onAssign} onArchive={(value) => void archive(value)} onDelete={(value) => void remove(value)} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center font-montserrat"><Dumbbell className="mx-auto mb-3 text-slate-300" size={30} /><h3 className="font-oswald text-lg font-bold uppercase text-primary">{search || status ? 'Không tìm thấy giáo án phù hợp' : 'Chưa có giáo án nào'}</h3><p className="mt-2 text-sm text-slate-500">{search || status ? 'Thử đổi từ khóa hoặc xóa bộ lọc hiện tại.' : 'Hãy tạo giáo án đầu tiên để bắt đầu xây dựng thư viện.'}</p></div>
      )}
      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
    </section>
  );
}
