import apiClient from '@/lib/api-client';

/**
 * Map ads (owner, 2026-10-12): billboards at real places, an ad wall of plots per area, and
 * sponsored pins. Plus feed posts (owner, 2026-10-15, "like X"): sponsored posts in the feed
 * with no map place. Paid with HuudCredit or naira (Bachs). Server: /api/v1/ads.
 */
export type AdKind = 'billboard' | 'plot' | 'sponsored_pin' | 'feed_post';
export type AdReach = 'area' | 'state' | 'nigeria';
export type AdCta = 'visit' | 'shop' | 'call' | 'book' | 'learn';
export type AdStatus = 'awaiting_payment' | 'in_review' | 'active' | 'rejected' | 'expired' | 'cancelled';
export type AdCurrency = 'HC' | 'NGN';

export type Ad = {
  _id: string;
  kind: AdKind;
  title: string;
  line?: string;
  colour: string;
  imageUrl?: string;
  target?: string;
  pinLayer?: 'market' | 'work' | 'events';
  body?: string;
  cta?: AdCta;
  reach?: AdReach;
  area: { lga: string; state: string };
  location?: { lat: number; lng: number };
  plot?: { areaKey: string; row: number; col: number };
  weeks: number;
  startsAt?: string;
  endsAt?: string;
  price: { currency: AdCurrency; amount: number };
  status: AdStatus;
  holdExpiresAt?: string;
  review?: { reason?: string };
  refund?: { status: 'done' | 'manual_pending' };
  stats?: { views: number; taps: number };
  createdAt: string;
};

export type AdPricing = {
  prices: Record<AdKind, { NGN: number; HC: number }>;
  maxWeeks: number;
  colours: string[];
  wallSize: number;
  spotsPerArea: { billboard: number; sponsored_pin: number };
  reachMultiplier: Record<AdReach, number>;
  feedBodyMax: number;
  /** Naira payments open (Bachs keys set on the server). */
  naira: boolean;
};

export type WallPlot = { row: number; col: number; live: boolean; id?: string; title?: string; line?: string; colour?: string; imageUrl?: string; target?: string };

const data = <T,>(res: unknown): T => ((res as { data?: T })?.data ?? res) as T;

export const AD_KINDS: { kind: AdKind; icon: string; name: string; what: string }[] = [
  { kind: 'billboard', icon: '🪧', name: 'Billboard', what: 'A big board on the map at your place. Glows at night.' },
  { kind: 'plot', icon: '🧱', name: 'Ad wall plot', what: "A tile on your area's ad wall. Cheap and fun to browse." },
  { kind: 'sponsored_pin', icon: '📍', name: 'Sponsored pin', what: 'Your shop, job or event stands out on the map.' },
  { kind: 'feed_post', icon: '📣', name: 'Feed post', what: 'A sponsored post in the feed, in your area, your state or all of Nigeria.' },
];

export const REACHES: { reach: AdReach; label: string }[] = [
  { reach: 'area', label: 'My area' },
  { reach: 'state', label: 'My state' },
  { reach: 'nigeria', label: 'All Nigeria' },
];

export const CTA_LABELS: Record<AdCta, string> = { visit: 'Visit', shop: 'Shop now', call: 'Call', book: 'Book', learn: 'Learn more' };

/** Price for one booking (feed posts cost more the further they reach). */
export function adPrice(p: AdPricing, kind: AdKind, weeks: number, currency: AdCurrency, reach: AdReach = 'area'): number {
  return (p.prices[kind]?.[currency] ?? 0) * weeks * (kind === 'feed_post' ? p.reachMultiplier?.[reach] ?? 1 : 1);
}

