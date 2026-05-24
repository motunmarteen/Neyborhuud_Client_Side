'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OSM_MAP_STYLE } from '@/lib/map-style';

interface MapLocation {
    lat: number;
    lng: number;
}

export type MapOverlayPoint = { lat: number; lng: number; id?: string; weight?: number };

export type MapOverlay =
    | { type: 'danger_heatmap'; points: MapOverlayPoint[] }
    | { type: 'safe_zones'; points: MapOverlayPoint[] }
    | { type: 'event_density'; points: MapOverlayPoint[] }
    | { type: 'emergency_pulse'; points: MapOverlayPoint[] }
    | { type: 'commerce'; points: MapOverlayPoint[] };

interface InteractiveMapProps {
    center: MapLocation;
    draggable?: boolean;
    height?: string;
    onLocationChange?: (location: MapLocation) => void;
    zoom?: number;
    showSkeleton?: boolean;
    className?: string;
    accuracyRadius?: number;
    customMarkerNode?: React.ReactNode;
    markerInteractive?: boolean;
    dragHintLabel?: string;
    /** Floating pill at map bottom — off for fullscreen signup where hint lives in the sheet */
    showDragHint?: boolean;
    /** MapLibre +/- zoom control */
    showNavigationControl?: boolean;
    /** OpenStreetMap compact attribution (i) badge */
    showAttribution?: boolean;
    /** MapLibre zoom control corner — bottom-right is hidden under signup sheets */
    navigationControlPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    overlays?: MapOverlay[];
    onLongPressMap?: (location: MapLocation) => void;
}

function pointsFeatureCollection(points: MapOverlayPoint[]): GeoJSON.FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: points.map((p, i) => ({
            type: 'Feature',
            properties: { id: p.id ?? `pt-${i}`, weight: p.weight ?? 1 },
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        })),
    };
}

const OVERLAY_PAINT: Record<MapOverlay['type'], { color: string; opacity: number; radius: number }> = {
    danger_heatmap: { color: '#FF0000', opacity: 0.2, radius: 28 },
    safe_zones: { color: '#00D431', opacity: 0.15, radius: 22 },
    event_density: { color: '#0000FF', opacity: 0.2, radius: 20 },
    emergency_pulse: { color: '#FF0000', opacity: 0.35, radius: 16 },
    commerce: { color: '#006F35', opacity: 0.2, radius: 18 },
};

