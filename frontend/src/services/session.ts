import type { Session, User, UserRole } from '../types';
function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { username?: unknown; role?: unknown };
  return typeof candidate.username === 'string' && ['ADMIN', 'PT', 'CUSTOMER'].includes(candidate.role as UserRole);
}
export function saveSession({ token, user }: Session): void { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }
export function getSession(): Session | null {
  const token = localStorage.getItem('token'); if (!token) return null;
  try { const storedUser = localStorage.getItem('user'); if (!storedUser) return null; const user: unknown = JSON.parse(storedUser); return isUser(user) ? { token, user } : null; } catch { return null; }
}
export function clearSession(): void { localStorage.removeItem('token'); localStorage.removeItem('user'); }
export function destinationForRole(): string { return '/portal'; }
