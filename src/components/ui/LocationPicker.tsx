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
    /** Visual treatment for feature-led signup surfaces */
    presentation?: 'default' | 'premium';
    /** Fallback map centre when no GPS yet (fullscreen signup) */
    defaultCenter?: MapLocation;
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
    presentation = 'default',
    defaultCenter,
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
        excellent: 'text-primary',
        good: 'text-primary',
        fair: 'text-brand-red',
        poor: 'text-brand-red',
    };
    const isPremium = presentation === 'premium';
    const isSignupLocationMap = mapHeight === 'signup-location';
    const isSignupFullscreenMap = mapHeight === 'signup-fullscreen';
    const isSignupMap = isSignupLocationMap || isSignupFullscreenMap;
    const mapDisplayLocation =
        currentLocation ?? (isSignupFullscreenMap && defaultCenter ? defaultCenter : null);
    const resolvedMapHeight = isSignupMap ? '100%' : mapHeight;
    const mapHeightClass = isSignupMap
        ? 'min-h-0 flex-1'
        : mapHeight === 'clamp(300px, 48dvh, 470px)'
        ? 'h-[clamp(300px,48dvh,470px)]'
        : mapHeight === '160px'
            ? 'h-[160px]'
            : 'h-[180px]';
    const emptyMapClass = `${isPremium ? 'location-picker-premium-map relative overflow-hidden bg-white/[0.78] shadow-inner' : 'neu-socket rounded-2xl'} ${mapHeightClass} flex items-center justify-center`;
    const rootClass = isSignupFullscreenMap
        ? 'absolute inset-0 h-full w-full'
        : isSignupLocationMap
          ? 'flex h-full min-h-0 flex-col gap-2'
          : 'flex flex-col gap-3';
    const mapClassName = isSignupFullscreenMap
        ? 'h-full w-full min-h-0 flex-1 !rounded-none !shadow-none !ring-0'
        : isPremium
          ? `${isSignupLocationMap ? 'min-h-0 flex-1' : ''} overflow-hidden rounded-2xl shadow-[0_18px_44px_rgba(26,26,46,0.16)] ring-1 ring-black/5`
          : 'shadow-lg';

    return (
        <div className={rootClass}>
            {/* Label with accuracy indicator */}
            {!isSignupMap && (
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neu-text-muted)]">
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
            )}

            {/* Map or detecting state */}
            {isDetecting && !currentLocation && !isSignupFullscreenMap ? (
                <div className={emptyMapClass}>
                    {isPremium && (
                        <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_18px_44px_rgba(26,26,46,0.16)]">
                            <span className="absolute h-16 w-16 animate-ping rounded-full bg-brand-blue/15" aria-hidden />
                            <i className="bi bi-geo-alt-fill text-3xl text-brand-blue animate-bounce" aria-hidden />
                        </div>
                        <span className="text-[10px] text-charcoal/50 font-black uppercase tracking-wider">
                            Detecting your location...
                        </span>
                    </div>
                </div>
            ) : mapDisplayLocation ? (
                <InteractiveMap
                    center={mapDisplayLocation}
                    draggable={!readOnly}
                    height={resolvedMapHeight}
                    onLocationChange={handleLocationChange}
                    zoom={16}
                    accuracyRadius={accuracy && accuracy < 500 ? accuracy : undefined}
                    className={mapClassName}
                    showDragHint={!isSignupFullscreenMap}
                    navigationControlPosition={isSignupFullscreenMap ? 'top-right' : 'bottom-right'}
                />
            ) : (
                <div className={emptyMapClass}>
                    {isPremium && (
                        <>
                            <div className="absolute left-[10%] top-[22%] h-2.5 w-32 rotate-12 rounded-full bg-brand-blue/18 shadow-[0_0_24px_rgba(74,144,217,0.16)]" aria-hidden />
                            <div className="absolute right-[8%] top-[41%] h-2.5 w-36 -rotate-12 rounded-full bg-primary/18 shadow-[0_0_24px_rgba(0,111,53,0.16)]" aria-hidden />
                            <div className="absolute bottom-[24%] left-[18%] h-2.5 w-40 -rotate-6 rounded-full bg-brand-amber/22 shadow-[0_0_24px_rgba(245,166,35,0.16)]" aria-hidden />
                            <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" aria-hidden />
                            <div className="absolute inset-y-8 left-1/2 w-px bg-gradient-to-b from-transparent via-brand-blue/22 to-transparent" aria-hidden />
                        </>
                    )}
                    {isSignupMap && !isSignupFullscreenMap ? (
                        <div className="relative z-10 flex flex-col items-center justify-center">
                            <div className="absolute h-48 w-48 rounded-full border border-primary/14 bg-primary/[0.035]" aria-hidden />
                            <div className="absolute h-32 w-32 rounded-full border border-brand-blue/18 bg-brand-blue/[0.035]" aria-hidden />
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_28px_62px_rgba(26,26,46,0.2)]">
                                <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-black text-white shadow-[0_10px_22px_rgba(0,111,53,0.36)]">N</span>
                                <i className="bi bi-geo-alt-fill text-5xl text-primary/70" aria-hidden />
                            </div>
                            <span className="sr-only">Location not available</span>
                        </div>
                    ) : (
                        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-[0_18px_44px_rgba(26,26,46,0.14)]">
                                <i className="bi bi-geo-alt-fill text-4xl text-primary/35" aria-hidden />
                            </div>
                            <div className="space-y-1">
                                <span className="block text-[11px] text-charcoal/60 font-black uppercase tracking-widest">
                                    Location not available
                                </span>
                                {isPremium && (
                                    <span className="block max-w-[14rem] text-[10px] leading-relaxed text-charcoal/45">
                                        Use your Huud point to match the right NeyburH.
                                    </span>
                                )}
                            </div>
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
                    )}
                </div>
            )}

            {/* Address display */}
            {!isSignupMap && (
                <div className={`
                flex items-center justify-between p-3 rounded-xl transition-all
                ${currentLocation ? 'neu-socket ring-1 ring-primary/20' : 'neu-socket'}
            `}>
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <div className={`w-2 h-2 shrink-0 rounded-full ${currentLocation ? 'bg-primary animate-pulse' : 'bg-charcoal/30'}`}></div>
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.1em] truncate text-[var(--neu-text)]">
                                {isResolvingAddress ? 'Resolving address...' :
                                    address?.formatted ? address.formatted :
                                        address ? `${address.lga}, ${address.state}` :
                                            currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` :
                                                'Waiting for location...'}
                            </span>
                            {address?.neighborhood && address.neighborhood !== address.lga && (
                                <span className="text-[9px] truncate text-[var(--neu-text-muted)]">
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
                            className="shrink-0 ml-2 w-8 h-8 rounded-lg btn-ghost flex items-center justify-center group"
                            title="Open in Google Maps"
                        >
                            <i className="bi bi-box-arrow-up-right text-xs text-charcoal/40 group-hover:text-brand-blue transition-colors"></i>
                        </button>
                    )}
                </div>
            )}

            {/* Error message */}
            {!isSignupMap && error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-red50 border border-orange-200">
                    <i className="bi bi-exclamation-triangle text-brand-red"></i>
                    <span className="text-[10px] text-brand-red600 font-medium">{error}</span>
                </div>
            )}

            {/* Instructions when draggable */}
            {!isSignupMap && !readOnly && currentLocation && (
                <p className="text-[9px] text-center text-[var(--neu-text-muted)]">
                    Not accurate? Tap on the map or drag the pin to adjust your location.
                </p>
            )}
        </div>
    );
}

export default LocationPicker;