export function InteractiveMap({
    center,
    draggable = true,
    height = '200px',
    onLocationChange,
    zoom = 15,
    showSkeleton = true,
    className = '',
    accuracyRadius,
    customMarkerNode,
    markerInteractive = false,
    dragHintLabel = 'Tap or drag to adjust',
    showDragHint = true,
    showNavigationControl = true,
    showAttribution = true,
    navigationControlPosition = 'bottom-right',
    overlays = [],
    onLongPressMap,
}: InteractiveMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const onLocationChangeRef = useRef(onLocationChange);
    const onLongPressRef = useRef(onLongPressMap);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(false);
    const [markerEl, setMarkerEl] = useState<HTMLDivElement | null>(null);
    const [markerPosition, setMarkerPosition] = useState(center);

    onLocationChangeRef.current = onLocationChange;
    onLongPressRef.current = onLongPressMap;

    useEffect(() => {
        setMarkerPosition(center);
    }, [center.lat, center.lng]);

    useEffect(() => {
        if (!containerRef.current) return;

        let map: maplibregl.Map;
        try {
            map = new maplibregl.Map({
                container: containerRef.current,
                style: OSM_MAP_STYLE,
                center: [center.lng, center.lat],
                zoom,
                attributionControl: showAttribution ? { compact: true } : false,
            });
            if (showNavigationControl) {
                map.addControl(
                    new maplibregl.NavigationControl({ showCompass: false }),
                    navigationControlPosition,
                );
            }

            map.on('load', () => {
                if (accuracyRadius) {
                    map.addSource('accuracy', {
                        type: 'geojson',
                        data: pointGeoJson(center.lng, center.lat),
                    });
                    map.addLayer({
                        id: 'accuracy-circle',
                        type: 'circle',
                        source: 'accuracy',
                        paint: {
                            'circle-radius': accuracyRadius / 0.5,
                            'circle-color': '#0000FF',
                            'circle-opacity': 0.12,
                            'circle-stroke-color': '#0000FF',
                            'circle-stroke-width': 2,
                            'circle-stroke-opacity': 0.35,
                        },
                    });
                }

                overlays.forEach((layer, idx) => {
                    const id = `overlay-${layer.type}-${idx}`;
                    const paint = OVERLAY_PAINT[layer.type];
                    map.addSource(id, { type: 'geojson', data: pointsFeatureCollection(layer.points) });
                    map.addLayer({
                        id: `${id}-circle`,
                        type: 'circle',
                        source: id,
                        paint: {
                            'circle-radius': paint.radius,
                            'circle-color': paint.color,
                            'circle-opacity': paint.opacity,
                            'circle-blur': layer.type === 'danger_heatmap' ? 0.85 : 0.5,
                        },
                    });
                });

                setReady(true);
            });

            if (draggable) {
                map.on('click', (e) => {
                    const pos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                    setMarkerPosition(pos);
                    onLocationChangeRef.current?.(pos);
                });
            }

            map.on('mousedown', (e) => {
                if (!onLongPressRef.current) return;
                const pos = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                longPressTimer.current = setTimeout(() => onLongPressRef.current?.(pos), 500);
            });
            map.on('mouseup', () => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
            });
            map.on('dragstart', () => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
            });

            mapRef.current = map;
        } catch {
            setError(true);
            return;
        }

        const el = document.createElement('div');
        if (!customMarkerNode) {
            el.className = 'w-6 h-6 rounded-full border-[3px] border-white bg-brand-blue shadow-lg';
        } else {
            el.style.pointerEvents = markerInteractive ? 'auto' : 'none';
        }
        setMarkerEl(el);

        const marker = new maplibregl.Marker({
            element: el,
            draggable: draggable && (!customMarkerNode || markerInteractive),
        })
            .setLngLat([center.lng, center.lat])
            .addTo(map);

        marker.on('dragend', () => {
            const ll = marker.getLngLat();
            const pos = { lat: ll.lat, lng: ll.lng };
            setMarkerPosition(pos);
            onLocationChangeRef.current?.(pos);
        });
        markerRef.current = marker;

        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
            marker.remove();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
            setMarkerEl(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !ready) return;
        markerRef.current?.setLngLat([markerPosition.lng, markerPosition.lat]);
        map.easeTo({ center: [markerPosition.lng, markerPosition.lat], duration: 300 });
        const src = map.getSource('accuracy') as maplibregl.GeoJSONSource | undefined;
        src?.setData(pointGeoJson(markerPosition.lng, markerPosition.lat));

        overlays.forEach((layer, idx) => {
            const id = `overlay-${layer.type}-${idx}`;
            const s = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
            s?.setData(pointsFeatureCollection(layer.points));
        });
    }, [markerPosition, ready, overlays]);

    if (error) {
        return (
            <div className={`neu-socket rounded-2xl flex items-center justify-center ${className}`} style={{ height }}>
                <span className="text-[10px] text-[var(--neu-text-muted)]">Could not load map</span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ height }}>
            {!ready && showSkeleton && (
                <div className="absolute inset-0 z-10 neu-socket animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-[var(--neu-text-muted)] uppercase tracking-wider">Loading map…</span>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
            {markerEl && customMarkerNode && createPortal(customMarkerNode, markerEl)}
            {draggable && ready && showDragHint && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg pointer-events-none z-10">
                    <span className="text-[9px] font-bold text-brand-black/60 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-brand-blue">touch_app</span>
                        {dragHintLabel}
                    </span>
                </div>
            )}
        </div>
    );
}

function pointGeoJson(lng: number, lat: number): GeoJSON.Feature {
    return { type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} };
}

export function MiniMap(props: InteractiveMapProps & { height?: string }) {
    return <InteractiveMap {...props} showSkeleton height={props.height ?? '120px'} />;
}

export default InteractiveMap;
