/**
 * Server-side proxy for OpenStreetMap Nominatim reverse geocoding.
 * Browsers cannot call nominatim.openstreetmap.org directly (CORS / policy).
 */

import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'NeyborHuud-PWA/1.0 (https://neyborhuud.com)';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon') ?? searchParams.get('lng');
  const zoom = searchParams.get('zoom');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return NextResponse.json({ error: 'invalid coordinates' }, { status: 400 });
  }

  const upstream = new URL(NOMINATIM_REVERSE);
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('lat', String(latNum));
  upstream.searchParams.set('lon', String(lonNum));
  upstream.searchParams.set('addressdetails', '1');
  if (zoom) upstream.searchParams.set('zoom', zoom);

  try {
    const response = await fetch(upstream.toString(), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Nominatim request failed' },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return NextResponse.json({ error: 'Geocode service unavailable' }, { status: 502 });
  }
}
