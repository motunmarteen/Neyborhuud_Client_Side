/**
 * A shared safety alert's live status (server: GET /content/:id/alert, public). Used by the
 * alert page and its WhatsApp preview, so a forward always says how things stand now.
 */
import { getApiBaseUrl } from '@/lib/api-client';

export type LiveAlert = {
  state: 'live';
  title: string;
  body: string;
  emergencyType: string | null;
  severity: string | null;
  area: { lga: string | null; state: string | null };
  mapCentre: { lat: number; lng: number } | null;
  createdAt: string;
  expiresAt: string | null;
  status: 'confirmed' | 'unconfirmed' | 'disputed';
  confirmCount: number;
  disputeCount: number;
  nearbyCount: number;
};

export type PublicAlert = { state: 'ended' } | LiveAlert;

/** null = no such alert (not a safety alert, or a bad link). */
export async function fetchPublicAlert(id: string): Promise<PublicAlert | null> {
  const res = await fetch(`${getApiBaseUrl()}/content/${encodeURIComponent(id)}/alert`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`alert ${res.status}`);
  return ((await res.json()) as { data: PublicAlert }).data;
}

export function areaName(a: { lga: string | null; state: string | null }): string {
  return [a.lga, a.state].filter(Boolean).join(', ') || 'Nigeria';
}

/** The status, in the same words everywhere (page, preview, share text). */
export function statusWords(a: LiveAlert): { badge: string; line: string; tone: 'green' | 'amber' | 'red' } {
  if (a.status === 'confirmed') {
    const n = a.confirmCount + a.nearbyCount;
    return { badge: '✅ Confirmed', line: n > 0 ? `Confirmed by neighbours (${n})` : 'Confirmed by neighbours', tone: 'green' };
  }
  if (a.status === 'disputed') {
    return { badge: '❗ Disputed', line: `Neighbours dispute this report (${a.disputeCount})`, tone: 'red' };
  }
  return { badge: '⚠️ Unconfirmed', line: 'Not confirmed by neighbours yet', tone: 'amber' };
}

/** "12 min ago", "3 h ago", "2 days ago". */
export function ageWords(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} ${d === 1 ? 'day' : 'days'} ago`;
}
