/**
 * Map pins and badges (tracker F-10, from the Home Concept mockup).
 *
 * The look lives in globals.css (.nh-pin, .nh-orb), so the same pin is drawn by React
 * (MapLibre markers, the map home) and by the *Html helpers (Leaflet divIcon wants a string).
 *
 *   <MapPin emoji="🚨" ring="red" ripple label="Safety report: suspicious movement" />
 *   <MapPin emoji="🧊" tag="₦180k" label="Chest freezer for sale" />
 *   <PersonPin me name="Tunde" />            you, green with your initial
 *   <PersonPin champion name="Kemi" />       Area Champion of the week, gold ring and crown
 *   <SentinelOrb mood="advisory" />          Sentinel; the ring shows the area's mood
 *
 * Ring colours carry meaning: red = safety, amber = light / advisory, blue = FYI,
 * purple = help, green = yours or verified. Only live safety pins ripple.
 */

import type { ReactNode } from 'react';

export type PinRing = 'red' | 'amber' | 'blue' | 'purple' | 'green';
export type AreaMood = 'calm' | 'advisory' | 'alert';

type MapPinProps = {
  emoji: ReactNode;
  /** What the pin is, for screen readers ("Go-slow on Ikorodu Road"). */
  label: string;
  ring?: PinRing;
  /** Expanding ring for a live safety report. */
  ripple?: boolean;
  /** Navy pill under the pin: a price, a name, "3 going". */
  tag?: string;
  /** Corner bubble: how many things are in this spot. */
  count?: number;
  size?: 'md' | 'sm';
  onClick?: () => void;
};

export function MapPin({ emoji, label, ring, ripple = false, tag, count, size = 'md', onClick }: MapPinProps) {
  const r = ripple ? ring ?? 'red' : ring;
  return (
    <button type="button" className={`nh-pin${size === 'sm' ? ' nh-pin--sm' : ''}`} data-ring={r} aria-label={label} onClick={onClick}>
      {ripple ? <span className="nh-pin__ripple" aria-hidden /> : null}
      <span aria-hidden>{emoji}</span>
      {count && count > 1 ? (
        <span className="nh-pin__count" aria-hidden>
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
      {tag ? (
        <span className="nh-pin__tag" aria-hidden>
          {tag}
        </span>
      ) : null}
    </button>
  );
}

type PersonPinProps = {
  name: string;
  avatarUrl?: string | null;
  me?: boolean;
  champion?: boolean;
  label?: string;
  onClick?: () => void;
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 1);
  return s.toUpperCase();
}

function personLabel(name: string, me?: boolean, champion?: boolean) {
  if (me) return 'You are here';
  if (champion) return `Area Champion of the week: ${name}`;
  return name;
}

export function PersonPin({ name, avatarUrl, me = false, champion = false, label, onClick }: PersonPinProps) {
  const cls = `nh-pin nh-pin--person${me ? ' nh-pin--me' : ''}${champion ? ' nh-pin--champion' : ''}`;
  return (
    <button type="button" className={cls} aria-label={label ?? personLabel(name, me, champion)} onClick={onClick}>
      {champion ? (
        <span className="nh-pin__crown" aria-hidden>
          👑
        </span>
      ) : null}
      {avatarUrl && !me ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" draggable={false} />
      ) : (
        <span aria-hidden>{initialsOf(name)}</span>
      )}
    </button>
  );
}

const MOOD_LABEL: Record<AreaMood, string> = {
  calm: 'Ask Sentinel. Your area is calm',
  advisory: 'Ask Sentinel. Your area is on advisory',
  alert: 'Ask Sentinel. There is an alert in your area',
};

export function SentinelOrb({ mood = 'calm', onClick }: { mood?: AreaMood; onClick?: () => void }) {
  return (
    <button type="button" className="nh-orb" data-mood={mood} aria-label={MOOD_LABEL[mood]} onClick={onClick}>
      {mood !== 'calm' ? <span className="nh-orb__pulse" aria-hidden /> : null}
      <span className="nh-orb__core" aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </svg>
      </span>
    </button>
  );
}

// ── HTML strings for Leaflet divIcon (same classes, everything escaped) ─────────

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Leaflet: a pin is a div (Leaflet handles the click on the marker itself). */
export function mapPinHtml({ emoji, label, ring, ripple = false, tag, count, size = 'md' }: Omit<MapPinProps, 'onClick' | 'emoji'> & { emoji: string }): string {
  const r = ripple ? ring ?? 'red' : ring;
  return (
    `<div class="nh-pin${size === 'sm' ? ' nh-pin--sm' : ''}"${r ? ` data-ring="${r}"` : ''} role="img" aria-label="${esc(label)}">` +
    (ripple ? '<span class="nh-pin__ripple"></span>' : '') +
    `<span aria-hidden="true">${esc(emoji)}</span>` +
    (count && count > 1 ? `<span class="nh-pin__count" aria-hidden="true">${count > 99 ? '99+' : count}</span>` : '') +
    (tag ? `<span class="nh-pin__tag" aria-hidden="true">${esc(tag)}</span>` : '') +
    '</div>'
  );
}

export function personPinHtml({ name, avatarUrl, me = false, champion = false, label }: Omit<PersonPinProps, 'onClick'>): string {
  const cls = `nh-pin nh-pin--person${me ? ' nh-pin--me' : ''}${champion ? ' nh-pin--champion' : ''}`;
  return (
    `<div class="${cls}" role="img" aria-label="${esc(label ?? personLabel(name, me, champion))}">` +
    (champion ? '<span class="nh-pin__crown" aria-hidden="true">👑</span>' : '') +
    (avatarUrl && !me ? `<img src="${esc(avatarUrl)}" alt="" draggable="false" />` : `<span aria-hidden="true">${esc(initialsOf(name))}</span>`) +
    '</div>'
  );
}
