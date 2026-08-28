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

  // === LẮP RÁP COMPONENTS ===
  return (
    <section>
      <div className="section-header">
        <div>
          <h1>Kho tri thức</h1>
          <p>Tài liệu đã duyệt dùng làm nguồn trích dẫn cho PT Assistant.</p>
        </div>
        <button className="button button-primary" onClick={() => setEditor(null)}>
          Tạo tài liệu
        </button>
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
