import { API_BASE_URL } from '../config';
import type { ApiErrorBody, ApiResult } from '../types';
import { clearSession } from './session';

export class ApiError extends Error {
  errors: Array<{ field: string; message: string }>;
  status: number;
  code: string;
  requestId: string;
  constructor(message: string, status: number, code = 'UNKNOWN_ERROR', requestId = '', errors: Array<{ field: string; message: string }> = []) {
    super(message); this.name = 'ApiError'; this.errors = errors; this.status = status; this.code = code; this.requestId = requestId;
  }
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers,
  } });
  const rawPayload: unknown = await response.json().catch(() => ({ success: false, message: 'Phản hồi từ máy chủ không hợp lệ.' }));
  const payload = isRecord(rawPayload) ? rawPayload : {};
  if (!response.ok || payload.success === false) {
    const errorBody = payload as ApiErrorBody;
    if (response.status === 401) clearSession();
    throw new ApiError(errorBody.message || 'Không thể thực hiện yêu cầu.', response.status, errorBody.code, errorBody.requestId, errorBody.errors || []);
  }
  if (!('data' in payload)) throw new ApiError('Phản hồi từ máy chủ không hợp lệ.', response.status);
  return { data: payload.data as T, meta: payload.meta as ApiResult<T>['meta'], message: typeof payload.message === 'string' ? payload.message : '' };
}
export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body: unknown = {}) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T = unknown>(path: string, formData: FormData) => request<T>(path, { method: 'POST', body: formData }),
};
