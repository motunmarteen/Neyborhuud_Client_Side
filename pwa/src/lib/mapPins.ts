import apiClient from '@/lib/api-client';
import { fromKobo } from '@/lib/currency';
import type { PinRing } from '@/components/map/Pins';

/**
 * Live pins on the map home (tracker M-07). The server snaps every position to a ~110 m
 * grid cell and merges what is in one cell, so a pin never shows an exact spot.
 */
export type MapLayer = 'safety' | 'traffic' | 'light_water' | 'market' | 'work' | 'events' | 'help';

export type MapPin = {
  id: string;
  layer: MapLayer;
  lat: number;
  lng: number;
  count: number;
  top: {
    id: string;
    title: string;
    sourceType: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    price?: number;
    startsAt?: string;
  };
  live: boolean;
};

/** Order of the layer chips, and how each layer's pin looks (F-10 pins). */
export const LAYERS: { key: MapLayer; label: string; emoji: string; ring?: PinRing }[] = [
  { key: 'safety', label: 'Safety', emoji: '🚨', ring: 'red' },
  { key: 'traffic', label: 'Traffic', emoji: '🚧' },
  { key: 'light_water', label: 'Light & water', emoji: '💡', ring: 'amber' },
  { key: 'market', label: 'Market', emoji: '🛒' },
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'events', label: 'Events', emoji: '🎉' },
  { key: 'help', label: 'Help', emoji: '🙋🏾', ring: 'purple' },
];
export const LAYER_META = Object.fromEntries(LAYERS.map((l) => [l.key, l])) as Record<MapLayer, (typeof LAYERS)[number]>;

/** The server refuses boxes larger than this (keep in step with mapPins.service MAX_SPAN_DEG). */
export const MAX_SPAN_DEG = 0.25;

export type BBox = [west: number, south: number, east: number, north: number];

export async function fetchMapPins(bbox: BBox, layers: MapLayer[]): Promise<MapPin[]> {
  const res = await apiClient.get<{ pins: MapPin[] }>('/geo/map-pins', {
    params: { bbox: bbox.map((n) => n.toFixed(5)).join(','), layers: layers.join(',') },
  });
  return (res as { data?: { pins?: MapPin[] } })?.data?.pins ?? [];
}

/** ₦180k-style price for a market pin's tag. */
export function shortNaira(kobo?: number): string | undefined {
  if (kobo == null) return undefined;
  const n = fromKobo(kobo);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${Math.round(n)}`;
}

/** What the pin says to screen readers. */
export function pinLabel(p: MapPin): string {
  const meta = LAYER_META[p.layer];
  const more = p.count > 1 ? `, and ${p.count - 1} more here` : '';
  return `${meta.label}: ${p.top.title}${more}`;
}

/** Where a pin opens until the pin panels (M-09) arrive. */
export function pinHref(p: MapPin): string {
  switch (p.top.sourceType) {
    case 'product':
      return `/marketplace/${p.top.id}`;
    case 'job':
      return `/jobs/${p.top.id}`;
    case 'event_page':
      return `/events/${p.top.id}`;
    case 'incident':
      return `/incident-reports/${p.top.id}`;
    case 'help_request':
      return `/help-request/${p.top.id}`;
    default:
      return `/feed?post=${p.top.id}`;
  }
}
