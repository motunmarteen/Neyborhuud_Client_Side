/** Local Huud hub metadata — browse shells aligned with Huud Economy patterns. */
export type LocalHuudHubId =
  | 'marketplace'
  | 'services'
  | 'jobs'
  | 'events'
  | 'fyi'
  | 'help-request'
  | 'incident-reports'
  | 'community-emergency';

export type LocalHuudHubSection = {
  id: string;
  label: string;
  href: string;
  icon: string;
  /** Match subpaths (e.g. detail pages under this section). */
  matchPrefix?: string;
};

export type LocalHuudHubConfig = {
  id: LocalHuudHubId;
  label: string;
  tagline: string;
  description: string;
  icon: string;
  href: string;
  economyNote: string;
  sections: LocalHuudHubSection[];
};

export const LOCAL_HUUD_HUBS: Record<LocalHuudHubId, LocalHuudHubConfig> = {
  marketplace: {
    id: 'marketplace',
    label: 'Marketplace',
    tagline: 'Buy & sell in your Huud',
    description: 'Neighbourhood listings, offers, and trusted local trade — powered by Huud Score.',
    icon: 'shopping_bag',
    href: '/marketplace',
    economyNote: 'Boost listings with HuudCoins · Build seller trust',
    sections: [
      { id: 'browse', label: 'Browse', href: '/marketplace', icon: 'storefront' },
      { id: 'listings', label: 'My Listings', href: '/marketplace/my-listings', icon: 'inventory_2', matchPrefix: '/marketplace/my-listings' },
      { id: 'orders', label: 'Orders', href: '/marketplace/my-orders', icon: 'shopping_cart', matchPrefix: '/marketplace/my-orders' },
      { id: 'offers', label: 'Offers', href: '/marketplace/my-offers', icon: 'local_offer', matchPrefix: '/marketplace/my-offers' },
      { id: 'sales', label: 'Sales', href: '/marketplace/my-sales', icon: 'payments', matchPrefix: '/marketplace/my-sales' },
    ],
  },
  services: {
    id: 'services',
    label: 'Services',
    tagline: 'Skilled neighbours near you',
    description: 'Book trusted local pros — ratings, reviews, and Huud Economy rewards.',
    icon: 'handyman',
    href: '/services',
    economyNote: 'Earn HuudCoins for great service · Boost visibility',
    sections: [
      { id: 'browse', label: 'Browse', href: '/services', icon: 'search' },
      { id: 'bookings', label: 'Bookings', href: '/services/my-bookings', icon: 'event_available', matchPrefix: '/services/my-bookings' },
      { id: 'saved', label: 'Saved', href: '/services/my-favorites', icon: 'bookmark', matchPrefix: '/services/my-favorites' },
    ],
  },
  jobs: {
    id: 'jobs',
    label: 'Jobs',
    tagline: 'Work opportunities nearby',
    description: 'Find gigs and careers in your community — apply with your Huud reputation.',
    icon: 'work',
    href: '/jobs',
    economyNote: 'Trusted applicants stand out · Employers boost listings',
    sections: [
      { id: 'browse', label: 'Browse', href: '/jobs', icon: 'work' },
      { id: 'applications', label: 'Applications', href: '/jobs/my-applications', icon: 'assignment', matchPrefix: '/jobs/my-applications' },
      { id: 'saved', label: 'Saved', href: '/jobs/saved', icon: 'bookmark', matchPrefix: '/jobs/saved' },
    ],
  },
  events: {
    id: 'events',
    label: 'Events',
    tagline: 'What’s happening around you',
    description: 'Discover and host neighbourhood gatherings — RSVP and share with your Huud.',
    icon: 'event',
    href: '/events',
    economyNote: 'Boost events · Earn engagement HuudCoins',
    sections: [
      { id: 'browse', label: 'Browse', href: '/events', icon: 'calendar_month' },
      { id: 'mine', label: 'My Events', href: '/events/my-events', icon: 'event_note', matchPrefix: '/events/my-events' },
      { id: 'nearby', label: 'Nearby', href: '/events/nearby', icon: 'near_me', matchPrefix: '/events/nearby' },
    ],
  },
  fyi: {
    id: 'fyi',
    label: 'FYI Bulletins',
    tagline: 'Neighbourhood notices',
    description: 'Official updates, lost & found, and community FYIs — keep your Huud informed.',
    icon: 'campaign',
    href: '/fyi',
    economyNote: 'Pin bulletins · Endorse trusted sources',
    sections: [{ id: 'browse', label: 'Feed', href: '/fyi', icon: 'dynamic_feed' }],
  },
  'help-request': {
    id: 'help-request',
    label: 'Help Requests',
    tagline: 'Ask neighbours for support',
    description: 'Request help from your community — neighbours respond with care and Huud trust.',
    icon: 'help',
    href: '/help-request',
    economyNote: 'HuudCoins rewards coming soon for helpers',
    sections: [{ id: 'browse', label: 'Requests', href: '/help-request', icon: 'volunteer_activism' }],
  },
  'incident-reports': {
    id: 'incident-reports',
    label: 'Incident Reports',
    tagline: 'Report & track local issues',
    description: 'Document incidents with witnesses and updates — strengthen Huud safety together.',
    icon: 'report',
    href: '/incident-reports',
    economyNote: 'Verified reports build community trust',
    sections: [{ id: 'browse', label: 'Reports', href: '/incident-reports', icon: 'report' }],
  },
  'community-emergency': {
    id: 'community-emergency',
    label: 'Community Alerts',
    tagline: 'Urgent neighbourhood alerts',
    description: 'Share time-sensitive alerts — not the same as Sentinel SOS, but your Huud’s voice.',
    icon: 'add_alert',
    href: '/community-emergency',
    economyNote: 'Stay aware · Mark safe when you can',
    sections: [{ id: 'browse', label: 'Alerts', href: '/community-emergency', icon: 'notifications_active' }],
  },
};

export function getLocalHuudHub(hubId: LocalHuudHubId): LocalHuudHubConfig {
  return LOCAL_HUUD_HUBS[hubId];
}

export function resolveLocalHuudSection(hubId: LocalHuudHubId, pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0];
  const hub = LOCAL_HUUD_HUBS[hubId];

  for (const section of hub.sections) {
    if (section.matchPrefix && path.startsWith(section.matchPrefix)) {
      return section.id;
    }
  }

  for (const section of hub.sections) {
    if (path === section.href || path === `${section.href}/`) {
      return section.id;
    }
  }

  if (path.startsWith(hub.href + '/')) {
    return hub.sections[0]?.id ?? 'browse';
  }

  return hub.sections[0]?.id ?? 'browse';
}
