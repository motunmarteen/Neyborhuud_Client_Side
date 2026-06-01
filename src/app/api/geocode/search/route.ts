/**
 * Server-side proxy for Nominatim forward geocoding (address search).
 */

import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'NeyborHuud-PWA/1.0 (https://neyborhuud.com)';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'q is required (min 2 chars)' }, { status: 400 });
  }

  const upstream = new URL(NOMINATIM_SEARCH);
  upstream.searchParams.set('format', 'json');
  upstream.searchParams.set('q', q);
  upstream.searchParams.set('limit', '1');

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
