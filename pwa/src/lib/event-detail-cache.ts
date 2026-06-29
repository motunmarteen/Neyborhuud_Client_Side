/**
 * Persists last successful GET /events/:id response in sessionStorage so a full
 * page refresh can show cached details immediately while React Query refetches.
 */

const PREFIX = "neyborhuud_event_detail:";

export type EventDetailCacheEntry = {
  /** Raw API body from apiClient.get (same shape useEvent stores in query cache) */
  payload: unknown;
  updatedAt: number;
};

export function readEventDetailCache(eventId: string): EventDetailCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + eventId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventDetailCacheEntry;
    if (!parsed || typeof parsed.updatedAt !== "number" || parsed.payload == null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeEventDetailCache(eventId: string, payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    const entry: EventDetailCacheEntry = { payload, updatedAt: Date.now() };
    sessionStorage.setItem(PREFIX + eventId, JSON.stringify(entry));
  } catch {
    // Quota or private mode
  }
}
