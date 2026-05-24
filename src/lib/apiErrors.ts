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
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (error && typeof error === 'object') {
    const axiosMsg = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    if (typeof axiosMsg === 'string' && axiosMsg.trim()) return axiosMsg.trim();
  }
  return fallback;
}
