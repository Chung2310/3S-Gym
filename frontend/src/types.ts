export type UserRole = 'ADMIN' | 'PT' | 'CUSTOMER';
export interface User { _id?: string; id?: string; username: string; role: UserRole; fullName?: string; phone?: string; email?: string; status?: string; avatarUrl?: string }
export interface Session { token: string; user: User }
export interface PaginationMeta { page: number; limit?: number; total?: number; totalPages: number }
export interface ApiResponse<T> { success: true; data: T; meta?: PaginationMeta; message?: string }
export interface ApiErrorBody { success?: false; message?: string; code?: string; requestId?: string; errors?: Array<{ field: string; message: string }> }
export interface ApiResult<T> { data: T; meta?: PaginationMeta; message: string; summary?: unknown }
export interface Customer { _id: string; id?: string; userId?: string; fullName: string; phone: string; email?: string; status?: string; assignedPtId?: string; initialGoal?: string;[key: string]: unknown }
export interface ContentEntity { _id: string; id?: string; title?: string; status?: string; customerId?: string; measurementDate?: string; weight?: number; targetCalories?: number;[key: string]: unknown }
function validationErrors(error: unknown): Array<{ field: string; message: string }> {
  if (typeof error !== 'object' || error === null || !('errors' in error) || !Array.isArray(error.errors)) return [];
  return error.errors.filter((item): item is { field: string; message: string } => (
    typeof item === 'object' && item !== null
    && 'field' in item && typeof item.field === 'string' && item.field.length > 0
    && 'message' in item && typeof item.message === 'string' && item.message.length > 0
  ));
}

export function errorMessage(error: unknown): string {
  const messages = [...new Set(validationErrors(error).map((item) => item.message))];
  if (messages.length > 0) return messages.join(' ');
  return error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  return validationErrors(error).reduce<Record<string, string>>((result, item) => {
    if (!(item.field in result)) result[item.field] = item.message;
    return result;
  }, {});
}

export type { ApiFailure, ApiList, ApiSuccess, FeatureKey, FeatureState, FieldError } from './types/api';
export * from './types/inbody';
export * from './types/workout';
export * from './types/knowledge';
export * from './types/progress';
