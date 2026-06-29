import type { StyleSpecification } from 'maplibre-gl';
import { GREEN_ROLE } from '@/lib/green-scale';

/** Shared OSM raster style — used by InteractiveMap and GeofenceMap (DESIGN.md §17). */
export const OSM_MAP_STYLE: StyleSpecification = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap',
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

/** Geofence zone colours — brand tokens only (DESIGN.md §4). */
export const GEOFENCE_COLORS = {
    safe_zone: { stroke: GREEN_ROLE.forest, fill: GREEN_ROLE.deep },
    alert_zone: { stroke: GREEN_ROLE.brand, fill: GREEN_ROLE.brand },
    restricted_zone: { stroke: '#FF0000', fill: '#FF0000' },
} as const;

export type GeofenceColorKey = keyof typeof GEOFENCE_COLORS;
