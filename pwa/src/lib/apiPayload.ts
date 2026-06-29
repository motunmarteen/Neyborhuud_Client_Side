/** Unwrap `{ success, data: T }` from apiClient responses. */
export function unwrapApiData<T>(res: unknown): T | undefined {
  if (!res || typeof res !== 'object') return undefined;
  const root = res as Record<string, unknown>;
  if ('data' in root && root.data !== undefined) {
    return root.data as T;
  }
  return res as T;
}
