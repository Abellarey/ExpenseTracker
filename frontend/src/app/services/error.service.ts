import { HttpErrorResponse } from '@angular/common/http';
import { FieldError } from '../models/api.model';

interface BackendError {
  message?: string;
  errors?: FieldError[];
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as BackendError | null;
    if (body?.errors?.length) return body.errors.map((item) => item.message).join(' ');
    if (body?.message) return body.message;
    if (error.status === 0) return 'Cannot reach the API. Make sure the backend server is running.';
    return `${fallback} (status ${error.status})`;
  }
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as BackendError | null;
    return (body?.errors || []).reduce<Record<string, string>>((result, item) => {
      result[item.field] = item.message;
      return result;
    }, {});
  }
  return {};
}
