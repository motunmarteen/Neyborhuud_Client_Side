/**
 * Huud Gist section icons — labels/descriptions come from GET /huud-gist/sections.
 */
export const GIST_SECTION_ICONS: Record<string, string> = {
  all: 'dynamic_feed',
  local_gist: 'campaign',
  community_question: 'help',
  business_inquiry: 'storefront',
  recommendation_request: 'thumb_up',
  social_update: 'groups',
  cultural_discussion: 'public',
  sports: 'sports_soccer',
  entertainment: 'movie',
  education: 'school',
  technology: 'devices',
  music: 'music_note',
  media: 'newspaper',
  investment: 'trending_up',
  agriculture: 'agriculture',
  university: 'account_balance',
  nysc: 'badge',
  fashion: 'checkroom',
  health_wellness: 'health_and_safety',
  comedy_memes: 'mood',
  politics: 'gavel',
  religion: 'church',
  relationships: 'favorite',
  traffic_transport: 'directions_car',
  property_rent: 'home',
  food_places: 'restaurant',
  general: 'chat',
};

export function gistSectionIcon(sectionId: string): string {
  return GIST_SECTION_ICONS[sectionId] ?? 'forum';
}
