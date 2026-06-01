/** Nominatim address block from reverse geocode. */
export type NominatimAddress = Record<string, string | undefined>;

export type NominatimReverseResult = {
  address?: NominatimAddress;
  display_name?: string;
};

/**
 * Reverse geocode via our Next.js API (server proxies Nominatim — no browser CORS).
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

  try {
    const response = await fetch(`/api/geocode/reverse?${params}`, {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 8_000),
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

  try {
    const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(options?.timeoutMs ?? 8_000),
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
