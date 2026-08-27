import type { Response } from 'express';

interface SuccessOptions<T> { message: string; data?: T | null; meta?: unknown; status?: number }
interface FailureOptions { message: string; errors?: unknown; status?: number }

function success<T = unknown>(res: Response, { message, data = null, meta, status = 200 }: SuccessOptions<T>) {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

function fail(res: Response, { message, errors, status = 400 }: FailureOptions) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export { success, fail };