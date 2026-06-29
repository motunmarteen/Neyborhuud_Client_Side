'use client';

/**
 * ConnectMap — focused mini-map for the Connect hub.
 *
 * Plots a passed-in list of users by their REGISTERED HOME location
 * (primaryLocation), not live GPS. Used inside the collapsible map header on the
 * spatial people tabs (Near me / Following / Followers). Pins that fall in the
 * same small grid cell are clustered into a count bubble to stay performant with
 * large following/follower lists.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type L from 'leaflet';
import { extractUserHomeCoords, type MapUserLike } from '@/lib/mapUserLocation';

export type ConnectMapUser = MapUserLike & {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profilePicture?: string;
};

interface ConnectMapProps {
  users: ConnectMapUser[];
  /** Loading state from the parent query. */
  loading?: boolean;
  /** Empty-state copy when no plottable users. */
  emptyLabel?: string;
}

let leafletCssLoaded = false;
function ensureLeafletCss() {
  if (leafletCssLoaded || typeof document === 'undefined') return;
  leafletCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

type PlottedUser = ConnectMapUser & { lat: number; lng: number };
type Cluster = { lat: number; lng: number; users: PlottedUser[] };

/** Grid-cluster users whose home coords share a ~0.02° cell (~2km). */
function clusterUsers(users: PlottedUser[]): Cluster[] {
  const CELL = 0.02;
  const cells = new Map<string, PlottedUser[]>();
  for (const u of users) {
    const key = `${Math.round(u.lat / CELL)}:${Math.round(u.lng / CELL)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(u);
    else cells.set(key, [u]);
  }
  return Array.from(cells.values()).map((group) => {
    const lat = group.reduce((s, u) => s + u.lat, 0) / group.length;
    const lng = group.reduce((s, u) => s + u.lng, 0) / group.length;
    return { lat, lng, users: group };
  });
}

function displayName(u: ConnectMapUser): string {
  return (
    [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Neighbour'
  );
}

export function ConnectMap({ users, loading, emptyLabel = 'No neighbours to show on the map yet.' }: ConnectMapProps) {
  const router = useRouter();
  const [leafletLib, setLeafletLib] = useState<typeof L | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const plotted = useMemo<PlottedUser[]>(() => {
    const out: PlottedUser[] = [];
    for (const u of users) {
      const coords = extractUserHomeCoords(u);
      if (coords) out.push({ ...u, lat: coords.lat, lng: coords.lng });
    }
    return out;
  }, [users]);

  const clusters = useMemo(() => clusterUsers(plotted), [plotted]);

  // Load Leaflet lazily
  useEffect(() => {
    ensureLeafletCss();
    let cancelled = false;
    import('leaflet').then((lib) => {
      if (!cancelled) setLeafletLib(lib);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Init map once Leaflet + container are ready
  useEffect(() => {
    if (!leafletLib || !mapContainerRef.current || mapInstanceRef.current) return;
    const map = leafletLib.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([9.082, 8.6753], 6); // Nigeria default
    leafletLib.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
    markersGroupRef.current = leafletLib.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
    };
  }, [leafletLib]);

  // Which cluster is currently "spiderfied" (expanded into individual pins).
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Render markers reactively
  useEffect(() => {
    const lib = leafletLib;
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!lib || !map || !group) return;

    group.clearLayers();
    if (!clusters.length) return;

    const bounds: [number, number][] = [];

    const addUserPin = (u: PlottedUser, lat: number, lng: number) => {
      const avatar = u.avatarUrl || u.profilePicture;
      const html = avatar
        ? `<div class="connect-map-pin"><img src="${avatar}" alt=""/></div>`
        : `<div class="connect-map-pin connect-map-pin--initial">${displayName(u)[0]?.toUpperCase() ?? '?'}</div>`;
      const icon = lib.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
      const marker = lib.marker([lat, lng], { icon }).addTo(group);
      marker.on('click', () => {
        if (u.username) router.push(`/profile/${u.username}`);
      });
    };

    for (const cluster of clusters) {
      bounds.push([cluster.lat, cluster.lng]);
      const key = `${cluster.lat.toFixed(5)}:${cluster.lng.toFixed(5)}`;

      if (cluster.users.length === 1) {
        addUserPin(cluster.users[0], cluster.lat, cluster.lng);
      } else if (expandedKey === key) {
        // Spiderfy: fan the members out in a ring around the cluster centre so
        // even users with identical home coords become individually tappable.
        const n = cluster.users.length;
        const rPx = 26 + n * 6; // ring radius grows with member count
        const centre = map.latLngToLayerPoint([cluster.lat, cluster.lng]);
        cluster.users.forEach((u, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const pt = lib.point(
            centre.x + rPx * Math.cos(angle),
            centre.y + rPx * Math.sin(angle),
          );
          const ll = map.layerPointToLatLng(pt);
          addUserPin(u, ll.lat, ll.lng);
        });
        // A small centre dot to collapse the spider back.
        const collapseIcon = lib.divIcon({
          html: `<div class="connect-map-cluster connect-map-cluster--collapse">×</div>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        lib.marker([cluster.lat, cluster.lng], { icon: collapseIcon, zIndexOffset: 1000 })
          .addTo(group)
          .on('click', () => setExpandedKey(null));
      } else {
        const html = `<div class="connect-map-cluster">${cluster.users.length}</div>`;
        const icon = lib.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
        const marker = lib.marker([cluster.lat, cluster.lng], { icon }).addTo(group);
        marker.on('click', () => {
          setExpandedKey(key);
          map.setView([cluster.lat, cluster.lng], Math.max(map.getZoom(), 13));
        });
      }
    }

    if (!expandedKey) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, [clusters, leafletLib, router, expandedKey]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Loading / empty overlays */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00D431] border-t-transparent" />
        </div>
      )}
      {!loading && plotted.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-xs font-medium text-slate-500">{emptyLabel}</p>
        </div>
      )}
    </div>
  );
}
