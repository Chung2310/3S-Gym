import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, Sparkles, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/ToastProvider';
import RoadmapForm, { type Roadmap } from '../../components/roadmap/RoadmapForm';
import RoadmapTimeline from '../../components/roadmap/RoadmapTimeline';
import { api } from '../../services/api';
import type { PaginationMeta } from '../../types';
import { errorMessage } from '../../types';

export default function RoadmapPage() {
  const toast = useToast();
  const [items, setItems] = useState<Roadmap[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Roadmap | null>(null);
  const [publishing, setPublishing] = useState<Roadmap | null>(null);
  const [deleting, setDeleting] = useState<Roadmap | null>(null);

  const load = useCallback(
    async (page = 1) => {
      try {
        const result = await api.get<Roadmap[]>(`/api/roadmaps?page=${page}&limit=20`);
        setItems(result.data);
        if (result.meta) setMeta(result.meta);
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    [toast]
  );

  useEffect(() => {
    void load();
  }, [load]);

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

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const result = await api.delete(`/api/roadmaps/${deleting._id}`);
      toast.success(result.message || 'Đã xóa roadmap.');
      setDeleting(null);
      await load(meta.page || 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={24} color="var(--secondary-color)" /> Quản lý Lộ trình (Roadmap)
          </h1>
          <p>Lộ trình huấn luyện khoa học theo Phase & Checkpoints kết hợp InBody và Mục tiêu học viên.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Tạo roadmap
        </button>
      </div>

      {(showForm || editingItem) && (
        <RoadmapForm
          initialData={editingItem}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingItem(null);
            void load();
          }}
        />
      )}

      <div className="customer-content-grid" style={{ marginTop: '20px' }}>
        {items.length ? (
          items.map((item) => (
            <article className="panel" key={item._id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StatusBadge status={item.status} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  Phiên bản {item.version}
                </span>
              </div>

              <h2 style={{ margin: '4px 0 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                {item.title}
              </h2>

              <RoadmapTimeline roadmap={item} />

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="button button-secondary"
                  onClick={() => setPublishing(item)}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {item.status === 'PUBLISHED' ? 'Gỡ công bố' : 'Công bố roadmap'}
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setEditingItem(item);
                      setShowForm(false);
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Chỉnh sửa roadmap"
                  >
                    <Edit3 size={14} /> Sửa
                  </button>
                  {item.status !== 'PUBLISHED' && (
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setDeleting(item)}
                      style={{ fontSize: '0.8rem', padding: '6px 10px', color: '#ef4444', borderColor: '#fca5a5' }}
                      title="Xóa roadmap"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Chưa có roadmap nào được tạo. Nhấn "Tạo roadmap" để bắt đầu!</div>
        )}
      </div>

      <Pagination page={meta.page || 1} totalPages={meta.totalPages || 0} onPageChange={load} />

      <ConfirmModal
        open={Boolean(publishing)}
        title={publishing?.status === 'PUBLISHED' ? 'Gỡ công bố roadmap?' : 'Công bố roadmap?'}
        description="Chỉ nội dung đã công bố mới được phép hiển thị cho học viên trên ứng dụng."
        onClose={() => setPublishing(null)}
        onConfirm={changePublication}
      />

      <ConfirmModal
        open={Boolean(deleting)}
        title="Xác nhận xóa roadmap?"
        description={`Bạn có chắc chắn muốn xóa "${deleting?.title}"? Thao tác này không thể hoàn tác.`}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
