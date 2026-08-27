import { useCallback, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import DataList, { type DataColumn } from '../ui/DataList';
import Pagination from '../ui/Pagination';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

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
    exercises: Array<{ exerciseId?: string; name: string; sets?: number; reps?: string; restSeconds?: number }>;
  }>;
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

  const load = useCallback(async (page = 1) => {
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) query.set('status', status);
      const result = await api.get<WorkoutTemplate[]>(`/api/workout-templates?${query}`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
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

  const columns: DataColumn<WorkoutTemplate>[] = [
    { key: 'title', label: 'Giáo án' },
    { key: 'goal', label: 'Mục tiêu' },
    { key: 'level', label: 'Cấp độ' },
    { key: 'version', label: 'Phiên bản', render: (item) => `v${item.version}` },
    { key: 'status', label: 'Trạng thái' },
  ];

  return (
    <section className="panel">
      <div className="section-header" style={{ marginBottom: '14px', alignItems: 'center' }}>
        <div>
          <h2>Giáo án mẫu</h2>
          <p>Chỉnh sửa tạo phiên bản mới; chỉ giáo án đã lưu trữ mới có thể xóa.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="filter-select"
            aria-label="Trạng thái giáo án"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang dùng</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>
          {status && (
            <button
              type="button"
              className="button-filter-reset"
              onClick={() => setStatus('')}
              title="Xóa lọc"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      <DataList
        items={items}
        columns={columns}
        renderActions={(item) => (
          <div className="inline-actions">
            {item.status === 'ACTIVE' ? (
              <>
                {onAssign && <button className="text-button" onClick={() => onAssign(item)}>Gán cho khách</button>}
                <button className="text-button" onClick={() => onEdit(item)}>Sửa</button>
                <button className="text-button" onClick={() => void archive(item)}>Lưu trữ</button>
              </>
            ) : (
              <button className="text-button" onClick={() => void remove(item)}>Xóa</button>
            )}
          </div>
        )}
      />
      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
    </section>
  );
}
