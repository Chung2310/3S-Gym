import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function ProgressModal({ open, title, description, loading, onClose, children }: { open: boolean; title: string; description?: string; loading?: boolean; onClose: () => void; children: ReactNode }) {
  const closeButton = useRef<HTMLButtonElement>(null); const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return; opener.current = document.activeElement as HTMLElement | null; const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; opener.current?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  const titleId = `progress-modal-${title.replace(/\s+/g, '-').toLocaleLowerCase()}`;
  return <div className="modal-backdrop progress-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="progress-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="progress-modal-header"><div><h2 className="progress-modal-title" id={titleId}>{title}</h2>{description && <p className="progress-modal-description">{description}</p>}</div><button ref={closeButton} type="button" className="progress-modal-close" aria-label="Đóng" onClick={onClose}><X size={21} /></button></header>
      <div className="progress-modal-body">{loading ? <div className="progress-modal-loading">Đang tải dữ liệu tiến độ...</div> : children}</div>
    </section>
  </div>;
}
