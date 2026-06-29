import type { UserStatus } from '@/services/safety.service';

/** Unwrap status from API response (handles single- or double-wrapped `data`). */
export function extractUserStatus(res: unknown): UserStatus | null {
  if (!res || typeof res !== 'object') return null;
  const root = res as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (d.status && typeof d.status === 'object') {
    return d.status as UserStatus;
  }
  if (d.data && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>;
    if (inner.status && typeof inner.status === 'object') {
      return inner.status as UserStatus;
    }
  }
  if (d.currentStatus && d.userId) {
    return d as unknown as UserStatus;
  }
  return null;
}
