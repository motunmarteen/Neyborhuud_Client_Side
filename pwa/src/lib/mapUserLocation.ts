/**
 * Normalize user location fields from API payloads for map markers.
 * GeoJSON stores [longitude, latitude].
 */

type LatLngLike = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export type MapUserLike = {
  _id?: string;
  id?: string;
  geoLocation?: { type?: string; coordinates?: [number, number] };
  // Better Auth persists primary/current location as a JSON STRING, but some
  // payloads return it already parsed as an object — accept both.
  currentLocation?: LatLngLike | string;
  primaryLocation?: LatLngLike | string;
};

/** primary/current location may arrive as a JSON string or an object. */
function asLocObject(loc: LatLngLike | string | undefined): LatLngLike | null {
  if (!loc) return null;
  if (typeof loc === 'string') {
    try {
      const parsed = JSON.parse(loc);
      return parsed && typeof parsed === 'object' ? (parsed as LatLngLike) : null;
    } catch {
      return null;
    }
  }
  return loc;
}

export function extractUserMapCoords(user: MapUserLike): { lat: number; lng: number } | null {
  const coords = user.geoLocation?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lng, lat] = coords;
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
  }

  for (const raw of [user.currentLocation, user.primaryLocation]) {
    const loc = asLocObject(raw);
    if (!loc) continue;
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      if (lat !== 0 || lng !== 0) return { lat, lng };
    }
  }

  return null;
}

/**
 * Registered-HOME coordinates for the Connect map.
 * Prioritises `primaryLocation` (the location the user declared at signup) and
 * deliberately ignores `currentLocation`/live GPS — we plot where a neighbour
 * says they live, not where their phone currently is.
 */
export function extractUserHomeCoords(user: MapUserLike): { lat: number; lng: number } | null {
  const loc = asLocObject(user.primaryLocation);
  if (loc) {
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      (lat !== 0 || lng !== 0)
    ) {
      return { lat, lng };
    }
  }
  return null;
}

export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function unwrapNearbyUsersPayload(res: unknown): MapUserLike[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as Record<string, unknown>;
  const data = root.data ?? root;
  if (Array.isArray(data)) return data as MapUserLike[];
  if (data && typeof data === 'object') {
    const users = (data as Record<string, unknown>).users;
    if (Array.isArray(users)) return users as MapUserLike[];
  }
  return [];
}
