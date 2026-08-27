export type UserRole = 'ADMIN' | 'PT' | 'CUSTOMER';
export interface User { _id?: string; id?: string; username: string; role: UserRole; fullName?: string; phone?: string; email?: string; status?: string; avatarUrl?: string }
export interface Session { token: string; user: User }
export interface PaginationMeta { page: number; limit?: number; total?: number; totalPages: number }
export interface ApiResponse<T> { success: true; data: T; meta?: PaginationMeta; message?: string }
export interface ApiErrorBody { success?: false; message?: string; errors?: Array<{ field: string; message: string }> }
export interface ApiResult<T> { data: T; meta?: PaginationMeta; message: string }
export interface Customer { _id: string; id?: string; userId?: string; fullName: string; phone: string; email?: string; status?: string; assignedPtId?: string; initialGoal?: string; [key: string]: unknown }
export interface ContentEntity { _id: string; id?: string; title?: string; status?: string; customerId?: string; measurementDate?: string; weight?: number; targetCalories?: number; [key: string]: unknown }
export function errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.'; }
