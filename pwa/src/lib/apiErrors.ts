import { humanizeErrorMessage } from '@/lib/error-handler';

/** Extract HTTP status from axios or fetchAPI-style errors. */
export function getApiErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object') {
    const axiosStatus = (error as { response?: { status?: number } }).response?.status;
    if (typeof axiosStatus === 'number') return axiosStatus;
    const fetchStatus = (error as { status?: number }).status;
    if (typeof fetchStatus === 'number') return fetchStatus;
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const message = humanizeErrorMessage(error);
  return message || fallback;
}
