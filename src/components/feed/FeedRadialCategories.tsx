'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Category = { type: string; label: string; icon: string; accent: string };

const CATEGORIES: Category[] = [
  { type: 'marketplace', label: 'Marketplace', icon: 'storefront', accent: '#00C431' },
  { type: 'services', label: 'Services', icon: 'handyman', accent: '#00A555' },
  { type: 'job', label: 'Jobs', icon: 'work', accent: '#9A5ACF' },
  { type: 'event', label: 'Events', icon: 'celebration', accent: '#1A56FF' },
  { type: 'fyi', label: 'FYI', icon: 'campaign', accent: '#3A6A9A' },
  { type: 'help_request', label: 'Help', icon: 'volunteer_activism', accent: '#CC3333' },
  { type: 'community_alert', label: 'Alerts', icon: 'notifications_active', accent: '#D45A00' },
  { type: 'incident_report', label: 'Safety', icon: 'security', accent: '#A82020' },
];

/* ── Dial geometry ──────────────────────────────────────────────────
   The dial's center sits on the LEFT screen edge (cx = 0), so only the
   right half is visible. Wedges fan across the right semicircle from
   -90° (straight up) to +90° (straight down).
──────────────────────────────────────────────────────────────────── */
const SIZE = 280;          // svg viewport (square); center is at left-mid
const CX = 0;              // center x — on the left edge
const CY = SIZE / 2;       // center y — vertically centered
const R_OUTER = 132;       // outer radius of the donut
const R_INNER = 64;        // inner radius (hub hole)
const R_ICON = (R_OUTER + R_INNER) / 2; // where icons sit
const ARC_START = -90;     // top
const ARC_END = 90;        // bottom
const GAP_DEG = 1.4;       // gap between wedges

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build a donut-wedge SVG path between two angles. */
function wedgePath(a0: number, a1: number) {
  const oStart = polar(CX, CY, R_OUTER, a0);
  const oEnd = polar(CX, CY, R_OUTER, a1);
  const iEnd = polar(CX, CY, R_INNER, a1);
  const iStart = polar(CX, CY, R_INNER, a0);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iEnd.x} ${iEnd.y}`,
    `A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
    'Z',
  ].join(' ');
}

export function FeedRadialCategories() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type') || '';
  const activeCat = CATEGORIES.find((c) => c.type === activeType);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('type') === type) params.delete('type');
    else params.set('type', type);
    router.replace(`/feed?${params.toString()}`);
    setOpen(false);
  };

  const count = CATEGORIES.length;
  const span = (ARC_END - ARC_START) / count;

  return (
    <>
      {open && (
        <button
          type="button"
          className="radial-dial__backdrop"
          aria-label="Close categories"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`radial-dial${open ? ' radial-dial--open' : ''}`}>
        {/* The segmented donut */}
        <div className="radial-dial__stage" aria-hidden={open ? undefined : true}>
          <svg
            className="radial-dial__svg"
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
          >
            {/* Wedges */}
            {CATEGORIES.map((c, i) => {
              const a0 = ARC_START + i * span + GAP_DEG / 2;
              const a1 = ARC_START + (i + 1) * span - GAP_DEG / 2;
              const isActive = activeType === c.type;
              const mid = (a0 + a1) / 2;
              const iconPos = polar(CX, CY, R_ICON, mid);
              // alternate tonal greys for inactive wedges
              const baseFill = i % 2 === 0 ? 'var(--dial-wedge-a)' : 'var(--dial-wedge-b)';
              return (
                <g
                  key={c.type}
                  className={`radial-dial__wedge${isActive ? ' radial-dial__wedge--active' : ''}`}
                  onClick={() => handleSelect(c.type)}
                  role="button"
                  aria-label={c.label}
                  tabIndex={open ? 0 : -1}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(c.type); }}
                >
                  <path
                    d={wedgePath(a0, a1)}
                    fill={isActive ? c.accent : baseFill}
                    className="radial-dial__wedge-path"
                  />
                  {/* Icon as foreignObject so we can use the icon font */}
                  <foreignObject
                    x={iconPos.x - 14}
                    y={iconPos.y - 14}
                    width={28}
                    height={28}
                    className="radial-dial__wedge-fo"
                  >
                    <span
                      className={`material-symbols-outlined radial-dial__wedge-icon${isActive ? ' radial-dial__wedge-icon--active' : ''}`}
                    >
                      {c.icon}
                    </span>
                  </foreignObject>
                </g>
              );
            })}

            {/* Center hub */}
            <circle cx={CX} cy={CY} r={R_INNER - 2} className="radial-dial__hub" />
          </svg>

          {/* Center hub readout — HTML overlay for crisp text */}
          <div className="radial-dial__hub-readout">
            <span className="radial-dial__hub-icon material-symbols-outlined">
              {activeCat ? activeCat.icon : 'explore'}
            </span>
            <span className="radial-dial__hub-label">
              {activeCat ? activeCat.label : 'Browse'}
            </span>
            <span className="radial-dial__hub-sub">
              {activeCat ? 'Active filter' : 'Pick a category'}
            </span>
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
            {open ? 'close' : 'tune'}
          </span>
        </button>
      </div>
    </>
  );
}
