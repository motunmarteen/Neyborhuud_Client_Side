'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Category = { type: string; label: string; icon: string; accent: string };

const CATEGORIES: Category[] = [
  { type: 'marketplace', label: 'Market', icon: 'shopping_bag', accent: '#00C431' },
  { type: 'services', label: 'Services', icon: 'home_repair_service', accent: '#00A555' },
  { type: 'job', label: 'Jobs', icon: 'badge', accent: '#9A5ACF' },
  { type: 'event', label: 'Events', icon: 'local_activity', accent: '#1A56FF' },
  { type: 'fyi', label: 'FYI', icon: 'lightbulb', accent: '#3A6A9A' },
  { type: 'help_request', label: 'Help', icon: 'favorite', accent: '#CC3333' },
  { type: 'community_alert', label: 'Alerts', icon: 'emergency_home', accent: '#D45A00' },
  { type: 'incident_report', label: 'Safety', icon: 'shield_person', accent: '#A82020' },
];

/* ── Dial geometry ──────────────────────────────────────────────────
   The dial's center sits on the LEFT screen edge (cx = 0).
   Icons are arranged in a perfect semi-circle floating constellation.
──────────────────────────────────────────────────────────────────── */
const SIZE = 380;          
const CX = 0;              
const CY = SIZE / 2;       
const ARC_START = -85;     
const ARC_END = 85;        

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { 
    x: Number((cx + r * Math.cos(rad)).toFixed(4)), 
    y: Number((cy + r * Math.sin(rad)).toFixed(4)) 
  };
}

export function FeedRadialCategories() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current active type from URL, fallback to empty string (meaning default "All" or "Explore" state)
  const activeType = searchParams.get('type') || '';
  const activeCat = CATEGORIES.find(c => c.type === activeType);

  const handleSelect = (type: string) => {
    // If clicking the already active type, toggle it off (go back to feed)
    if (activeType === type) {
      router.push('/feed');
    } else {
      router.push(`/feed?type=${type}`);
    }
    setOpen(false);
  };

  // Compute angle spans
  const totalDeg = ARC_END - ARC_START;
  const span = totalDeg / CATEGORIES.length;

  return (
    <>
      <div 
        className={`radial-dial__backdrop ${open ? 'block' : 'hidden'}`} 
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className={`radial-dial${open ? ' radial-dial--open' : ''}`}>
        <div className="radial-dial__stage" aria-hidden={open ? undefined : true}>
          

          {/* Constellation of Glass Bubbles and Spoke Labels */}
          {CATEGORIES.map((c, i) => {
            const a0 = ARC_START + i * span;
            const a1 = ARC_START + (i + 1) * span;
            const mid = (a0 + a1) / 2;
            const pos = polar(CX, CY, 200, mid); // Massive 200 radius for maximum spaciousness
            const textPos = polar(CX, CY, 70, mid); // Text starts at R=70
            const isActive = activeType === c.type;
            
            return (
              <React.Fragment key={c.type}>
                {/* Spoke Text Label */}
                <div 
                  style={{
                    position: 'absolute',
                    left: textPos.x,
                    top: textPos.y,
                    transform: `translateY(-50%) rotate(${mid}deg)`,
                    transformOrigin: 'left center',
                    color: 'var(--primary)', /* The vibrant PULSE green */
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.1)',
                    textShadow: isActive ? '0 0 12px var(--primary), 0 2px 4px rgba(0,0,0,0.8)' : '0 2px 4px rgba(0,0,0,0.8)',
                    opacity: 1, /* Always 100% opaque to preserve the neon green vibrancy */
                  }}
                >
                  {c.label}
                </div>

                <button
                  className={`radial-dial__bubble${isActive ? ' radial-dial__bubble--active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: pos.x - 28, // Center the 56px bubble
                    top: pos.y - 28,
                    width: 56,
                    height: 56,
                    '--accent': c.accent
                  } as React.CSSProperties}
                  onClick={() => handleSelect(c.type)}
                  aria-label={c.label}
                  tabIndex={open ? 0 : -1}
                >
                  <span className="material-symbols-outlined radial-dial__icon">
                    {c.icon}
                  </span>
                </button>
              </React.Fragment>
            );
          })}

          {/* Center floating icon (Origin point) */}
          <div 
            className="radial-dial__hub-readout" 
            style={{ 
              position: 'absolute',
              width: 80, 
              height: 80,
              left: CX - 40, // Centered perfectly on the origin (x=0) to anchor the spokes
              top: CY - 40, // Centered vertically (y=190)
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            <div 
              className="radial-dial__hub-icon-wrap" 
              style={{ 
                color: 'var(--primary)', /* The vibrant PULSE green for the origin icon */
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="radial-dial__hub-icon material-symbols-outlined" style={{ fontSize: '3.5rem', fontVariationSettings: "'opsz' 48, 'wght' 600, 'GRAD' 0, 'FILL' 1" }}>
                {activeCat ? activeCat.icon : 'explore'}
              </span>
            </div>
          </div>
        </div>

        {/* FAB trigger on the edge */}
        <button
          type="button"
          className="radial-dial__fab"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open ? 'true' : 'false'}
          aria-label={open ? 'Close categories' : 'Open categories'}
        >
          <span className={`material-symbols-outlined radial-dial__fab-icon${open ? ' radial-dial__fab-icon--open' : ''}`}>
            {open ? 'close' : 'explore'}
          </span>
        </button>
      </div>
    </>
  );
}
