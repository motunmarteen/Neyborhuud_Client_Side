/**
 * Check whether the current user is located in Nigeria.
 * Checks user profile (localStorage + sessionStorage) and community context.
 */

const NIGERIAN_STATES = new Set([
  'abia', 'adamawa', 'akwa ibom', 'anambra', 'bauchi', 'bayelsa', 'benue',
  'borno', 'cross river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu',
  'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi',
  'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo',
  'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara',
  'fct', 'federal capital territory', 'abuja',
]);

export function isUserInNigeria(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // 1) Check community context — most reliable, always in localStorage
    const communityRaw = localStorage.getItem('neyborhuud_community');
    if (communityRaw) {
      const community = JSON.parse(communityRaw);
      const cState = (community.state ?? '').toLowerCase().trim();
      if (cState && NIGERIAN_STATES.has(cState)) return true;
      const cLga = community.lga ?? '';
      if (cLga) return true;
      // If community exists at all, user went through Nigerian community assignment
      if (community.id) return true;
    }

    // 2) Check user profile — may be in localStorage or sessionStorage
    const raw = localStorage.getItem('neyborhuud_user')
      || sessionStorage.getItem('neyborhuud_user');
    if (!raw) return false;

    const user = JSON.parse(raw);

    // Check assignedCommunityId — if present, user is in a Nigerian community
    if (user.assignedCommunityId) return true;

    // Check state field
    const state = (user.state ?? user.location?.state ?? '').toLowerCase().trim();
    if (state && NIGERIAN_STATES.has(state)) return true;

    // Check if user has an LGA (Nigeria-specific concept)
    const lga = user.lga ?? user.location?.lga ?? '';
    if (lga) return true;

    // Check formattedAddress for "Nigeria"
    const addr = (user.location?.formattedAddress ?? '').toLowerCase();
    if (addr.includes('nigeria')) return true;

    // Check country field
    const country = (user.country ?? user.location?.country ?? '').toLowerCase().trim();
    if (country === 'nigeria' || country === 'ng') return true;

    return false;
  } catch {
    return false;
  }
}
