import { GREEN_ROLE } from '@/lib/green-scale';

// The map style lives in lib/huudMapStyle.ts (M-01). The old raster style pulled tiles
// straight from tile.openstreetmap.org, which its usage policy does not allow for apps.

/** Geofence zone colours — brand tokens only (DESIGN.md §4). */
export const GEOFENCE_COLORS = {
    safe_zone: { stroke: GREEN_ROLE.forest, fill: GREEN_ROLE.deep },
    alert_zone: { stroke: GREEN_ROLE.brand, fill: GREEN_ROLE.brand },
    restricted_zone: { stroke: '#E5484D', fill: '#E5484D' },
} as const;

export type GeofenceColorKey = keyof typeof GEOFENCE_COLORS;
