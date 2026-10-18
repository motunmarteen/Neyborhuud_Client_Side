'use client';

/**
 * The real map behind every account screen (owner, 2026-10-18: "for the sign up I expect to
 * see the real map, not the doodles"). Same streets and style as the map home, but view-only:
 * your own area when we know it, otherwise all of Nigeria (never a one-city default).
 * Calm mode and phones without WebGL get a still, plain background instead.
 */

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HUUD_MAP_STYLE } from '@/lib/huudMapStyle';
import { ensureMaplibreWorker } from '@/lib/maplibreWorker';
import { NIGERIA_BOUNDS } from '@/lib/nigeriaView';
import { extractUserMapCoords, type MapUserLike } from '@/lib/mapUserLocation';
import { isCalm } from '@/lib/calmMode';
import { isLowEndDevice } from '@/lib/deviceTier';

function storedHome(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem('neyborhuud_user');
    return raw ? extractUserMapCoords(JSON.parse(raw) as MapUserLike) : null;
  } catch {
    return null;
  }
}

export function AuthMapBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const home = storedHome();
    const calm = isCalm();
    let map: maplibregl.Map;
    try {
      ensureMaplibreWorker();
      map = new maplibregl.Map({
        container: ref.current,
        style: HUUD_MAP_STYLE,
        ...(isLowEndDevice() ? { pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5) } : {}),
        ...(home
          ? { center: [home.lng, home.lat] as [number, number], zoom: 15 }
          : {
              bounds: NIGERIA_BOUNDS,
              // Keep the whole country above the sheet, which covers the lower part of the screen.
              fitBoundsOptions: { padding: { top: 90, bottom: Math.round(window.innerHeight * 0.4), left: 16, right: 16 } },
            }),
        pitch: home && !calm ? 50 : 0,
        bearing: home && !calm ? -12 : 0,
        interactive: false,
        attributionControl: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    // A slow turn so the street feels alive behind the sheet (skipped in calm mode).
    let raf = 0;
    if (home && !calm) {
      const spin = () => {
        map.setBearing(map.getBearing() + 0.02);
        raf = requestAnimationFrame(spin);
      };
      map.once('load', () => {
        raf = requestAnimationFrame(spin);
      });
    }
    return () => {
      cancelAnimationFrame(raf);
      map.remove();
    };
  }, []);

  return (
    <div className="auth-map-backdrop" aria-hidden="true">
      {failed ? null : <div ref={ref} style={{ width: "100%", height: "100%" }} />}
    </div>
  );
}
