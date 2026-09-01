import type { Session, User, UserRole } from '../types';

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { username?: unknown; role?: unknown };
  return typeof candidate.username === 'string' && ['SUPER_ADMIN', 'ADMIN', 'PT', 'CUSTOMER'].includes(candidate.role as UserRole);
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return matches ? decodeURIComponent(matches[1]) : null;
}

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function saveSession({ token, user }: Session): void {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setCookie('token', token);
  setCookie('user', JSON.stringify(user));
}

export function getSession(): Session | null {
  let token = localStorage.getItem('token');
  let storedUser = localStorage.getItem('user');

  if (!token || !storedUser) {
    const cookieToken = getCookie('token');
    const cookieUser = getCookie('user');
    if (cookieToken && cookieUser) {
      token = cookieToken;
      storedUser = cookieUser;
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', storedUser);
      } catch {
        // ignore storage quota error
      }
    }
  }

  if (!token || !storedUser) return null;

  try {
    const user: unknown = JSON.parse(storedUser);
    return isUser(user) ? { token, user } : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  deleteCookie('token');
  deleteCookie('user');
}

export function destinationForRole(): string {
  return '/portal';
}

