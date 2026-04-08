'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { InteractiveMap } from './InteractiveMap';
import { reverseGeocode, type LocationAddress } from '@/lib/reverseGeocode';

interface MapLocation {
    lat: number;
    lng: number;
}

interface LocationPickerProps {
    /** Initial location */
    initialLocation?: MapLocation | null;
    /** GPS accuracy in meters */
    accuracy?: number;
    /** Callback when location is selected/updated */
    onLocationSelect?: (location: MapLocation, address: LocationAddress | null) => void;
    /** Height of the map */
    mapHeight?: string;
    /** Whether location is currently being detected */
    isDetecting?: boolean;
    /** Error message to display */
    error?: string | null;
    /** Show the retry button */
    showRetry?: boolean;
    /** Retry callback */
    onRetry?: () => void;
    /** Label text above the component */
    label?: string;
    /** Whether the map is read-only (display only) */
    readOnly?: boolean;
}

export function LocationPicker({
    initialLocation,
    accuracy,
    onLocationSelect,
    mapHeight = '180px',
    isDetecting = false,
    error,
    showRetry = true,
    onRetry,
    label = 'Your Location',
    readOnly = false,
}: LocationPickerProps) {
    const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(initialLocation || null);
    const [address, setAddress] = useState<LocationAddress | null>(null);
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);

    // Update current location when initial changes
    useEffect(() => {
        if (initialLocation) {
            setCurrentLocation(initialLocation);
        }
    }, [initialLocation?.lat, initialLocation?.lng]);

    // Resolve address when location changes
    useEffect(() => {
        if (currentLocation) {
            resolveAddress(currentLocation);
        }
    }, [currentLocation?.lat, currentLocation?.lng]);

    const resolveAddress = async (location: MapLocation) => {
        setIsResolvingAddress(true);
        try {
            const result = await reverseGeocode(location.lat, location.lng);
            setAddress(result);
        } catch (e) {
            console.error('Failed to resolve address:', e);
            setAddress(null);
        } finally {
            setIsResolvingAddress(false);
        }
    };

    const handleLocationChange = useCallback((newLocation: MapLocation) => {
        setCurrentLocation(newLocation);
        // Address will be resolved via useEffect
        // Notify parent after address is resolved
        setTimeout(async () => {
            const newAddress = await reverseGeocode(newLocation.lat, newLocation.lng);
            onLocationSelect?.(newLocation, newAddress);
        }, 100);
    }, [onLocationSelect]);

    // Format accuracy for display
    const formatAccuracy = (meters: number): string => {
        if (meters < 100) return `±${Math.round(meters)}m`;
        if (meters < 1000) return `±${Math.round(meters / 10) * 10}m`;
        return `±${(meters / 1000).toFixed(1)}km`;
    };

    // Determine accuracy quality
    const getAccuracyQuality = (meters: number): 'excellent' | 'good' | 'fair' | 'poor' => {
        if (meters < 50) return 'excellent';
        if (meters < 200) return 'good';
        if (meters < 1000) return 'fair';
        return 'poor';
    };

    const accuracyQuality = accuracy ? getAccuracyQuality(accuracy) : null;
    const accuracyColors = {
        excellent: 'text-green-500',
        good: 'text-primary',
        fair: 'text-orange-400',
        poor: 'text-red-400',
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Label with accuracy indicator */}
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                    {label}
                </span>
                {accuracy && accuracyQuality && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${accuracyColors[accuracyQuality]}`}>
                        <i className="bi bi-broadcast"></i>
                        {formatAccuracy(accuracy)}
                        {accuracyQuality === 'excellent' && ' GPS'}
                        {accuracyQuality === 'poor' && ' (Approximate)'}
                    </span>
                )}
            </div>

            {/* Map or detecting state */}
            {isDetecting && !currentLocation ? (
                <div className="neu-socket rounded-2xl flex items-center justify-center" style={{ height: mapHeight }}>
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                            <i className="bi bi-geo-alt text-3xl text-brand-blue animate-bounce"></i>
                            <div className="absolute inset-0 animate-ping">
                                <i className="bi bi-geo-alt text-3xl text-brand-blue/30"></i>
                            </div>
                        </div>
                        <span className="text-[10px] text-charcoal/50 font-medium uppercase tracking-wider">
                            Detecting your location...
                        </span>
                    </div>
                </div>
            ) : currentLocation ? (
                <InteractiveMap
                    center={currentLocation}
                    draggable={!readOnly}
                    height={mapHeight}
                    onLocationChange={handleLocationChange}
                    zoom={16}
                    accuracyRadius={accuracy && accuracy < 500 ? accuracy : undefined}
                    className="shadow-lg"
                />
            ) : (
                <div className="neu-socket rounded-2xl flex items-center justify-center" style={{ height: mapHeight }}>
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                        <i className="bi bi-geo-alt-fill text-3xl text-charcoal/20"></i>
                        <span className="text-[10px] text-charcoal/40 font-medium">
                            Location not available
                        </span>
                        {showRetry && onRetry && (
                            <button
                                type="button"
                                onClick={onRetry}
                                className="text-[9px] font-black uppercase tracking-widest text-brand-blue bg-brand-blue/10 px-3 py-1.5 rounded-lg hover:bg-brand-blue/20 transition-colors"
                            >
                                Enable Location
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Address display */}
            <div className={`
                flex items-center justify-between p-3 rounded-xl transition-all
                ${currentLocation ? 'neu-socket ring-1 ring-primary/20' : 'neu-socket'}
            `}>
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className={`w-2 h-2 shrink-0 rounded-full ${currentLocation ? 'bg-primary animate-pulse' : 'bg-charcoal/30'}`}></div>
                    <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] truncate" style={{ color: 'var(--neu-text)' }}>
                            {isResolvingAddress ? 'Resolving address...' :
                                address?.formatted ? address.formatted :
                                    address ? `${address.lga}, ${address.state}` :
                                        currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` :
                                            'Waiting for location...'}
                        </span>
                        {address?.neighborhood && address.neighborhood !== address.lga && (
                            <span className="text-[9px] truncate" style={{ color: 'var(--neu-text-muted)' }}>
                                {address.neighborhood}
                            </span>
                        )}
                    </div>
                </div>

                {/* Coordinates button */}
                {currentLocation && (
                    <button
                        type="button"
                        onClick={() => {
                            const url = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
                            window.open(url, '_blank');
                        }}
                        className="shrink-0 ml-2 w-8 h-8 rounded-lg neu-btn flex items-center justify-center group"
                        title="Open in Google Maps"
                    >
                        <i className="bi bi-box-arrow-up-right text-xs text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200">
                    <i className="bi bi-exclamation-triangle text-orange-500"></i>
                    <span className="text-[10px] text-orange-600 font-medium">{error}</span>
                </div>
            )}

            {/* Instructions when draggable */}
            {!readOnly && currentLocation && (
                <p className="text-[9px] text-center" style={{ color: 'var(--neu-text-muted)' }}>
                    Not accurate? Tap on the map or drag the pin to adjust your location.
                </p>
            )}
        </div>
    );
}

export default LocationPicker;
