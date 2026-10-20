import apiClient from '@/lib/api-client';

/**
 * Way Finder (owner 2026-10-19): routes neighbours share ("At Isolo, board a danfo to Oshodi…"),
 * confirmed by riders; votes for fastest and fastest in traffic. Server: /api/v1/way.
 */

export const ROUTE_MODES = ['danfo', 'bus', 'brt', 'keke', 'okada', 'walk', 'train', 'ferry', 'taxi'] as const;
export type RouteMode = (typeof ROUTE_MODES)[number];

export const MODE_EMOJI: Record<RouteMode, string> = {
  danfo: '🚐', bus: '🚌', brt: '🚍', keke: '🛺', okada: '🏍️', walk: '🚶🏾', train: '🚆', ferry: '⛴️', taxi: '🚕',
};

export type RouteStep = {
  mode: RouteMode;
  board: string;
  alight: string;
  fareMin?: number | null;
  fareMax?: number | null;
  minutes?: number | null;
  note?: string;
};

export type RouteView = {
  id: string;
  from: string;
  to: string;
  steps: RouteStep[];
  tips: string;
  fareMin: number | null;
  fareMax: number | null;
  minutes: number | null;
  worked: number;
  failed: number;
  fastest: number;
  traffic: number;
  badges: ('fastest' | 'traffic')[];
  myFastest: boolean;
  myTraffic: boolean;
  confirmed: boolean;
  mine: boolean;
  myVote: 'worked' | 'failed' | null;
  author: { username: string; name: string } | null;
  createdAt: string;
};

export type RouteRequest = { id: string; from: string; to: string; askers: number; createdAt: string };

const data = <T,>(res: unknown): T => ((res as { data?: T })?.data ?? res) as T;

export async function findRoutes(from: string, to: string, prefer?: 'fastest' | 'traffic' | null): Promise<RouteView[]> {
  const res = await apiClient.get('/way', { params: { from: from || undefined, to, prefer: prefer || undefined } });
  return data<{ routes: RouteView[] }>(res).routes ?? [];
}
export async function getRoute(id: string): Promise<RouteView | null> {
  const res = await apiClient.get(`/way/routes/${encodeURIComponent(id)}`);
  return data<{ route: RouteView }>(res).route ?? null;
}
export async function shareRoute(body: { from: string; to: string; steps: RouteStep[]; tips?: string; requestId?: string }): Promise<RouteView> {
  const res = await apiClient.post('/way/routes', body);
  return data<{ route: RouteView }>(res).route;
}
export async function routeFeedback(id: string, worked: boolean): Promise<RouteView> {
  const res = await apiClient.post(`/way/routes/${encodeURIComponent(id)}/feedback`, { worked });
  return data<{ route: RouteView }>(res).route;
}
export async function voteRoute(id: string, kind: 'fastest' | 'traffic'): Promise<RouteView> {
  const res = await apiClient.post(`/way/routes/${encodeURIComponent(id)}/vote`, { kind });
  return data<{ route: RouteView }>(res).route;
}
export async function openRequests(): Promise<RouteRequest[]> {
  const res = await apiClient.get('/way/requests');
  return data<{ requests: RouteRequest[] }>(res).requests ?? [];
}
export async function askRiders(from: string, to: string): Promise<{ id: string; existing: boolean }> {
  const res = await apiClient.post('/way/requests', { from, to });
  return data<{ id: string; existing: boolean }>(res);
}

export const naira = (n?: number | null) => (n ? `₦${n.toLocaleString('en-NG')}` : '');
export function fareText(min?: number | null, max?: number | null) {
  if (!min && !max) return '';
  return min && max && max !== min ? `${naira(min)}–${naira(max)}` : naira(min || max);
}
export function minutesText(m?: number | null) {
  if (!m) return '';
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`;
}