export const STATUS_WORDS: Record<AdStatus, { label: string; tone: 'green' | 'amber' | 'neutral' | 'red' | 'blue' }> = {
  awaiting_payment: { label: 'Waiting for payment', tone: 'amber' },
  in_review: { label: 'Paid, in review', tone: 'blue' },
  active: { label: 'Live', tone: 'green' },
  rejected: { label: 'Not approved', tone: 'red' },
  expired: { label: 'Ended', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const fetchAdPricing = async () => data<AdPricing>(await apiClient.get('/ads/pricing'));
export const fetchMapAds = async (bbox: [number, number, number, number]) =>
  data<{ ads: Ad[] }>(await apiClient.get('/ads/map', { params: { bbox: bbox.map((n) => n.toFixed(5)).join(',') } })).ads ?? [];
export const fetchWall = async (lga: string, state: string) => data<{ size: number; plots: WallPlot[] }>(await apiClient.get('/ads/wall', { params: { lga, state } }));
export const fetchFeedAds = async (lga: string, state: string) =>
  data<{ ads: Ad[] }>(await apiClient.get('/ads/feed', { params: { lga, state } })).ads ?? [];

/** Upload an ad picture through the app's media upload (the server only accepts these). */
export async function uploadAdImage(file: File): Promise<string> {
  const res = await apiClient.uploadFiles<{ files: { url: string }[] }>('/media/upload', [file]);
  const url = data<{ files?: { url: string }[] }>(res).files?.[0]?.url;
  if (!url) throw new Error('Upload failed. Try another picture.');
  return url;
}

export const fetchMyAds = async () => data<{ ads: Ad[] }>(await apiClient.get('/ads/mine')).ads ?? [];

export type CreateAdInput = {
  kind: AdKind;
  title: string;
  line?: string;
  colour: string;
  target?: string;
  pinLayer?: 'market' | 'work' | 'events';
  body?: string;
  cta?: AdCta;
  reach?: AdReach;
  imageUrl?: string;
  lga: string;
  state: string;
  lat?: number;
  lng?: number;
  row?: number;
  col?: number;
  weeks: number;
  currency: AdCurrency;
};
export const createAd = async (input: CreateAdInput) => data<{ ad: Ad }>(await apiClient.post('/ads', input)).ad;
export const payAdWithCredit = async (id: string) => data<{ ad: Ad }>(await apiClient.post(`/ads/${id}/pay`, { method: 'huudcredit' })).ad;
export const payAdWithNaira = async (id: string) => data<{ checkoutUrl: string }>(await apiClient.post(`/ads/${id}/pay`, { method: 'naira' })).checkoutUrl;

export const countAd = (id: string, what: 'view' | 'tap') => apiClient.post(`/ads/${id}/${what}`).catch(() => undefined);

export const fetchReviewQueue = async () => data<{ ads: Ad[] }>(await apiClient.get('/ads/review')).ads ?? [];
export const approveAd = async (id: string) => data<{ ad: Ad }>(await apiClient.post(`/ads/${id}/approve`)).ad;
export const rejectAd = async (id: string, reason: string) => data<{ ad: Ad }>(await apiClient.post(`/ads/${id}/reject`, { reason })).ad;

/** ₦5,000 or 1,500 HuudCredit. */
export function priceText(amount: number, currency: AdCurrency): string {
  return currency === 'NGN' ? `₦${amount.toLocaleString('en-NG')}` : `${amount.toLocaleString('en-NG')} HuudCredit`;
}

/** The person's area from their profile, if known. */
export function userArea(user: unknown): { lga: string; state: string } | null {
  const u = (user ?? {}) as { lga?: string; state?: string; location?: { lga?: string; state?: string } };
  const lga = u.lga ?? u.location?.lga;
  const state = u.state ?? u.location?.state;
  return lga && state ? { lga, state } : null;
}

/** Open an ad's link: our own pages in the app, other links in a new tab. */
export function openAdTarget(target: string | undefined, push: (href: string) => void) {
  if (!target) return;
  if (target.startsWith('/')) push(target);
  else window.open(target, '_blank', 'noopener,noreferrer');
}
