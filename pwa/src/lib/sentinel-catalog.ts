/**
 * Sentinel AI feature catalog — single source for hub tiles and in-app discovery.
 */

export type SentinelHubTab = 'overview' | 'protect' | 'network' | 'tools' | 'history';

export type SentinelAccent = 'primary' | 'blue' | 'red' | 'muted';

export type SentinelFeature = {
  id: string;
  icon: string;
  label: string;
  href: string;
  tab: SentinelHubTab;
  accent: SentinelAccent;
  /** Short promise — what this feature does for you */
  tagline: string;
  /** One line — how to use it */
  howTo: string;
  badge?: string;
};

export const SENTINEL_HUB_TABS: { id: SentinelHubTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'protect', label: 'Protect', icon: 'shield' },
  { id: 'network', label: 'Network', icon: 'groups' },
  { id: 'tools', label: 'Tools', icon: 'construction' },
  { id: 'history', label: 'History', icon: 'history' },
];

export const SENTINEL_FEATURES: SentinelFeature[] = [
  {
    id: 'trips',
    icon: 'route',
    label: 'Safe Trips',
    href: '/safety/trips',
    tab: 'protect',
    accent: 'primary',
    tagline: 'Plan a journey and share live progress with guardians.',
    howTo: 'Start a trip, check in on schedule, and mark arrived when you reach.',
  },
  {
    id: 'tracking',
    icon: 'my_location',
    label: 'Live tracking',
    href: '/safety/kidnapping-tracking',
    tab: 'protect',
    accent: 'primary',
    tagline: 'Continuous location sharing for high-risk moments.',
    howTo: 'Start a session when you need guardians to follow your path in real time.',
  },
  {
    id: 'geofences',
    icon: 'fence',
    label: 'Geofences',
    href: '/safety/geofences',
    tab: 'protect',
    accent: 'primary',
    tagline: 'Safe zones and restricted areas on your map.',
    howTo: 'Draw a fence, name it, and get alerts when you enter or leave.',
  },
  {
    id: 'checkins',
    icon: 'check_circle',
    label: 'Check-ins',
    href: '/safety/manage#checkins',
    tab: 'protect',
    accent: 'primary',
    tagline: 'Scheduled wellness pings to your circle.',
    howTo: 'Set intervals in the dashboard — miss one and escalation begins.',
  },
  {
    id: 'guardians',
    icon: 'shield_person',
    label: 'Guardians',
    href: '/safety/manage#guardians',
    tab: 'network',
    accent: 'blue',
    tagline: 'Trusted people who receive SOS and trip alerts.',
    howTo: 'Invite contacts, set priority, and accept incoming requests.',
  },
  {
    id: 'circle',
    icon: 'group',
    label: 'Safety circle',
    href: '/safety/manage#linkers',
    tab: 'network',
    accent: 'blue',
    tagline: 'Mutual followers who can see your safety status.',
    howTo: 'Connect with neighbours you trust on NeyborHuud.',
  },
  {
    id: 'status',
    icon: 'forum',
    label: 'Status feed',
    href: '/safety/manage#status',
    tab: 'network',
    accent: 'blue',
    tagline: 'See when guardians are safe, away, or need help.',
    howTo: 'Post or view live vs last-seen updates from your network.',
  },
  {
    id: 'sentinel-ai',
    icon: 'psychology',
    label: 'Threat scanning',
    href: '/safety/sentinel',
    tab: 'network',
    accent: 'blue',
    tagline: 'Sentinel AI flags risky content and patterns.',
    howTo: 'Review scans and tune what gets flagged for your Huud.',
    badge: 'AI',
  },
  {
    id: 'emergency',
    icon: 'local_police',
    label: 'Emergency report',
    href: '/safety/emergency',
    tab: 'tools',
    accent: 'red',
    tagline: 'Report to agencies (NPF, NEMA, fire, medical).',
    howTo: 'File a report with location — track dispatch status in one place.',
  },
  {
    id: 'fake-call',
    icon: 'phone_in_talk',
    label: 'Fake call',
    href: '/safety/fake-call',
    tab: 'tools',
    accent: 'primary',
    tagline: 'Stage an incoming call to exit awkward situations.',
    howTo: 'Pick a caller, set a delay, and let the phone ring full-screen.',
  },
  {
    id: 'panic-pin',
    icon: 'pin',
    label: 'Panic PIN',
    href: '/safety/panic-pin',
    tab: 'tools',
    accent: 'red',
    tagline: 'A duress code that silently triggers SOS.',
    howTo: 'Set a PIN different from your unlock — entering it alerts guardians quietly.',
  },
  {
    id: 'sos-center',
    icon: 'emergency',
    label: 'SOS command center',
    href: '/sos',
    tab: 'tools',
    accent: 'red',
    tagline: 'Arm, cancel, or resolve an active emergency.',
    howTo: 'Tap the red SOS on the bottom nav, or open here for full controls.',
  },
  {
    id: 'trip-log',
    icon: 'map',
    label: 'Trip history',
    href: '/safety/trips/history',
    tab: 'history',
    accent: 'muted',
    tagline: 'Past journeys and how they ended.',
    howTo: 'Browse completed and cancelled trips with timestamps.',
  },
  {
    id: 'incidents',
    icon: 'history',
    label: 'Incident log',
    href: '/safety/manage#alerts',
    tab: 'history',
    accent: 'muted',
    tagline: 'Resolved and cancelled SOS events.',
    howTo: 'Open Dashboard → Alerts for incident history and timelines.',
  },
  {
    id: 'dashboard',
    icon: 'dashboard',
    label: 'Safety dashboard',
    href: '/safety/manage',
    tab: 'overview',
    accent: 'muted',
    tagline: 'Advanced controls — guardians, SOS engine, feeds.',
    howTo: 'One place for power users: add guardians, live status, and alerts.',
  },
];

export const SENTINEL_OVERVIEW_QUICK = [
  'trips',
  'guardians',
  'panic-pin',
  'sos-center',
] as const;

export function featuresForTab(tab: SentinelHubTab): SentinelFeature[] {
  if (tab === 'overview') {
    return SENTINEL_FEATURES.filter((f) =>
      (SENTINEL_OVERVIEW_QUICK as readonly string[]).includes(f.id),
    );
  }
  return SENTINEL_FEATURES.filter((f) => f.tab === tab);
}

export function getSentinelFeature(id: string): SentinelFeature | undefined {
  return SENTINEL_FEATURES.find((f) => f.id === id);
}
