/**
 * Ads people can see before real businesses book any (owner, 2026-10-15).
 *
 * - House ads: NeyborHuud's own, real offers ("Your business here", safety alerts). Shown to
 *   everyone while there are no real ads, labelled "Ad" / "Sponsored · NeyborHuud".
 * - Sample ads: example businesses so the owner can see what real ads will look like. Shown
 *   only to admins, or to anyone who turns on "Preview sample ads" on the Ads page, and always
 *   marked "Sample". Never counted as views or taps, never stored on the server.
 */
import type { Ad } from '@/lib/adsApi';

const base = {
  status: 'active',
  weeks: 1,
  price: { currency: 'HC', amount: 0 },
  createdAt: '',
} as const;

export const isPlaceholderAd = (ad: Pick<Ad, '_id'>) => ad._id.startsWith('house-') || ad._id.startsWith('sample-');
export const isSampleAd = (ad: Pick<Ad, '_id'>) => ad._id.startsWith('sample-');

export function houseFeedAds(area: { lga: string; state: string }): Ad[] {
  return [
    {
      ...base,
      _id: 'house-feed-advertise',
      kind: 'feed_post',
      title: 'NeyborHuud',
      body: `Own a shop or business in ${area.lga}? Show it to your neighbours right here in the Feed, or on a billboard on the map. From ₦2,000 a week.`,
      cta: 'learn',
      target: '/ads',
      colour: '#0E8A3E',
      area,
    },
    {
      ...base,
      _id: 'house-feed-alerts',
      kind: 'feed_post',
      title: 'NeyborHuud',
      body: 'Turn on safety alerts so you hear first when something happens on your street.',
      cta: 'visit',
      target: '/settings',
      colour: '#1D2433',
      area,
    },
  ];
}

/** "Your ad here" billboard at a fixed spot in the person's area. */
export function houseMapAds(at: { lat: number; lng: number }, area: { lga: string; state: string }): Ad[] {
  return [
    {
      ...base,
      _id: 'house-billboard',
      kind: 'billboard',
      title: 'Your ad here',
      line: 'Book this billboard · from ₦5,000/week',
      target: '/ads/new?kind=billboard',
      colour: '#0E8A3E',
      location: { lat: at.lat + 0.0022, lng: at.lng + 0.0004 },
      area,
    },
  ];
}

export function sampleFeedAds(area: { lga: string; state: string }): Ad[] {
  return [
    {
      ...base,
      _id: 'sample-feed-fabrics',
      kind: 'feed_post',
      title: 'Ada Fabrics',
      body: 'Fresh Ankara and lace just arrived. 10% off this week for neighbours. Free delivery within the estate!',
      cta: 'shop',
      target: '/ads',
      colour: '#8B5CF6',
      reach: 'area',
      area,
    },
    {
      ...base,
      _id: 'sample-feed-kitchen',
      kind: 'feed_post',
      title: "Mama Bisi's Kitchen",
      body: 'Hot amala, ewedu and gbegiri till 9pm. Order on WhatsApp and pick up in 15 minutes.',
      cta: 'call',
      target: '/ads',
      colour: '#E8892B',
      reach: 'state',
      area,
    },
    {
      ...base,
      _id: 'sample-feed-phones',
      kind: 'feed_post',
      title: 'Chidi Phones',
      body: 'Cracked screen? Fixed in 1 hour with 3 months warranty. All brands.',
      cta: 'book',
      target: '/ads',
      colour: '#2B6AA6',
      reach: 'nigeria',
      area,
    },
  ];
}

export function sampleMapAds(at: { lat: number; lng: number }, area: { lga: string; state: string }): Ad[] {
  return [
    { ...base, _id: 'sample-bb-kitchen', kind: 'billboard', title: "Mama Bisi's Kitchen", line: 'Hot amala till 9pm', colour: '#E8892B', target: '/ads', location: { lat: at.lat - 0.0006, lng: at.lng - 0.0024 }, area },
    { ...base, _id: 'sample-bb-phones', kind: 'billboard', title: 'Chidi Phones', line: 'Screen repair in 1 hour', colour: '#2B6AA6', target: '/ads', location: { lat: at.lat - 0.0024, lng: at.lng + 0.0021 }, area },
    { ...base, _id: 'sample-pin-fabrics', kind: 'sponsored_pin', pinLayer: 'market', title: 'Ada Fabrics', colour: '#8B5CF6', target: '/ads', location: { lat: at.lat + 0.0008, lng: at.lng + 0.0030 }, area },
  ];
}

const PREVIEW_KEY = 'nh_preview_sample_ads';

/** Whether this viewer wants sample ads (admins: on unless they turned it off). */
export function previewSamplesOn(isAdmin: boolean): boolean {
  try {
    const v = window.localStorage.getItem(PREVIEW_KEY);
    return v === null ? isAdmin : v === '1';
  } catch {
    return isAdmin;
  }
}

export function setPreviewSamples(on: boolean): void {
  try {
    window.localStorage.setItem(PREVIEW_KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: applies for this visit only */
  }
}
