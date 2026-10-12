/**
 * Map ads (owner, 2026-10-12): the billboard drawing and the sponsored-pin drawing.
 * The same markup is used on the map (as an HTML string for a MapLibre marker) and in the
 * booking preview (as React), so what a business designs is what neighbours see.
 * Every ad is labelled "Ad".
 */

import { mapPinHtml } from '@/components/map/Pins';
import { LAYER_META } from '@/lib/mapPins';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Text colour that reads on each allowed board colour (orange needs dark text). */
export function boardInk(colour: string): string {
  return colour.toUpperCase() === '#E8892B' ? '#1D2433' : '#FFFFFF';
}

type BoardContent = { title: string; line?: string; colour: string };

export function billboardLabel({ title, line }: BoardContent): string {
  return `Ad: ${title}${line ? `. ${line}` : ''}`;
}

/** Billboard on two posts. `night` adds the lit glow. */
export function billboardHtml(ad: BoardContent, night = false): string {
  return (
    `<div class="nh-bb"${night ? ' data-night=""' : ''} role="img" aria-label="${esc(billboardLabel(ad))}">` +
    `<div class="nh-bb__face" style="background:${esc(ad.colour)};color:${boardInk(ad.colour)}">` +
    `<span class="nh-bb__ad">Ad</span>` +
    `<span class="nh-bb__title">${esc(ad.title)}</span>` +
    (ad.line ? `<span class="nh-bb__line">${esc(ad.line)}</span>` : '') +
    `</div><div class="nh-bb__posts" aria-hidden="true"><i></i><i></i></div></div>`
  );
}

export function AdBoard({ title, line, colour, night = false }: BoardContent & { night?: boolean }) {
  return (
    <div className="nh-bb" data-night={night ? '' : undefined} role="img" aria-label={billboardLabel({ title, line, colour })}>
      <div className="nh-bb__face" style={{ background: colour, color: boardInk(colour) }}>
        <span className="nh-bb__ad">Ad</span>
        <span className="nh-bb__title">{title || 'Your name here'}</span>
        {line ? <span className="nh-bb__line">{line}</span> : null}
      </div>
      <div className="nh-bb__posts" aria-hidden="true">
        <i />
        <i />
      </div>
    </div>
  );
}

/** Sponsored pin: the usual pin for its layer, gold ring, "Ad · name" tag. */
export function sponsoredPinHtml(ad: { title: string; pinLayer?: 'market' | 'work' | 'events' }): string {
  const meta = LAYER_META[ad.pinLayer ?? 'market'];
  return mapPinHtml({ emoji: meta.emoji, label: `Ad: ${ad.title}`, ring: 'amber', tag: `Ad · ${ad.title}` });
}
