'use client';

/**
 * Light backdrop for the Getting started screens (restyle 2026-10-18): the app's real sky for
 * this hour (same colours as the map), the palm horizon, and the doodle ground below. Replaces
 * the dark aerial video so sign-in, password and setup screens feel like the rest of the app.
 */

import { useEffect, useMemo, useState } from 'react';
import { SkyHorizon } from '@/components/map/SkyHorizon';
import { skyAt } from '@/lib/sky';

export function AuthSkyBackdrop() {
  // The time is read on the phone only, so the server's page matches the first paint.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 5 * 60_000);
    return () => window.clearInterval(id);
  }, []);
  const sky = useMemo(() => (now ? skyAt(now, null) : null), [now]);
  if (!sky) {
    return (
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-[#7EC3EE] to-[#CFE9F7]" />
        <div className="doodle-surface absolute inset-x-0 bottom-0 top-[46%]" />
      </div>
    );
  }
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[46%]" style={{ background: `linear-gradient(${sky.skyTop}, ${sky.skyBot})` }}>
        {sky.sun.up && sky.sun.opacity > 0 ? (
          <span
            className="absolute h-16 w-16 rounded-full"
            style={{
              left: `${10 + sky.sun.x * 80}%`,
              top: `${70 - sky.sun.arc * 50}%`,
              background: sky.sun.color,
              boxShadow: `0 0 60px 20px ${sky.sun.glow}`,
              opacity: sky.sun.opacity,
            }}
          />
        ) : null}
        {sky.moon.up && sky.moon.opacity > 0 ? (
          <span
            className="absolute h-12 w-12 rounded-full bg-[#F4F2E6]"
            style={{ left: `${10 + sky.moon.x * 80}%`, top: `${70 - sky.moon.arc * 50}%`, opacity: sky.moon.opacity, boxShadow: '0 0 40px 10px rgba(220,225,255,.5)' }}
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-11">
          <SkyHorizon color={sky.skyline} top={0} />
        </div>
      </div>
      <div className="doodle-surface absolute inset-x-0 bottom-0 top-[46%]" />
    </div>
  );
}
