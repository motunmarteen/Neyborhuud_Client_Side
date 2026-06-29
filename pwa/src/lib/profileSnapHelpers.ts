const ZODIAC = [
  { sign: 'Capricorn', emoji: '♑', start: [1, 1], end: [1, 19] },
  { sign: 'Aquarius', emoji: '♒', start: [1, 20], end: [2, 18] },
  { sign: 'Pisces', emoji: '♓', start: [2, 19], end: [3, 20] },
  { sign: 'Aries', emoji: '♈', start: [3, 21], end: [4, 19] },
  { sign: 'Taurus', emoji: '♉', start: [4, 20], end: [5, 20] },
  { sign: 'Gemini', emoji: '♊', start: [5, 21], end: [6, 20] },
  { sign: 'Cancer', emoji: '♋', start: [6, 21], end: [7, 22] },
  { sign: 'Leo', emoji: '♌', start: [7, 23], end: [8, 22] },
  { sign: 'Virgo', emoji: '♍', start: [8, 23], end: [9, 22] },
  { sign: 'Libra', emoji: '♎', start: [9, 23], end: [10, 22] },
  { sign: 'Scorpio', emoji: '♏', start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', emoji: '♐', start: [11, 22], end: [12, 21] },
  { sign: 'Capricorn', emoji: '♑', start: [12, 22], end: [12, 31] },
] as const;

export type ProfileNameSource = {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
  fullName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

export function capitalizeName(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return '';
      const parts = word.split('-');
      const capitalizedParts = parts.map((part) => {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      });
      return capitalizedParts.join('-');
    })
    .join(' ');
}

function isHandleLikeName(name: string, username?: string | null): boolean {
  const normalized = name.trim().toLowerCase();
  const handle = (username ?? '').trim().toLowerCase();
  if (!handle) return false;
  return normalized === handle || normalized === `@${handle}`;
}

/** Best-effort legal/display name from API shapes that vary by endpoint. */
export function resolveProfilePersonalName(
  source?: ProfileNameSource | null,
  username?: string | null,
): string {
  if (!source) return '';

  const firstName = String(source.firstName ?? source.first_name ?? '').trim();
  const lastName = String(source.lastName ?? source.last_name ?? '').trim();
  const middleName = String(source.middleName ?? '').trim();
  const fromParts = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  if (fromParts && !isHandleLikeName(fromParts, username ?? source.username)) {
    return capitalizeName(fromParts);
  }

  for (const candidate of [
    source.fullName,
    source.full_name,
    source.name,
    source.displayName,
  ]) {
    const value = String(candidate ?? '').trim();
    if (value && !isHandleLikeName(value, username ?? source.username)) {
      return capitalizeName(value);
    }
  }

  if (firstName && !isHandleLikeName(firstName, username ?? source.username)) {
    return capitalizeName(firstName);
  }

  if (lastName && !isHandleLikeName(lastName, username ?? source.username)) {
    return capitalizeName(lastName);
  }

  return '';
}

export function resolveProfileDisplayName(
  source?: ProfileNameSource | null,
  username?: string | null,
): string {
  const personalName = resolveProfilePersonalName(source, username);
  const handle = (username ?? source?.username ?? '').trim();
  return personalName || handle || 'Neighbour';
}

export function formatProfileBirthday(dateOfBirth?: string | null): string | null {
  if (!dateOfBirth) return null;
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function getZodiacFromBirthday(dateOfBirth?: string | null): { sign: string; emoji: string } | null {
  if (!dateOfBirth) return null;
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    const afterStart = month > sm || (month === sm && day >= sd);
    const beforeEnd = month < em || (month === em && day <= ed);
    if (afterStart && beforeEnd) return { sign: z.sign, emoji: z.emoji };
  }
  return null;
}

/** Same default as signup map — keeps profile hero aligned with auth flows. */
export const PROFILE_MAP_DEFAULT = { lat: 6.6059, lng: 3.2771 };

export type ProfileMapLocationSource = {
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  lastKnownLocation?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

function toCoord(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Resolve anchored map coordinates from heterogeneous profile payloads. */
export function resolveProfileMapCenter(
  source?: ProfileMapLocationSource | null,
): { lat: number; lng: number } | null {
  if (!source) return null;

  const loc = source.location;
  if (loc) {
    const lat = toCoord(loc.latitude ?? loc.lat);
    const lng = toCoord(loc.longitude ?? loc.lng);
    if (lat != null && lng != null) return { lat, lng };
  }

  const last = source.lastKnownLocation;
  if (last) {
    const lat = toCoord(last.latitude);
    const lng = toCoord(last.longitude);
    if (lat != null && lng != null) return { lat, lng };
  }

  return null;
}

export async function shareProfileUrl(username: string, displayName: string): Promise<boolean> {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/profile/${username}` : '';
  const title = `${displayName} on NeyborHuud`;
  const text = `Check out @${username} on NeyborHuud`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return false;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return true;
  }
  return false;
}
