import { IS_CAPACITOR_BUILD } from '@/lib/platform';

/** Nominatim address block from reverse geocode. */
export type NominatimAddress = Record<string, string | undefined>;

export type NominatimReverseResult = {
  address?: NominatimAddress;
  display_name?: string;
};

const NOMINATIM_ORIGIN = 'https://nominatim.openstreetmap.org';

/**
 * Resolve where geocode requests go.
 *
 * Priority:
 *  1. `NEXT_PUBLIC_GEOCODE_BASE` — explicit override (e.g. the Express backend
 *     proxy `https://api.neyborhuud.com/api/v1/geo/nominatim`). Set this in the
 *     native build to keep a single rate-limited User-Agent on the server.
 *  2. Native Capacitor build with no override → call Nominatim directly. The
 *     static export has no Next.js server, so the `/api/geocode/*` routes do
 *     not exist; the native WebView (capacitor:// origin) is not subject to the
 *     same browser CORS restriction a normal web page is.
 *  3. Web / PWA build → the existing Next.js server proxy at `/api/geocode/*`
 *     (unchanged behaviour).
 *
 * Returns `{ reverse, search }` fully-qualified URL builders.
 */
function resolveGeocodeEndpoints() {
  const override = process.env.NEXT_PUBLIC_GEOCODE_BASE?.replace(/\/$/, '');

  if (override) {
    return {
      reverse: (p: URLSearchParams) => `${override}/reverse?${p}`,
      search: (q: string) => `${override}/search?q=${encodeURIComponent(q)}`,
      direct: false as const,
    };
  }

  if (IS_CAPACITOR_BUILD) {
    return {
      reverse: (p: URLSearchParams) => {
        const u = new URLSearchParams(p);
        u.set('format', 'json');
        u.set('addressdetails', '1');
        return `${NOMINATIM_ORIGIN}/reverse?${u}`;
      },
      search: (q: string) => {
        const u = new URLSearchParams({ format: 'json', q, limit: '1' });
        return `${NOMINATIM_ORIGIN}/search?${u}`;
      },
      direct: true as const,
    };
  }

  return {
    reverse: (p: URLSearchParams) => `/api/geocode/reverse?${p}`,
    search: (q: string) => `/api/geocode/search?q=${encodeURIComponent(q)}`,
    direct: false as const,
  };
}

/**
 * Reverse geocode. Routes through the Next.js proxy on web, directly to
 * Nominatim on the native build, or a configured backend proxy when set.
 */
export async function fetchNominatimReverse(
  lat: number,
  lng: number,
  options?: { zoom?: number; timeoutMs?: number },
): Promise<NominatimReverseResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
  });
  if (options?.zoom != null) params.set('zoom', String(options.zoom));

  const endpoints = resolveGeocodeEndpoints();

  try {
    const response = await fetch(endpoints.reverse(params), {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 8_000),
      // Nominatim's usage policy asks for an identifying header; only send it
      // when calling them directly (the proxies set their own server-side).
      headers: endpoints.direct ? { Accept: 'application/json' } : undefined,
    });
    if (!response.ok) return null;
    return (await response.json()) as NominatimReverseResult;
  } catch {
    return null;
  }
}

export type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

/** Forward geocode via our Next.js API (server proxies Nominatim). */
export async function fetchNominatimSearch(
  query: string,
  options?: { timeoutMs?: number },
): Promise<NominatimSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const endpoints = resolveGeocodeEndpoints();

  try {
    const response = await fetch(endpoints.search(q), {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 8_000),
      headers: endpoints.direct ? { Accept: 'application/json' } : undefined,
    });
    if (!response.ok) return [];
    return (await response.json()) as NominatimSearchResult[];
  } catch {
    return [];
  }
}

export function cityLabelFromNominatimAddress(addr: NominatimAddress | undefined): string | null {
  if (!addr) return null;
  return (
    addr.suburb
    || addr.neighbourhood
    || addr.city_district
    || addr.town
    || addr.city
    || addr.village
    || addr.county
    || addr.state
    || null
  );
}
