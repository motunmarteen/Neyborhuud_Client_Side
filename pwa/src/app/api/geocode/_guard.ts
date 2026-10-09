import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared guard for the Nominatim proxy routes.
 *
 * These routes call a free public service under OUR User-Agent; OSM's usage
 * policy (≈1 req/s) means an unthrottled public proxy gets that identity
 * banned for every resident. Each client IP gets a small budget per minute
 * (per server instance), and inputs are bounded before being forwarded.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip') || 'unknown').trim();
}

/** Returns a 429 response when the caller is over budget, otherwise null. */
export function rateLimitGeocode(request: NextRequest): NextResponse | null {
  const now = Date.now();
  const ip = clientIp(request);
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else if (++entry.count > MAX_PER_WINDOW) {
    return NextResponse.json(
      { error: 'Too many location lookups. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } },
    );
  }
  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 10_000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  return null;
}

export function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
