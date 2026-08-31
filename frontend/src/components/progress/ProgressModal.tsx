import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function ProgressModal({
  open,
  title,
  description,
  loading,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  loading?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl sm:max-h-[94vh] sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-oswald text-2xl font-bold uppercase text-primary" id={titleId}>{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            ref={closeButton}
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500" role="status">
              Đang tải dữ liệu tiến độ...
            </div>
          ) : children}
        </div>
      </section>
    </div>
  );
}
