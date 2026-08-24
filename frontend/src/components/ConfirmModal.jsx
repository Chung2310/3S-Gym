import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ open, title, description, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', danger = false, loading = false, onConfirm, onClose, children }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <button className="icon-button modal-close" type="button" aria-label="Đóng" onClick={onClose}><X size={20} /></button>
        <div className={`confirm-modal-icon ${danger ? 'danger' : ''}`}><AlertTriangle size={24} /></div>
        <h2 id="confirm-modal-title">{title}</h2>
        {description && <p>{description}</p>}
        {children}
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={loading}>{cancelLabel}</button>
          <button className={`button ${danger ? 'button-danger' : 'button-primary'}`} type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
