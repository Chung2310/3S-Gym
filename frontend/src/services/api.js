import { API_BASE_URL } from '../config';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({ success: false, message: 'Phản hồi từ máy chủ không hợp lệ.' }));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || 'Không thể thực hiện yêu cầu.');
    error.errors = payload.errors || [];
    error.status = response.status;
    throw error;
  }
  return { data: payload.data, meta: payload.meta, message: payload.message };
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body = {}) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
};
