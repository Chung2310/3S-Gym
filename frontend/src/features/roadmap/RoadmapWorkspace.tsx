import { useCallback, useEffect, useState } from 'react';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/ToastProvider';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';
import RoadmapForm, { type Roadmap } from './RoadmapForm';
import RoadmapTimeline from './RoadmapTimeline';

export default function RoadmapWorkspace() {
  const toast = useToast();
  const [items, setItems] = useState<Roadmap[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [showForm, setShowForm] = useState(false);
  const [publishing, setPublishing] = useState<Roadmap | null>(null);
  const load = useCallback(async (page = 1) => {
    try {
      const result = await api.get<Roadmap[]>(`/api/roadmaps?page=${page}&limit=20`);
      setItems(result.data);
      if (result.meta) setMeta(result.meta);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [toast]);
  useEffect(() => { void load(); }, [load]);
  const changePublication = async () => {
    if (!publishing) return;
    try {
      const action = publishing.status === 'PUBLISHED' ? 'unpublish' : 'publish';
      const result = await api.patch(`/api/roadmaps/${publishing._id}/${action}`);
      toast.success(result.message);
      setPublishing(null);
      await load(meta.page || 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return <section><div className="section-header"><div><h1>Roadmap</h1><p>Lộ trình theo phase; phiên bản cũ chỉ dùng để tham chiếu.</p></div><button className="button button-primary" onClick={() => setShowForm(true)}>Tạo roadmap</button></div>
    {showForm && <RoadmapForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
    <div className="customer-content-grid">{items.length ? items.map((item) => <article className="panel" key={item._id}><StatusBadge status={item.status} /><h2>{item.title}</h2><p>Phiên bản {item.version}</p><RoadmapTimeline roadmap={item} /><button className="button button-secondary" onClick={() => setPublishing(item)}>{item.status === 'PUBLISHED' ? 'Gỡ công bố' : 'Công bố roadmap'}</button></article>) : <div className="empty-state">Chưa có roadmap.</div>}</div>
    <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />
    <ConfirmModal open={Boolean(publishing)} title={publishing?.status === 'PUBLISHED' ? 'Gỡ công bố roadmap?' : 'Công bố roadmap?'} description="Chỉ nội dung đã công bố mới được phép hiển thị cho khách hàng khi backend hỗ trợ contract tương ứng." onClose={() => setPublishing(null)} onConfirm={changePublication} />
  </section>;
}
