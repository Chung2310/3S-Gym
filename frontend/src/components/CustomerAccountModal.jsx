import { useEffect, useMemo, useState } from 'react';
import FormField from './FormField';
import FormModal from './FormModal';
import { useToast } from './ToastProvider';
import { api } from '../services/api';

export default function CustomerAccountModal({ open, customer, onClose, onSaved }) {
  const toast = useToast();
  const initial = useMemo(() => ({ username: '', password: '', email: customer?.email || '' }), [customer]);
  const [form, setForm] = useState(initial);
  useEffect(() => { if (open) setForm(initial); }, [open, initial]);
  const submit = async (event) => { event.preventDefault(); try { const result = await api.post(`/api/customers/${customer._id}/account`, form); toast.success(result.message); onSaved(result.data); } catch (error) { toast.error(error.message); } };
  if (!customer) return null;
  return <FormModal open={open} title={`Cấp tài khoản cho ${customer.fullName}`} description="Khách chỉ có quyền xem nội dung đã công bố." dirty={JSON.stringify(form) !== JSON.stringify(initial)} onClose={onClose} onSubmit={submit} submitLabel="Cấp tài khoản">
    <section className="profile-form-section"><div className="profile-form-grid"><FormField label="Tên đăng nhập" name="customerUsername" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /><FormField label="Mật khẩu ban đầu" name="customerPassword" type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><FormField label="Email" name="customerEmail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></section>
  </FormModal>;
}
