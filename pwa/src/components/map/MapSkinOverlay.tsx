'use client';

/**
 * Map skins from the HuudCredit shop (Phase 7, G-13): a festive layer over the top of your own
 * map home. Only the person wearing it sees it. It never covers pins or buttons (no pointer
 * events) and goes still in calm view.
 */

const BULBS = ['#FF5A5F', '#FFC93C', '#3DDC97', '#4CC9F0', '#F78FB3'];

function DettyDecember() {
  // A wire of fairy lights sagging across the top, bulbs twinkling out of step.
  const pts = Array.from({ length: 13 }, (_, i) => {
    const x = (i / 12) * 400;
    const y = 18 + Math.sin((i / 12) * Math.PI * 3) * 9 + (i % 2 ? 4 : 0);
    return { x, y };
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg className="nh-skin__lights" viewBox="0 0 400 48" preserveAspectRatio="none" aria-hidden="true">
      <path d={d} fill="none" stroke="#2B2F3A" strokeWidth="1.2" opacity=".7" />
      {pts.map((p, i) => (
        <g key={i} className="nh-skin__bulb" style={{ animationDelay: `${(i * 0.37) % 1.6}s` }}>
          <ellipse cx={p.x} cy={p.y + 6} rx="3.4" ry="5" fill={BULBS[i % BULBS.length]} />
          <circle cx={p.x} cy={p.y + 6} r="9" fill={BULBS[i % BULBS.length]} opacity=".25" />
        </g>
      ))}
    </svg>
  );
}

function Bunting() {
  const flags = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg className="nh-skin__bunting" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 6 Q100 18 200 6 T400 6" fill="none" stroke="#1D2433" strokeWidth="1" opacity=".5" />
      {flags.map((i) => {
        const x = i * 25 + 2;
        const y = 6 + Math.sin(((x % 200) / 200) * Math.PI) * 6;
        return <path key={i} d={`M${x} ${y} L${x + 21} ${y} L${x + 10.5} ${y + 22} Z`} fill={i % 3 === 1 ? '#FFFFFF' : '#008751'} stroke="#00000014" />;
      })}
    </svg>
  );
}

function EyoHats() {
  // Wide-brimmed Eyo hats (àkẹtẹ) drifting along the top on a bright festival sky.
  return (
    <svg className="nh-skin__eyo" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
      {[30, 110, 200, 290, 370].map((x, i) => (
        <g key={x} transform={`translate(${x} ${14 + (i % 2) * 8})`} className="nh-skin__hat" style={{ animationDelay: `${i * 0.6}s` }}>
          <ellipse cx="0" cy="8" rx="17" ry="4" fill="#FFFFFF" stroke="#D9C27A" strokeWidth=".8" />
          <path d="M-8 8 Q-7 -4 0 -5 Q7 -4 8 8 Z" fill="#FFFFFF" stroke="#D9C27A" strokeWidth=".8" />
          <rect x="-8" y="4" width="16" height="2.4" fill="#C9A227" />
        </g>
      ))}
    </svg>
  );
}

export function MapSkinOverlay({ skin, calm }: { skin: string | null | undefined; calm: boolean }) {
  if (!skin) return null;
  const name = skin.replace(/^skin_/, '');
  return (
    <div className={`nh-skin nh-skin--${name}${calm ? ' nh-skin--calm' : ''}`} aria-hidden="true">
      {name === 'detty_december' ? <DettyDecember /> : null}
      {name === 'independence' ? <Bunting /> : null}
      {name === 'eyo' ? <EyoHats /> : null}
      {name === 'rainy_season' ? <div className="nh-skin__rain" /> : null}
    </div>
  );
}
