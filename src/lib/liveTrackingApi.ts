import type {
  KidnappingTrackingSession,
  TrackingLocationPoint,
  TrackingSummary,
} from '@/services/safety.service';

function unwrapData(res: unknown): Record<string, unknown> | null {
  if (!res || typeof res !== 'object') return null;
  const root = res as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return root;
}

export function extractTrackingSession(res: unknown): KidnappingTrackingSession | null {
  const d = unwrapData(res);
  if (!d) return null;
  if (d.session && typeof d.session === 'object') return d.session as KidnappingTrackingSession;
  if (d._id && d.status) return d as unknown as KidnappingTrackingSession;
  return null;
}

function toCoord(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Normalize heterogeneous API / socket payloads into a trail point. */
export function normalizeTrackingPoint(raw: unknown): TrackingLocationPoint | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;

  let lat: number | undefined;
  let lng: number | undefined;
  let address: string | undefined;

  const loc = p.location;
  if (loc && typeof loc === 'object') {
    const l = loc as Record<string, unknown>;
    lat = toCoord(l.lat ?? l.latitude);
    lng = toCoord(l.lng ?? l.longitude);
    address = typeof l.address === 'string' ? l.address : undefined;
  }

  if (lat == null) lat = toCoord(p.lat ?? p.latitude);
  if (lng == null) lng = toCoord(p.lng ?? p.longitude);

  if (lat == null || lng == null) return null;

  const timestamp = String(
    p.timestamp ?? p.capturedAt ?? p.createdAt ?? new Date().toISOString(),
  );
  const sourceRaw = String(p.source ?? 'gps');
  const source = sourceRaw as TrackingLocationPoint['source'];

  return {
    _id: String(p._id ?? p.id ?? ''),
    location: { lat, lng, address },
    source,
    accuracy: toCoord(p.accuracy),
    speed: toCoord(p.speed),
    heading: toCoord(p.heading),
    battery: toCoord(p.battery),
    networkType: typeof p.networkType === 'string' ? p.networkType : undefined,
    timestamp,
  };
}

export function extractLocationPoints(res: unknown): TrackingLocationPoint[] {
  const d = unwrapData(res);
  if (!d) return [];

  const arrays = [d.points, d.locations, d.history, d.locationHistory, d.trail];
  for (const candidate of arrays) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => normalizeTrackingPoint(item))
        .filter((p): p is TrackingLocationPoint => p != null);
    }
  }

  if (Array.isArray(res)) {
    return res
      .map((item) => normalizeTrackingPoint(item))
      .filter((p): p is TrackingLocationPoint => p != null);
  }

  if (d.location) {
    const fromLocation = normalizeTrackingPoint(d.location);
    if (fromLocation) return [fromLocation];
  }

  const single = normalizeTrackingPoint(d);
  return single ? [single] : [];
}

export function extractTrackingSummary(res: unknown): TrackingSummary | null {
  const d = unwrapData(res);
  if (!d) return null;
  if (d.summary && typeof d.summary === 'object') return d.summary as TrackingSummary;
  if (
    typeof d.totalDistanceMeters === 'number' ||
    typeof d.totalPoints === 'number' ||
    typeof d.durationSeconds === 'number'
  ) {
    return d as unknown as TrackingSummary;
  }
  return null;
}
