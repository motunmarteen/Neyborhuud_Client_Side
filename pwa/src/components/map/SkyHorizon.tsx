/**
 * The far horizon over the map (tracker M-04): a bush line with trees, coloured by the air at
 * that hour (SkyState.skyline). From the Home Concept mockup, made nationwide: palms in the
 * south, flat-topped acacia (savanna) trees in the north.
 *
 * Drawn from a fixed seed, so the horizon looks the same every visit. Decorative only.
 */

import { useId, useMemo } from 'react';

const W = 400;
const H = 44;
const BASE = 34; // where the bush line sits

/** Small deterministic random (mulberry32), so the same place gets the same horizon. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bushLine(r: () => number): string {
  let d = `M0 ${BASE}`;
  for (let x = 0; x < W; x += 15) {
    d += ` Q${x + 7} ${BASE - 6 - r() * 10} ${x + 15} ${BASE - r() * 6}`;
  }
  return `${d} L${W} ${H} L0 ${H} Z`;
}

/** A palm: a curved trunk and five fronds. */
function palm(x: number, h: number, lean: number): string[] {
  const topX = x + lean;
  const topY = BASE - h;
  const fronds = [
    [-9, 5], [-6, -6], [0, -9], [6, -6], [9, 5],
  ].map(([dx, dy]) => `M${topX} ${topY} Q${topX + dx / 2} ${topY + Math.min(dy, 0) - 3} ${topX + dx} ${topY + dy}`);
  return [`M${x} ${BASE + 2} Q${x + lean * 0.3} ${BASE - h / 2} ${topX} ${topY}`, ...fronds];
}

/** An acacia: a thin trunk and a wide, flat-topped crown (northern savanna). */
function acacia(x: number, h: number): { trunk: string; crown: string } {
  const top = BASE - h;
  const w = 10 + h * 0.6;
  return {
    trunk: `M${x} ${BASE + 2} L${x} ${top + 3} M${x} ${top + 8} L${x - 4} ${top + 3} M${x} ${top + 8} L${x + 4} ${top + 3}`,
    crown: `M${x - w} ${top + 3} Q${x - w * 0.6} ${top - 4} ${x} ${top - 4} Q${x + w * 0.6} ${top - 4} ${x + w} ${top + 3} Q${x} ${top + 1} ${x - w} ${top + 3} Z`,
  };
}

type SkyHorizonProps = {
  color: string;
  /** Latitude of the place: north of ~10°N shows savanna acacias, south shows palms. */
  lat?: number;
  /** Top of the horizon strip in px, inside the sky band. */
  top: number;
  seed?: number;
};

export function SkyHorizon({ color, lat = 9, top, seed = 7 }: SkyHorizonProps) {
  const savanna = lat >= 10;
  // useId can contain ':' or '«', which break url(#…) in SVG.
  const fadeId = 'horizon-fade-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const shapes = useMemo(() => {
    const r = rng(seed + (savanna ? 101 : 0));
    const bush = bushLine(r);
    const trees: { lines: string[]; fill?: string }[] = [];
    for (let x = 14 + r() * 20; x < W; x += 44 + r() * 46) {
      const h = 16 + r() * 18;
      if (savanna) {
        const a = acacia(x, h * 0.75);
        trees.push({ lines: [a.trunk], fill: a.crown });
      } else {
        trees.push({ lines: palm(x, h, (r() - 0.5) * 6) });
      }
    }
    return { bush, trees };
  }, [seed, savanna]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-x-0 w-full"
      style={{ top, height: H }}
      aria-hidden
    >
      {/* The bush line fades out at the bottom, so it melts into the haze over the land. */}
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="55%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill={color} stroke={color}>
        <path d={shapes.bush} stroke="none" fill={`url(#${fadeId})`} />
        {shapes.trees.map((t, i) => (
          <g key={i}>
            {t.lines.map((d, k) => (
              <path key={k} d={d} fill="none" strokeWidth={k === 0 ? 2 : 2.2} strokeLinecap="round" />
            ))}
            {t.fill ? <path d={t.fill} stroke="none" /> : null}
          </g>
        ))}
      </g>
    </svg>
  );
}
