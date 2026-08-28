import { useEffect, useMemo, useState, type FormEvent } from 'react';
import FormField from './FormField';
import FormModal from './FormModal';
import { useToast } from './ToastProvider';
import { api } from '../../services/api';
import { errorMessage } from '../../types';

interface CustomerSummary { _id?: string; fullName?: string; email?: string }
interface CustomerAccountModalProps { open: boolean; customer: CustomerSummary | null; onClose: () => void; onSaved: (data: unknown) => void }
export default function CustomerAccountModal({ open, customer, onClose, onSaved }: CustomerAccountModalProps) {
  const toast = useToast();
  const initial = useMemo(() => ({ username: '', password: '', email: customer?.email || '' }), [customer]);
  const [form, setForm] = useState(initial);
  useEffect(() => { if (open) setForm(initial); }, [open, initial]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!customer?._id) return; try { const result = await api.post(`/api/customers/${customer._id}/account`, form); toast.success(result.message); onSaved(result.data); } catch (error) { toast.error(errorMessage(error)); } };
  if (!customer) return null;
  return <FormModal open={open} title={`Cấp tài khoản cho ${customer.fullName}`} description="Khách chỉ có quyền xem nội dung đã công bố." dirty={JSON.stringify(form) !== JSON.stringify(initial)} onClose={onClose} onSubmit={submit} submitLabel="Cấp tài khoản">
    <section className="profile-form-section"><div className="profile-form-grid"><FormField label="Tên đăng nhập" name="customerUsername" placeholder="Nhập tên đăng nhập (ví dụ: customer_an)..." value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /><FormField label="Mật khẩu ban đầu" name="customerPassword" type="password" minLength={8} placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)..." value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /><FormField label="Email" name="customerEmail" type="email" placeholder="Nhập email nhận tài khoản (ví dụ: an@example.com)..." value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div></section>
  </FormModal>;
}
