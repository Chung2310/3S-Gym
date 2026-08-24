export function saveSession({ token, user }) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getSession() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? { token, user } : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function destinationForRole() {
  return '/portal';
}
