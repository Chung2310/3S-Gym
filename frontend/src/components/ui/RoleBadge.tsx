import { ShieldCheck, Dumbbell, User as UserIcon } from 'lucide-react';
import type { UserRole } from '../../types';

interface RoleBadgeProps {
  role?: UserRole | string;
}

const roleConfig: Record<string, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  ADMIN: { label: 'Admin', className: 'role-badge-admin', Icon: ShieldCheck },
  PT: { label: 'Huấn luyện viên', className: 'role-badge-pt', Icon: Dumbbell },
  CUSTOMER: { label: 'Khách hàng', className: 'role-badge-customer', Icon: UserIcon },
};

export default function RoleBadge({ role = 'CUSTOMER' }: RoleBadgeProps) {
  const config = roleConfig[role] || { label: role, className: 'role-badge-customer', Icon: UserIcon };
  const { label, className, Icon } = config;

  return (
    <span className={`role-badge ${className}`} aria-label={`Vai trò: ${label}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
