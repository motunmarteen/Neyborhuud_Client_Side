import { NextRequest, NextResponse } from 'next/server';
import { rateLimitGeocode, clampInt } from '../_guard';

const USER_AGENT = 'NeyborHuud-PWA/1.0 (https://neyborhuud.com)';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = rateLimitGeocode(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon') || searchParams.get('lng');
  const zoom = String(clampInt(searchParams.get('zoom'), 0, 18, 18));

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing lat or lon query parameter' },
      { status: 400 },
    );
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum) || Math.abs(latNum) > 90 || Math.abs(lonNum) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  try {
    const upstream = new URL('https://nominatim.openstreetmap.org/reverse');
    upstream.searchParams.set('format', 'json');
    upstream.searchParams.set('lat', String(latNum));
    upstream.searchParams.set('lon', String(lonNum));
    upstream.searchParams.set('addressdetails', '1');
    if (zoom) upstream.searchParams.set('zoom', zoom);

    const response = await fetch(upstream.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Nominatim responded with status ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Reverse geocoding failed' },
      { status: 502 },
    );
  }
}
