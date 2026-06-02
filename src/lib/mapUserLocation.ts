/**
 * Normalize user location fields from API payloads for map markers.
 * GeoJSON stores [longitude, latitude].
 */

export type MapUserLike = {
  _id?: string;
  id?: string;
  geoLocation?: { type?: string; coordinates?: [number, number] };
  currentLocation?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  };
  primaryLocation?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  };
};

export function extractUserMapCoords(user: MapUserLike): { lat: number; lng: number } | null {
  const coords = user.geoLocation?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    const [lng, lat] = coords;
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
  }

  for (const loc of [user.currentLocation, user.primaryLocation]) {
    if (!loc) continue;
    const lat = loc.lat ?? loc.latitude;
    const lng = loc.lng ?? loc.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      if (lat !== 0 || lng !== 0) return { lat, lng };
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
