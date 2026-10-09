import { NextRequest, NextResponse } from 'next/server';
import { rateLimitGeocode, clampInt } from '../_guard';

const USER_AGENT = 'NeyborHuud-PWA/1.0 (https://neyborhuud.com)';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = rateLimitGeocode(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim().slice(0, 200);
  const limit = String(clampInt(searchParams.get('limit'), 1, 10, 5));

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const upstream = new URL('https://nominatim.openstreetmap.org/search');
    upstream.searchParams.set('format', 'json');
    upstream.searchParams.set('q', q);
    upstream.searchParams.set('limit', limit);
    upstream.searchParams.set('countrycodes', 'ng');

    const response = await fetch(upstream.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    });
  } catch {
    return NextResponse.json([]);
  }
}
