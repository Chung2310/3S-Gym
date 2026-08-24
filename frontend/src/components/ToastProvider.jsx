/* eslint-disable react/only-export-components -- Provider và hook tạo thành một API component thống nhất. */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const remove = useCallback((id) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const show = useCallback((type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((current) => [...current, { id, type, message }]);
    window.setTimeout(() => remove(id), 4000);
  }, [remove]);
  const value = useMemo(() => ({ success: (message) => show('success', message), error: (message) => show('error', message), info: (message) => show('info', message) }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => {
          const Icon = icons[item.type];
          return <div className={`toast toast-${item.type}`} key={item.id}><Icon size={20} /><span>{item.message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => remove(item.id)}><X size={16} /></button></div>;
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được sử dụng bên trong ToastProvider.');
  return context;
}
