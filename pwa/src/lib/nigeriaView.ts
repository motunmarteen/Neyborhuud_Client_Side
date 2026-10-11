import { extractUserMapCoords, type MapUserLike } from '@/lib/mapUserLocation';

/**
 * Where maps start (owner, 2026-10-11: "we are building for the whole of Nigeria").
 * Maps open on the person's own area when we know it; otherwise on all of Nigeria.
 * Never a Lagos (or any one city) default.
 */
export type MapView = { center: { lat: number; lng: number }; zoom: number };

/** The whole country in view on a phone (36 states + FCT). Prefer NIGERIA_BOUNDS, which fits any screen. */
export const NIGERIA_VIEW: MapView = { center: { lat: 9.08, lng: 8.68 }, zoom: 4.9 };

/** Nigeria's outline, south-west to north-east: maps fit this when no area is known. */
export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [
  [2.67, 4.27],
  [14.68, 13.89],
];

/** Street level around a known point. */
export const STREET_ZOOM = 15.5;

export function startView(user?: MapUserLike | null): MapView {
  const coords = user ? extractUserMapCoords(user) : null;
  return coords ? { center: coords, zoom: STREET_ZOOM } : NIGERIA_VIEW;
}
