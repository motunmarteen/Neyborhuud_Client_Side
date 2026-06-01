import type { SentinelHubTab } from '@/lib/sentinel-catalog';

export const SENTINEL_TAB_BANNERS: Record<
  Exclude<SentinelHubTab, 'overview'>,
  { title: string; subtitle: string; gradient: string }
> = {
  protect: {
    title: 'Protect',
    subtitle: 'Trips, live tracking, zones, and check-ins',
    gradient: 'from-primary/12 via-transparent to-primary/5',
  },
  network: {
    title: 'Your network',
    subtitle: 'Guardians, circle, and live status',
    gradient: 'from-brand-blue/12 via-transparent to-brand-blue/5',
  },
  tools: {
    title: 'Tools',
    subtitle: 'SOS, reports, panic PIN, and more',
    gradient: 'from-brand-red/10 via-transparent to-brand-red/5',
  },
  history: {
    title: 'History',
    subtitle: 'Past trips and resolved incidents',
    gradient: 'from-[var(--neu-shadow-dark)]/30 via-transparent to-transparent',
  },
};
