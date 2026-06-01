/** Maps catalogue emoji icons to Material Symbols for consistent platform chrome. */
const EMOJI_TO_SYMBOL: Record<string, string> = {
  '👋': 'waving_hand',
  '✅': 'verified',
  '📝': 'edit_note',
  '🗣️': 'forum',
  '📣': 'campaign',
  '🎨': 'palette',
  '🤝': 'handshake',
  '🏛️': 'account_balance',
  '🔗': 'link',
  '🦸': 'supervisor_account',
  '🛍️': 'shopping_bag',
  '💰': 'payments',
  '🏆': 'emoji_events',
  '💼': 'work',
  '🏢': 'apartment',
  '🎉': 'celebration',
  '🎪': 'festival',
  '🔧': 'build',
  '⭐': 'star',
  '🛡️': 'shield',
  '🚨': 'emergency',
  '🔥': 'local_fire_department',
  '💎': 'diamond',
  '🪙': 'paid',
  '📌': 'push_pin',
  '📢': 'volume_up',
  '💬': 'chat',
  '🎤': 'mic',
  '✉️': 'mail',
  '📱': 'smartphone',
  '📰': 'newspaper',
  '🗞️': 'newspaper',
  '🌱': 'eco',
  '🌿': 'park',
  '🌳': 'forest',
  '🌲': 'nature',
  '🤜': 'sports_martial_arts',
  '🫱': 'volunteer_activism',
  '🏘️': 'home_work',
  '💭': 'psychology',
  '❤️': 'favorite',
  '⬆️': 'trending_up',
  '🏅': 'military_tech',
  '🎖️': 'military_tech',
  '⚔️': 'shield',
  '🌟': 'grade',
  '👑': 'workspace_premium',
  '💜': 'favorite',
};

export function resolveBadgeSymbol(icon?: string): string {
  if (!icon) return 'military_tech';
  if (icon.startsWith('http') || icon.startsWith('/')) return 'military_tech';
  return EMOJI_TO_SYMBOL[icon] ?? 'military_tech';
}

export function isBadgeImageIcon(icon?: string): boolean {
  return !!icon && (icon.startsWith('http') || icon.startsWith('/'));
}
