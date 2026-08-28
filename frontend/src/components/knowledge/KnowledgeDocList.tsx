import type { KnowledgeDocument } from '../../types/knowledge';
import StatusBadge from '../ui/StatusBadge';

interface KnowledgeDocListProps {
  items: KnowledgeDocument[];
  onEdit: (item: KnowledgeDocument) => void;
  onTogglePublish: (item: KnowledgeDocument) => void;
  onIndex: (item: KnowledgeDocument) => void;
}

export default function KnowledgeDocList({ items, onEdit, onTogglePublish, onIndex }: KnowledgeDocListProps) {
  return (
    <section className="panel">
      {items.length > 0 ? (
        items.map((item) => (
          <article id={`knowledge-${item._id}`} className="published-card" key={item._id}>
            <h2>{item.title}</h2>
            <p>
              {item.topic} · v{item.version} · <StatusBadge status={item.status} />
            </p>
            <div className="inline-actions">
              <button className="text-button" onClick={() => onEdit(item)}>
                Sửa
              </button>
              <button className="text-button" onClick={() => onTogglePublish(item)}>
                {item.status === 'PUBLISHED' ? 'Thu hồi' : 'Xuất bản'}
              </button>
              <button
                className="text-button"
                aria-label={`Index ${item.title}`}
                disabled={item.status !== 'PUBLISHED'}
                onClick={() => onIndex(item)}
              >
                Index
              </button>
            </div>
          </article>
        ))
      ) : (
        <div className="empty-state">Chưa có tài liệu nào.</div>
      )}
    </section>
  );
}
