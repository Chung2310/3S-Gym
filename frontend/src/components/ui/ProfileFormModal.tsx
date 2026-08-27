import { useEffect, useRef, useState, type FormEventHandler, type ReactNode } from 'react';
import { X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export interface ProfileFormModalProps {
  open: boolean; title: string; description?: ReactNode; dirty?: boolean; loading?: boolean;
  submitLabel?: string; onClose: () => void; onSubmit?: FormEventHandler<HTMLFormElement>; children?: ReactNode;
}
export default function ProfileFormModal({ open, title, description, dirty = false, loading = false, submitLabel = 'Lưu', onClose, onSubmit, children }: ProfileFormModalProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (open) setConfirmClose(false); }, [open]);
  const requestClose = () => dirty ? setConfirmClose(true) : onClose();
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const focusable = () => [...(document.querySelector('.profile-form-modal')?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])') || [])];
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); requestCloseRef.current(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); openerRef.current?.focus(); };
  }, [open]);
  if (!open) return null;
  return <><div className="modal-backdrop profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}><section className="profile-form-modal" role="dialog" aria-modal="true" aria-labelledby="profile-form-title"><header className="profile-form-header"><div><h2 id="profile-form-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Đóng" onClick={requestClose}><X size={20} /></button></header><form onSubmit={onSubmit}><div className="profile-form-body">{children}</div><footer className="profile-form-actions"><button type="button" className="button button-secondary" onClick={requestClose} disabled={loading}>Hủy</button><button type="submit" className="button button-primary" disabled={loading}>{loading ? 'Đang lưu...' : submitLabel}</button></footer></form></section></div><ConfirmModal open={confirmClose} title="Bỏ các thay đổi?" description="Các thông tin chưa lưu sẽ bị mất." confirmLabel="Bỏ thay đổi" danger onClose={() => setConfirmClose(false)} onConfirm={onClose} /></>;
}
