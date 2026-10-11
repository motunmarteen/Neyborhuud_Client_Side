import apiClient from '@/lib/api-client';

/**
 * Ask Sentinel (SSAA) — the one box for every search and question.
 * Server: POST /api/v1/sentinel/ask (NeyborHuud_Server_Side, modules/sentinel).
 */

export type AskMode = 'question' | 'search';
export type ResultGroup =
  | 'people' | 'places' | 'posts' | 'alerts' | 'bulletins' | 'market'
  | 'events' | 'artisans' | 'jobs' | 'help' | 'gist';

export type AskPerson = { id: string; username: string; name: string; avatarUrl: string | null; isVerified: boolean; area: string | null };
export type AskPlace = { lga: string; state: string | null; people: number };
export type AskPost = {
  id: string;
  contentType: string;
  title: string | null;
  content: string;
  media: string[];
  author: { id: string; username: string; name: string; avatarUrl: string | null; isVerified: boolean } | null;
  area: string | null;
  price: number | null;
  likes: number;
  comments: number;
  createdAt: string;
};

export type AskAnswer = {
  answer: string;
  sentiment: 'safe' | 'advisory' | 'alert';
  sources: { title: string; category: string; sourceType: string; distanceLabel?: string }[];
  suggestedFollowUps: string[];
  assessedArea?: { state?: string; lga?: string; district?: string };
};

export type AskResult = {
  query: string;
  mode: AskMode;
  answer: AskAnswer | null;
  needsLocation: boolean;
  groups: { key: ResultGroup; items: (AskPerson | AskPlace | AskPost)[] }[];
  total: number;
};

export const GROUP_LABEL: Record<ResultGroup, string> = {
  alerts: '🚨 Safety alerts',
  people: '👥 Neighbours',
  places: '📍 Places',
  artisans: '🛠️ Artisans',
  market: '🛒 Market',
  events: '🎉 Events',
  jobs: '💼 Jobs',
  help: '🙏 Help requests',
  bulletins: '📢 Bulletins',
  posts: '✏️ Posts',
  gist: '💬 Gist',
};

// Kept in step with the server's ask.rules.ts so the screen knows when a query is a
// question (wait for Enter before calling the AI) or a lookup (search as you type).
const QUESTION_STARTS = [
  'who', 'what', 'whats', "what's", 'where', 'when', 'why', 'how', 'which',
  'is', 'are', 'was', 'were', 'can', 'could', 'should', 'will', 'would', 'do', 'does', 'did', 'any', 'anyone', 'anybody',
  'wetin', 'abeg', 'pls', 'please', 'una', 'e', 'na', 'how far', 'where i fit', 'who fit', 'who sabi', 'make i',
];
const REQUEST_CUES = [
  'near me', 'nearby', 'around me', 'around here', 'close to me', 'in my area', 'for my area',
  'i need', 'i dey find', "i'm looking for", 'im looking for', 'looking for', 'find me', 'recommend',
  'best ', 'cheap', 'safe to', 'is it safe', 'right now', 'today', 'tonight', 'open now',
  'light', 'nepa', 'traffic', 'go-slow', 'go slow', 'flood', 'road', 'robbery', 'kidnap',
];

export function classifyQuery(raw: string): AskMode {
  const q = String(raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!q) return 'search';
  if (q.endsWith('?')) return 'question';
  if (q.split(' ').every((w) => w.startsWith('#') || w.startsWith('@'))) return 'search';
  const words = q.split(' ');
  if (QUESTION_STARTS.some((s) => q === s || q.startsWith(`${s} `)) && words.length >= 2) return 'question';
  if (REQUEST_CUES.some((c) => q.includes(c)) && words.length >= 2) return 'question';
  return words.length >= 6 ? 'question' : 'search';
}

const GROUP_OF: Record<string, ResultGroup> = {
  emergency: 'alerts', fyi: 'bulletins', marketplace: 'market', event: 'events',
  services: 'artisans', job: 'jobs', help_request: 'help', gossip: 'gist',
};
const ORDER: ResultGroup[] = ['alerts', 'people', 'places', 'artisans', 'market', 'events', 'jobs', 'help', 'bulletins', 'posts', 'gist'];

/**
 * Fallback while a server without /sentinel/ask is still live: use the older
 * GET /search and shape it the same way (results only, no Sentinel answer).
 */
async function legacySearch(query: string): Promise<AskResult> {
  const res = await apiClient.get<any>('/search', { params: { q: query, type: 'all', limit: 8 } });
  const d = (res as any)?.data ?? {};
  const byGroup: Partial<Record<ResultGroup, (AskPerson | AskPlace | AskPost)[]>> = {};
  byGroup.people = (d.users?.data ?? []).map((u: any) => ({
    id: String(u._id ?? u.id), username: u.username, name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username,
    avatarUrl: u.avatarUrl ?? null, isVerified: !!u.isVerified, area: null,
  }));
  byGroup.places = (d.locations?.data ?? []).filter((l: any) => l.lga).map((l: any) => ({ lga: l.lga, state: l.state ?? null, people: l.userCount ?? 0 }));
  for (const p of d.posts?.data ?? []) {
    const g = GROUP_OF[p.contentType] ?? 'posts';
    (byGroup[g] ??= []).push({
      id: p.id, contentType: p.contentType ?? 'post', title: p.title ?? null, content: p.content ?? '', media: (p.mediaUrls ?? []).slice(0, 1),
      author: p.author ? { id: String(p.author._id ?? p.author.id), username: p.author.username, name: p.author.name || [p.author.firstName, p.author.lastName].filter(Boolean).join(' '), avatarUrl: p.author.avatarUrl ?? null, isVerified: !!p.author.isVerified } : null,
      area: null, price: null, likes: p.likes ?? 0, comments: p.comments ?? 0, createdAt: p.createdAt,
    });
  }
  const groups = ORDER.map((key) => ({ key, items: (byGroup[key] ?? []).slice(0, 6) })).filter((g) => g.items.length > 0);
  return { query, mode: classifyQuery(query), answer: null, needsLocation: false, groups, total: groups.reduce((n, g) => n + g.items.length, 0) };
}

export async function askSentinel(query: string, coords?: { lat: number; lng: number } | null): Promise<AskResult> {
  try {
    const res = await apiClient.post<AskResult>('/sentinel/ask', {
      query,
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    });
    return ((res as any)?.data ?? res) as AskResult;
  } catch (e: any) {
    if (e?.response?.status === 404) return legacySearch(query);
    throw e;
  }
}
