import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import FormField from './FormField';
import ProfileFormModal from './ProfileFormModal';
import { useToast } from './ToastProvider';
import { api } from '../services/api';
import { errorMessage } from '../types';

interface PtFormState { avatarUrl: string; fullName: string; dateOfBirth: string; gender: string; phone: string; email: string; address: string; specialization: string; yearsOfExperience: number | string; certificates: string; bio: string; username: string; password: string; status: string }
interface PtRecord extends Partial<Omit<PtFormState, 'certificates'>> { _id?: string; certificates?: string[] | string }
interface PtFormModalProps { open: boolean; pt?: PtRecord | null; onClose: () => void; onSaved: (data: unknown) => void }

const emptyForm = {
  avatarUrl: '', fullName: '', dateOfBirth: '', gender: 'OTHER', phone: '', email: '', address: '',
  specialization: '', yearsOfExperience: 0, certificates: '', bio: '', username: '', password: '', status: 'ACTIVE',
};

function formFromPt(pt?: PtRecord | null): PtFormState {
  if (!pt) return emptyForm;
  return {
    ...emptyForm, ...pt,
    dateOfBirth: pt.dateOfBirth ? String(pt.dateOfBirth).slice(0, 10) : '',
    certificates: Array.isArray(pt.certificates) ? pt.certificates.join('\n') : '',
    password: '',
  };
}

export default function PtFormModal({ open, pt, onClose, onSaved }: PtFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<PtFormState>(emptyForm);
  const [initial, setInitial] = useState<PtFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editing = Boolean(pt?._id);

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const result = await api.upload<{ url: string }>('/api/upload/image', formData);
      setForm((current) => ({ ...current, avatarUrl: result.data.url }));
      toast.success('Tải ảnh đại diện lên Cloudinary thành công!');
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên: ' + errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const next = formFromPt(pt);
    setForm(next);
    setInitial(next);
  }, [open, pt]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const completePayload = {
      ...form,
      role: 'PT',
      yearsOfExperience: Number(form.yearsOfExperience || 0),
      certificates: form.certificates.split('\n').map((value) => value.trim()).filter(Boolean),
    };
    const { password, ...payloadWithoutPassword } = completePayload;
    const payload = editing && !password ? payloadWithoutPassword : { ...payloadWithoutPassword, password };
    try {
      setLoading(true);
      const result = editing ? await api.patch(`/api/users/${pt?._id}`, payload) : await api.post('/api/users', payload);
      toast.success(result.message);
      onSaved(result.data);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  };

  return <ProfileFormModal open={open} title={editing ? 'Sửa PT' : 'Thêm PT'} description="Nhập thông tin hồ sơ và tài khoản huấn luyện viên." dirty={dirty} loading={loading} submitLabel={editing ? 'Lưu thay đổi' : 'Tạo PT'} onClose={onClose} onSubmit={submit}>
            <section className="profile-form-section"><h3>Thông tin cá nhân</h3><div className="profile-form-grid">
              <div className="field">
                <label>Ảnh đại diện</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                  <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg style={{ width: '28px', height: '28px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label htmlFor="avatar-file-upload" className="button button-secondary" style={{ margin: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '36px', padding: '0 0.75rem', fontSize: '0.875rem' }}>
                        {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                      </label>
                      <input id="avatar-file-upload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: 'none' }} />
                      {form.avatarUrl && (
                        <button type="button" className="button button-secondary" style={{ margin: 0, color: '#ef4444', borderColor: '#fee2e2', height: '36px', padding: '0 0.75rem', fontSize: '0.875rem' }} onClick={() => setForm((c) => ({ ...c, avatarUrl: '' }))}>Xóa</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <FormField label="Họ tên" name="fullName" value={form.fullName} onChange={change} required /><FormField label="Ngày sinh" name="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dateOfBirth} onChange={change} /><FormField label="Giới tính" name="gender" as="select" value={form.gender} onChange={change}><option value="OTHER">Khác</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></FormField></div></section>
            <section className="profile-form-section"><h3>Liên hệ</h3><div className="profile-form-grid"><FormField label="Số điện thoại" name="phone" value={form.phone} onChange={change} required /><FormField label="Email" name="email" type="email" value={form.email} onChange={change} /><FormField label="Địa chỉ" name="address" value={form.address} onChange={change} /></div></section>
            <section className="profile-form-section"><h3>Chuyên môn</h3><div className="profile-form-grid"><FormField label="Chuyên môn" name="specialization" value={form.specialization} onChange={change} /><FormField label="Số năm kinh nghiệm" name="yearsOfExperience" type="number" min={0} max={80} step={1} value={form.yearsOfExperience} onChange={change} /><FormField label="Chứng chỉ" name="certificates" as="textarea" rows={3} placeholder="Mỗi chứng chỉ một dòng" value={form.certificates} onChange={change} /><FormField label="Giới thiệu" name="bio" as="textarea" rows={3} maxLength={1000} value={form.bio} onChange={change} /></div></section>
            <section className="profile-form-section"><h3>Tài khoản</h3><div className="profile-form-grid"><FormField label="Tên đăng nhập" name="username" value={form.username} onChange={change} readOnly={editing} required /><FormField label={editing ? 'Mật khẩu mới' : 'Mật khẩu ban đầu'} name="password" type="password" minLength={8} value={form.password} onChange={change} required={!editing} /><FormField label="Trạng thái" name="status" as="select" value={form.status} onChange={change}><option value="ACTIVE">Hoạt động</option><option value="LOCKED">Đã khóa</option></FormField></div></section>
  </ProfileFormModal>;
}
