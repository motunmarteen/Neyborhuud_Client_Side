import { getStoredCommunity, type StoredCommunity } from '@/lib/communityContext';
import type { LocationData } from '@/types/api';

type HuudNameUser = {
  location?: LocationData | null;
};

function fromLocation(location?: LocationData | null): string | null {
  if (!location) return null;

  if (location.neighborhood?.trim()) return location.neighborhood.trim();
  if (location.ward?.trim()) return location.ward.trim();
  if (location.lga?.trim()) return location.lga.trim();
  if (location.formattedAddress?.trim()) {
    const first = location.formattedAddress.split(',')[0]?.trim();
    if (first) return first;
  }
  if (location.state?.trim()) return location.state.trim();

  return null;
}

function fromCommunity(community?: StoredCommunity | null): string | null {
  if (!community) return null;
  if (community.name?.trim()) return community.name.trim();
  if (community.communityName?.trim()) return community.communityName.trim();
  return null;
}

/** Best-effort Huud / neighborhood label for sidebar, welcome sheets, and setup flows. */
export function resolveHuudDisplayName(
  user?: HuudNameUser | null,
  community?: StoredCommunity | null,
): string {
  const storedCommunity =
    community ?? (typeof window !== 'undefined' ? getStoredCommunity() : null);

  return (
    fromCommunity(storedCommunity)
    ?? fromLocation(user?.location)
    ?? 'Your Huud'
  );
}

/** Feed sky hero eyebrow — e.g. "Alimosho Central right now". */
export function resolveHuudFeedLabel(
  user?: HuudNameUser | null,
  community?: StoredCommunity | null,
): string {
  return `${resolveHuudDisplayName(user, community)} right now`;
}
