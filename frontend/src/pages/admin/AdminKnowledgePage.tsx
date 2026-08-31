import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/ToastProvider';
import { errorMessage } from '../../types';
import type { KnowledgeDocument } from '../../types/knowledge';

// Components (mảnh UI)
import KnowledgeEditor from '../../components/knowledge/KnowledgeEditor';
import KnowledgeSearch from '../../components/knowledge/KnowledgeSearch';
import KnowledgeDocList from '../../components/knowledge/KnowledgeDocList';

export default function AdminKnowledgePage() {
  const toast = useToast();

  // === STATE ===
  const [items, setItems] = useState<KnowledgeDocument[]>([]);
  const [editor, setEditor] = useState<KnowledgeDocument | null | undefined>(undefined);

  // === DATA FETCHING ===
  const load = useCallback(async () => {
    try {
      setItems((await api.get<KnowledgeDocument[]>('/api/knowledge?page=1&limit=20')).data);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // === ACTION HANDLERS ===
  const handleTogglePublish = async (item: KnowledgeDocument) => {
    try {
      const kind = item.status === 'PUBLISHED' ? 'unpublish' : 'publish';
      const result = await api.patch(`/api/knowledge/${item._id}/${kind}`);
      toast.success(result.message);
      void load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleIndex = async (item: KnowledgeDocument) => {
    try {
      const result = await api.post(`/api/knowledge/${item._id}/index`, {});
      toast.success(result.message);
      void load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleSeedStandard = async () => {
    try {
      const result = await api.post('/api/knowledge/seed-standard', {});
      toast.success(result.message || 'Đã nạp trọn bộ 10 tri thức chuẩn 3S-Gym!');
      void load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  // === LẮP RÁP COMPONENTS ===
  return (
    <section>
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ color: '#003b70', margin: 0 }}>Kho tri thức</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="button button-secondary"
            onClick={handleSeedStandard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.86rem',
              background: '#f0fdf4',
              color: '#15803d',
              borderColor: '#bbf7d0',
            }}
          >
            ⚡ Nạp 10 Tri thức Chuẩn 3S-Gym
          </button>
          <button className="button button-primary" onClick={() => setEditor(null)}>
            Tạo tài liệu
          </button>
        </div>
      </div>

      {editor !== undefined && (
        <KnowledgeEditor
          document={editor}
          onCancel={() => setEditor(undefined)}
          onSaved={() => { setEditor(undefined); void load(); }}
        />
      )}

      <KnowledgeSearch />

      <KnowledgeDocList
        items={items}
        onEdit={(item) => setEditor(item)}
        onTogglePublish={handleTogglePublish}
        onIndex={handleIndex}
      />
    </section>
  );
}
