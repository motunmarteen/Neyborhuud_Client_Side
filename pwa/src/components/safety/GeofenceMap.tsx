'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Geofence, GeofenceType } from '@/services/safety.service';
import { OSM_MAP_STYLE, GEOFENCE_COLORS } from '@/lib/map-style';

function circleRing(lng: number, lat: number, radiusMeters: number, steps = 64): GeoJSON.Polygon {
    const coords: [number, number][] = [];
    const earth = 6371000;
    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dx = radiusMeters * Math.cos(angle);
        const dy = radiusMeters * Math.sin(angle);
        const dLng = (dx / (earth * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
        const dLat = (dy / earth) * (180 / Math.PI);
        coords.push([lng + dLng, lat + dLat]);
    }
    return { type: 'Polygon', coordinates: [coords] };
}

function fencesToGeoJson(
    geofences: Geofence[],
    pending?: { lat: number; lng: number; radius: number; type: GeofenceType } | null
): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = geofences.map((fence) => ({
        type: 'Feature',
        properties: {
            label: fence.label,
            type: fence.type,
            pending: false,
            fill: GEOFENCE_COLORS[fence.type]?.fill ?? GEOFENCE_COLORS.safe_zone.fill,
            stroke: GEOFENCE_COLORS[fence.type]?.stroke ?? GEOFENCE_COLORS.safe_zone.stroke,
        },
        geometry: circleRing(fence.longitude, fence.latitude, fence.radiusMeters),
    }));

    if (pending) {
        const colors = GEOFENCE_COLORS[pending.type] ?? GEOFENCE_COLORS.safe_zone;
        features.push({
            type: 'Feature',
            properties: { label: 'Preview', type: pending.type, pending: true, fill: colors.fill, stroke: colors.stroke },
            geometry: circleRing(pending.lng, pending.lat, pending.radius),
        });
    }

    return { type: 'FeatureCollection', features };
}

interface Props {
    geofences: Geofence[];
    onMapClick?: (lat: number, lng: number) => void;
    pendingPin?: { lat: number; lng: number } | null;
    pendingRadius?: number;
    pendingType?: GeofenceType;
}

export default function GeofenceMap({
    geofences,
    onMapClick,
    pendingPin,
    pendingRadius = 200,
    pendingType = 'safe_zone',
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const onMapClickRef = useRef(onMapClick);
    onMapClickRef.current = onMapClick;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: OSM_MAP_STYLE,
            center: [3.3792, 6.5244],
            zoom: 13,
            attributionControl: false,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        map.on('load', () => {
            map.addSource('geofences', { type: 'geojson', data: fencesToGeoJson([]) });
            map.addLayer({
                id: 'geofence-fill',
                type: 'fill',
                source: 'geofences',
                paint: {
                    'fill-color': ['get', 'fill'],
                    'fill-opacity': ['case', ['get', 'pending'], 0.22, 0.15],
                },
            });
            map.addLayer({
                id: 'geofence-outline',
                type: 'line',
                source: 'geofences',
                paint: {
                    'line-color': ['get', 'stroke'],
                    'line-width': 2,
                    'line-dasharray': ['case', ['get', 'pending'], ['literal', [2, 2]], ['literal', [1, 0]]],
                },
            });
        });

        map.on('click', (e) => {
            onMapClickRef.current?.(e.lngLat.lat, e.lngLat.lng);
        });

        mapRef.current = map;
        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            const src = map.getSource('geofences') as maplibregl.GeoJSONSource | undefined;
            src?.setData(
                fencesToGeoJson(
                    geofences,
                    pendingPin ? { lat: pendingPin.lat, lng: pendingPin.lng, radius: pendingRadius, type: pendingType } : null
                )
            );
            if (pendingPin) {
                map.easeTo({ center: [pendingPin.lng, pendingPin.lat], duration: 400 });
            }
        };

        if (map.isStyleLoaded()) apply();
        else map.once('load', apply);
    }, [geofences, pendingPin, pendingRadius, pendingType]);

    return <div ref={containerRef} className="h-80 w-full rounded-2xl overflow-hidden bg-brand-surface" />;
}
