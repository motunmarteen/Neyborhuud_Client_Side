'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

interface MapLocation {
    lat: number;
    lng: number;
}

interface InteractiveMapProps {
    /** Initial center of the map */
    center: MapLocation;
    /** Whether to allow dragging the marker to adjust location */
    draggable?: boolean;
    /** Height of the map container */
    height?: string;
    /** Callback when location changes (via marker drag) */
    onLocationChange?: (location: MapLocation) => void;
    /** Zoom level (default 15) */
    zoom?: number;
    /** Show a loading skeleton while map loads */
    showSkeleton?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Show accuracy circle */
    accuracyRadius?: number;
}

const containerStyle = {
    width: '100%',
    borderRadius: '16px',
};

// Custom map styling for a clean, modern look
const mapStyles = [
    {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }]
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }]
    }
];

export function InteractiveMap({
    center,
    draggable = true,
    height = '200px',
    onLocationChange,
    zoom = 15,
    showSkeleton = true,
    className = '',
    accuracyRadius,
}: InteractiveMapProps) {
    const [markerPosition, setMarkerPosition] = useState<MapLocation>(center);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);

    // Load Google Maps script
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    // Update marker when center prop changes
    useEffect(() => {
        setMarkerPosition(center);
        if (mapInstance) {
            mapInstance.panTo(center);
        }
    }, [center.lat, center.lng, mapInstance]);

    // Handle accuracy circle
    useEffect(() => {
        if (mapInstance && accuracyRadius) {
            // Remove existing circle
            if (circleRef.current) {
                circleRef.current.setMap(null);
            }

            // Create new accuracy circle
            circleRef.current = new google.maps.Circle({
                strokeColor: '#6B9FED',
                strokeOpacity: 0.4,
                strokeWeight: 2,
                fillColor: '#6B9FED',
                fillOpacity: 0.15,
                map: mapInstance,
                center: markerPosition,
                radius: accuracyRadius,
            });
        }

        return () => {
            if (circleRef.current) {
                circleRef.current.setMap(null);
            }
        };
    }, [mapInstance, accuracyRadius, markerPosition.lat, markerPosition.lng]);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        setMapInstance(map);
    }, []);

    const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPosition = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            };
            setMarkerPosition(newPosition);
            onLocationChange?.(newPosition);
        }
    }, [onLocationChange]);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (draggable && e.latLng) {
            const newPosition = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            };
            setMarkerPosition(newPosition);
            onLocationChange?.(newPosition);
        }
    }, [draggable, onLocationChange]);

    // Loading skeleton
    if (!isLoaded) {
        if (showSkeleton) {
            return (
                <div 
                    className={`neu-socket rounded-2xl animate-pulse flex items-center justify-center ${className}`}
                    style={{ height }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <i className="bi bi-geo-alt text-2xl text-charcoal/20"></i>
                        <span className="text-[10px] text-charcoal/30 font-medium uppercase tracking-wider">
                            Loading Map...
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    }

    // Error state
    if (loadError) {
        return (
            <div 
                className={`neu-socket rounded-2xl flex items-center justify-center ${className}`}
                style={{ height }}
            >
                <div className="flex flex-col items-center gap-2 text-center px-4">
                    <i className="bi bi-exclamation-triangle text-2xl text-orange-400"></i>
                    <span className="text-[10px] text-charcoal/50 font-medium">
                        Could not load map
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <GoogleMap
                mapContainerStyle={{ ...containerStyle, height }}
                center={markerPosition}
                zoom={zoom}
                onLoad={onMapLoad}
                onClick={onMapClick}
                options={{
                    styles: mapStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                    zoomControlOptions: {
                        position: google.maps.ControlPosition.RIGHT_BOTTOM,
                    },
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                }}
            >
                <Marker
                    position={markerPosition}
                    draggable={draggable}
                    onDragEnd={onMarkerDragEnd}
                    animation={google.maps.Animation.DROP}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: '#6B9FED',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    }}
                />
            </GoogleMap>

            {/* Drag hint overlay */}
            {draggable && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
                    <span className="text-[9px] font-bold text-charcoal/60 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="bi bi-hand-index-thumb text-brand-blue"></i>
                        Tap or drag to adjust
                    </span>
                </div>
            )}
        </div>
    );
}

// Compact version for inline display
export function MiniMap({
    center,
    height = '120px',
    className = '',
}: {
    center: MapLocation;
    height?: string;
    className?: string;
}) {
    return (
        <InteractiveMap
            center={center}
            draggable={false}
            height={height}
            zoom={14}
            showSkeleton={true}
            className={className}
        />
    );
}

export default InteractiveMap;
