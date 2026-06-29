'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type L from 'leaflet';

import { useAuth } from '@/hooks/useAuth';
import { geoService } from '@/services/geo.service';
import { followService } from '@/services/follow.service';
import apiClient from '@/lib/api-client';
import { BottomNav } from '@/components/feed/BottomNav';
import {
  extractUserMapCoords,
  unwrapNearbyUsersPayload,
} from '@/lib/mapUserLocation';
import { MapSelectionSheet } from '@/components/map/MapSelectionSheet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FollowUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  profilePicture?: string;
  bio?: string;
  lga?: string;
  state?: string;
  isVerified?: boolean;
  distanceMetres?: number;
  isFollowing?: boolean;
  geoLocation?: {
    type: string;
    coordinates: [number, number];
  };
}

interface Place {
  lga: string;
  state: string;
  userCount: number;
  followerCount: number;
  isFollowing: boolean;
  sampleCoords?: [number, number];
}

type SelectedItem =
  | { type: 'user'; data: FollowUser }
  | { type: 'place'; data: Place }
  | null;

/* ── Leaflet CSS (loaded once) ── */
let leafletCssLoaded = false;
function ensureLeafletCss() {
  if (leafletCssLoaded || typeof document === 'undefined') return;
  leafletCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export default function MapComponent({ embedded = false }: { embedded?: boolean }) {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [leafletLib, setLeafletLib] = useState<typeof L | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'loading' | 'success' | 'error'>('prompt');
  
  const [radius, setRadius] = useState<number>(5000); // 5km default
  const [layer, setLayer] = useState<'people' | 'places'>('people');
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  
  const [isActionPending, setIsActionPending] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const lastMapPublishRef = useRef(0);
  const [nearbyCount, setNearbyCount] = useState(0);

  const MAP_PUBLISH_MIN_MS = 90_000;
  const publishLat = userCoords?.lat ?? null;
  const publishLng = userCoords?.lng ?? null;

  // Load Leaflet library dynamically
  useEffect(() => {
    import('leaflet').then((lib) => {
      setLeafletLib(lib);
    });
  }, []);

  // Request browser location
  const requestLocation = useCallback(() => {
    setLocationStatus('loading');
    geoService.getCurrentPosition()
      .then((position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      })
      .catch((error) => {
        console.error('Error getting location:', error);
        // Default to Lagos Centroid if browser location fails
        setUserCoords({ lat: 6.5244, lng: 3.3792 });
        setLocationStatus('error');
      });
  }, []);

  // Request location automatically on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Publish GPS so neighbours can see you on the map (throttled)
  useEffect(() => {
    if (publishLat == null || publishLng == null || !authUser?.id || locationStatus !== 'success') {
      return;
    }

    const lat = publishLat;
    const lng = publishLng;

    const publish = async () => {
      const now = Date.now();
      const isFirst = lastMapPublishRef.current === 0;
      if (!isFirst && now - lastMapPublishRef.current < MAP_PUBLISH_MIN_MS) return;
      lastMapPublishRef.current = now;
      try {
        await geoService.updateCurrentLocation(lat, lng);
        await queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
      } catch (err) {
        console.warn('[Map] Failed to publish location', err);
      }
    };

    void publish();
  }, [publishLat, publishLng, authUser?.id, locationStatus, queryClient]);

  // ─── React Query Data Fetching ────────────────────────────────────────────────

  // Fetch nearby users
  const { data: nearbyUsersData } = useQuery({
    queryKey: ['nearby-users', userCoords?.lat, userCoords?.lng, radius],
    queryFn: () => {
      if (!userCoords) return null;
      return geoService.getNearbyUsers(userCoords.lat, userCoords.lng, radius, 100);
    },
    enabled: !!userCoords && layer === 'people',
    staleTime: 60_000,
  });

  // Fetch LGA places
  const { data: placesData } = useQuery({
    queryKey: ['places'],
    queryFn: () => geoService.getPlaces(undefined, 100),
    enabled: layer === 'places',
    staleTime: 60_000,
  });

  // Fetch stats of selected Place (for detailed card display)
  const { data: placeStatsData, isLoading: loadingPlaceStats } = useQuery({
    queryKey: ['place-stats', selectedItem?.type === 'place' ? selectedItem.data.lga : ''],
    queryFn: () => {
      if (!selectedItem || selectedItem.type !== 'place') return null;
      return geoService.getPlaceStats(selectedItem.data.lga, selectedItem.data.state);
    },
    enabled: !!selectedItem && selectedItem.type === 'place',
    staleTime: 30_000,
  });

  // ─── Initialize Leaflet Map ─────────────────────────────────────────────────

  useEffect(() => {
    if (!leafletLib || !userCoords || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      // Keep map centered if user location resolves
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng]);
      return;
    }

    ensureLeafletCss();

    // Fix Next.js default marker asset paths
    delete (leafletLib.Icon.Default.prototype as any)['_getIconUrl'];
    leafletLib.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = leafletLib.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
    }).setView([userCoords.lat, userCoords.lng], 13);

    // CartoDB Voyager Tile Layer
    leafletLib.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 },
    ).addTo(map);

    const markersGroup = leafletLib.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    map.on('click', () => {
      setSelectedItem(null);
    });

    // Invalidate size once map element is painted
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [leafletLib, userCoords]);

  // Embedded maps mount inside a flex tab — Leaflet needs a resize after layout settles
  useEffect(() => {
    if (!embedded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const timers = [100, 350, 700].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    return () => timers.forEach(clearTimeout);
  }, [embedded, leafletLib, userCoords]);

  // ─── Update Map Markers Reactively ────────────────────────────────────────────

  const updateMarkers = useCallback((Leaflet: typeof L) => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. User's Own Location Blue Dot
    if (userCoords) {
      const selfIcon = Leaflet.divIcon({
        html: `
          <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
            <style>
              @keyframes bluePulse {
                0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0, 0, 255, 0.6); }
                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 0, 255, 0); }
                100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0, 0, 255, 0); }
              }
              .self-map-marker {
                animation: bluePulse 2.5s infinite;
              }
            </style>
            <div class="self-map-marker w-4.5 h-4.5 rounded-full bg-brand-blue border-2 border-white shadow-md"></div>
          </div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      Leaflet.marker([userCoords.lat, userCoords.lng], { icon: selfIcon }).addTo(markersGroup);
    }

    // 2. Render layer elements
    if (layer === 'people') {
      const users: FollowUser[] = unwrapNearbyUsersPayload(nearbyUsersData) as FollowUser[];
      const selfId = authUser?.id ? String(authUser.id) : '';
      let placed = 0;

      users.forEach((u) => {
        const userId = String(u._id || (u as { id?: string }).id || '');
        if (selfId && userId === selfId) return;

        const coords = extractUserMapCoords(u);
        if (!coords) return;
        const { lat, lng } = coords;
        placed += 1;

        const initials = `${(u.firstName || '')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase() || (u.username || '?')[0].toUpperCase();
        const avatarSrc = u.avatarUrl || u.profilePicture;

        const markerHtml = avatarSrc
          ? `<div class="user-map-marker relative w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-white shadow-lg flex items-center justify-center">
               <img src="${avatarSrc}" alt="${u.username}" class="w-full h-full object-cover" />
             </div>`
          : `<div class="user-map-marker relative w-10 h-10 rounded-full border-2 border-primary bg-gradient-to-br from-primary to-brand-green-dark text-white text-[11px] font-extrabold flex items-center justify-center shadow-lg">
               ${initials}
             </div>`;

        const icon = Leaflet.divIcon({
          html: `
            <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
              <style>
                @keyframes mapPulse {
                  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 212, 49, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(0, 212, 49, 0); }
                  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 212, 49, 0); }
                }
                .user-map-marker {
                  animation: mapPulse 2s infinite;
                  border-radius: 50%;
                }
              </style>
              ${markerHtml}
            </div>
          `,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = Leaflet.marker([lat, lng], { icon });
        marker.on('click', () => {
          map.setView([lat, lng], 14);
          setSelectedItem({ type: 'user', data: u });
        });
        marker.addTo(markersGroup);
      });

      setNearbyCount(placed);
    } else {
      setNearbyCount(0);
      const places: Place[] = (placesData?.data as any)?.places ?? [];
      places.forEach((p) => {
        if (!p.sampleCoords) return;
        const [lng, lat] = p.sampleCoords;
        if (lat === 0 && lng === 0) return;

        const hue = Array.from(p.lga).reduce((s, c) => s + c.charCodeAt(0), 0) % 360;

        const icon = Leaflet.divIcon({
          html: `
            <div class="flex items-center justify-center rounded-2xl text-white border-2 border-black/[0.08] shadow-xl hover:scale-105 transition-transform" 
                 style="width: 38px; height: 38px; background: linear-gradient(135deg, hsl(${hue},60%,35%), hsl(${(hue + 30) % 360},70%,22%));">
              <span class="material-symbols-outlined text-[20px] fill-1 text-white">location_city</span>
            </div>
          `,
          className: '',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = Leaflet.marker([lat, lng], { icon });
        marker.on('click', () => {
          map.setView([lat, lng], 13);
          setSelectedItem({ type: 'place', data: p });
        });
        marker.addTo(markersGroup);
      });
    }
  }, [userCoords, layer, nearbyUsersData, placesData, authUser?.id]);

  // Sync markers when Leaflet is ready or dataset updates
  useEffect(() => {
    if (leafletLib) {
      updateMarkers(leafletLib);
    }
  }, [leafletLib, updateMarkers]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleUserFollowToggle = async (userId: string, isFollowing: boolean) => {
    setIsActionPending(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(userId);
      } else {
        await followService.followUser(userId);
      }
      // Update selected item state immediately
      setSelectedItem((prev) => {
        if (prev && prev.type === 'user' && prev.data._id === userId) {
          return {
            ...prev,
            data: { ...prev.data, isFollowing: !isFollowing },
          };
        }
        return prev;
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['nearby-users'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePlaceFollowToggle = async (lga: string, state: string, isFollowing: boolean) => {
    setIsActionPending(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/content/locations/follow/${encodeURIComponent(lga)}`);
      } else {
        await apiClient.post('/content/locations/follow', { lga, state });
      }
      // Update selected item state
      setSelectedItem((prev) => {
        if (prev && prev.type === 'place' && prev.data.lga === lga) {
          return {
            ...prev,
            data: { ...prev.data, isFollowing: !isFollowing },
          };
        }
        return prev;
      });
      queryClient.invalidateQueries({ queryKey: ['places'] });
      queryClient.invalidateQueries({ queryKey: ['place-stats'] });
    } catch (err) {
      console.error('Place follow error:', err);
    } finally {
      setIsActionPending(false);
    }
  };

  // Distance formatter helper
  const fmtDist = (m: number) =>
    m < 1000 ? `${Math.round(m)}m away` : `${(m / 1000).toFixed(1)}km away`;

  return (
    <div className={`relative w-full overflow-hidden bg-background ${embedded ? 'absolute inset-0 h-full' : 'h-app min-h-0 flex-1'}`}>
      
      {/* ─── Leaflet Map Container ─── */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* ─── Header Elements overlay ─── */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none flex justify-between items-center">
        {!embedded && (
          <button
            onClick={() => router.back()}
            className="pointer-events-auto w-11 h-11 rounded-full bg-white/90 border border-black/[0.08] flex items-center justify-center text-brand-black backdrop-blur-md shadow-lg active:scale-95 transition-all"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
        )}

        {/* Floating Layer Switcher */}
        <div
          role="tablist"
          aria-label="Map layer"
          className={`pointer-events-auto bg-white/90 border border-black/[0.08] rounded-full p-1 shadow-lg backdrop-blur-md flex gap-0.5 ${embedded ? 'mx-auto' : ''}`}
        >
          <button
            type="button"
            role="tab"
            aria-selected={layer === 'people' ? 'true' : 'false'}
            onClick={() => { setLayer('people'); setSelectedItem(null); }}
            className={`segmented-tab ${layer === 'people' ? 'segmented-tab--active' : 'segmented-tab--inactive'} flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold active:scale-[0.97]`}
          >
            <span className="material-symbols-outlined text-[16px] fill-1">group</span>
            People
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={layer === 'places' ? 'true' : 'false'}
            onClick={() => { setLayer('places'); setSelectedItem(null); }}
            className={`segmented-tab ${layer === 'places' ? 'segmented-tab--active' : 'segmented-tab--inactive'} flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold active:scale-[0.97]`}
          >
            <span className="material-symbols-outlined text-[16px] fill-1">location_city</span>
            Places
          </button>
        </div>

        {!embedded && <div className="w-11" />}
      </div>

      {/* ─── Location Status / Access Alert ─── */}
      {locationStatus === 'error' && (
        <div className="absolute top-18 left-4 right-4 z-10 bg-brand-red/90 border border-brand-red text-white p-3 rounded-2xl shadow-xl flex items-start gap-2.5 backdrop-blur-md">
          <span className="material-symbols-outlined shrink-0 text-[20px]">location_off</span>
          <div className="flex-1">
            <p className="text-xs font-bold">Location Permission Denied</p>
            <p className="text-[11px] opacity-90 mt-0.5 leading-tight">
              Showing default view. Enable GPS location to discover neighbours near you.
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="text-xs font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Nearby count hint ─── */}
      {layer === 'people' && locationStatus === 'success' && !selectedItem && (
        <div className="absolute top-[4.5rem] left-4 right-4 z-10 pointer-events-none flex justify-center">
          <p className="rounded-full bg-white/90 border border-black/[0.08] px-3 py-1.5 text-[11px] font-semibold text-[var(--neu-text-muted)] shadow-md backdrop-blur-md">
            {nearbyUsersData === undefined
              ? 'Finding neighbours…'
              : nearbyCount > 0
                ? `${nearbyCount} neighbour${nearbyCount === 1 ? '' : 's'} on map`
                : 'No neighbours sharing location in this radius yet'}
          </p>
        </div>
      )}

      {/* ─── Radius Control Overlay ─── */}
      {layer === 'people' && !selectedItem && (
        <div className={`absolute left-4 right-4 z-10 bg-white/90 border border-black/[0.08] rounded-2xl p-4 shadow-xl backdrop-blur-md ${embedded ? 'bottom-[calc(var(--app-scroll-bottom)+0.5rem)]' : 'bottom-24'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[var(--neu-text-muted)] text-xs font-semibold">Discovery Radius</span>
            <span className="text-primary text-xs font-extrabold font-mono">
              {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-1 bg-black/[0.10] rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}

      <MapSelectionSheet
        selection={selectedItem}
        embedded={embedded}
        isActionPending={isActionPending}
        loadingPlaceStats={loadingPlaceStats}
        placeStats={placeStatsData?.data}
        onClose={() => setSelectedItem(null)}
        onUserFollowToggle={handleUserFollowToggle}
        onPlaceFollowToggle={handlePlaceFollowToggle}
        fmtDist={fmtDist}
      />

      {!embedded && <BottomNav hidden={true} />}
    </div>
  );
}
