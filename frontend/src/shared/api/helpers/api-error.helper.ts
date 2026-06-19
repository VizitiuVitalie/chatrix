import { AxiosError } from 'axios';

import type { ApiErrorBody } from '../interfaces/api-error-body.interface';
import type { ApiErrorKind } from '../interfaces/api-error-kind.type';

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return (
    error instanceof AxiosError &&
    typeof error.response?.data === 'object' &&
    error.response.data !== null &&
    'statusCode' in (error.response.data as Record<string, unknown>)
  );
}

export function isThrottleError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 429;
}

export function classifyError(error: unknown): ApiErrorKind {
  if (error instanceof AxiosError) {
    if (!error.response) return 'network';
    const status = error.response.status;
    if (status === 401) return 'auth';
    if (status >= 500) return 'server';
    return 'other';
  }
  return 'other';
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Unexpected error',
): string {
  if (isApiError(error)) {
    const message = error.response?.data.message;
    if (Array.isArray(message)) return message.join('; ');
    if (typeof message === 'string') return message;
  }

  const kind = classifyError(error);
  if (kind === 'network') {
    return 'Could not reach the server. Check your connection and try again.';
  }
  if (kind === 'server' && error instanceof AxiosError && error.response) {
    return `Server is currently unavailable (status: ${error.response.status})`;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
