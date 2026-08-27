import { useState, type FormEvent } from 'react';
import { Search, X, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../ui/ToastProvider';
import { errorMessage } from '../../types';

interface SearchResult {
  documentId: string;
  title: string;
  content: string;
  score: number;
}

export default function KnowledgeSearch() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      setLoading(true);
      const result = await api.get<SearchResult[]>(`/api/knowledge/search?q=${encodeURIComponent(query)}`);
      setItems(result.data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <BookOpen size={18} color="var(--secondary-color)" /> Tra cứu kho tri thức
      </h2>
      <form className="filter-bar" onSubmit={search} style={{ marginBottom: '14px' }}>
        <div className="search-field" style={{ maxWidth: '480px' }}>
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            aria-label="Tìm tri thức"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tra cứu bài tập, kỹ thuật, dinh dưỡng, tài liệu..."
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setQuery('');
                setItems([]);
              }}
              aria-label="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button className="button button-primary" type="submit" disabled={!query.trim() || loading}>
          <Search size={15} /> {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {items.length > 0 ? (
        items.map((item) => (
          <article className="published-card" key={item.documentId} style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <a href={`#knowledge-${item.documentId}`} style={{ fontWeight: 700, color: '#003b70' }}>
                {item.title}
              </a>
              <span className="status-badge status-active" title="Độ liên quan">
                {Math.round(item.score * 100)}% khớp
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
              {item.content}
            </p>
          </article>
        ))
      ) : query && !loading ? (
        <div className="empty-state">Không tìm thấy tài liệu phù hợp với "{query}".</div>
      ) : null}
    </section>
  );
}
