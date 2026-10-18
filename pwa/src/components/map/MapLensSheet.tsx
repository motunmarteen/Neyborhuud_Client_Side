'use client';

/**
 * "More on the map": switch extra lenses on and off (at most two at once), and choose whether
 * to show yourself to friends. Plus the small card for a tapped lens item.
 */

import Link from 'next/link';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { LENSES, MAX_LENSES, type LensItem, type LensKey } from '@/hooks/useMapLenses';

type Props = {
  open: boolean;
  onClose: () => void;
  on: LensKey[];
  onToggle: (k: LensKey) => void;
  sharing: boolean | null;
  onSharing: (v: boolean) => void;
};

export function MapLensSheet({ open, onClose, on, onToggle, sharing, onSharing }: Props) {
  return (
    <AppBottomSheet open={open} onClose={onClose} title="More on the map">
      <div className="flex flex-col gap-3 pb-2">
        <p className="text-sm text-muted">Pick up to {MAX_LENSES} at a time, so the map stays clear.</p>
        <ul className="flex flex-col gap-2">
          {LENSES.map((l) => {
            const active = on.includes(l.key);
            return (
              <li key={l.key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  onClick={() => onToggle(l.key)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left ${active ? 'border-brand-green-dark bg-green-soft' : 'border-line bg-white'}`}
                >
                  <span aria-hidden className="text-2xl">
                    {l.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-bold text-navy">{l.label}</span>
                    <span className="text-xs font-semibold text-muted">{l.note}</span>
                  </span>
                  <span aria-hidden className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${active ? 'bg-brand-green-dark' : 'bg-line'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-2 rounded-2xl bg-background p-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-2xl">
              🙋🏾
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-bold text-navy">Show me to friends</span>
              <span className="text-xs font-semibold text-muted">
                Only friends who follow you back see you, near where you are (about 200 m), never your exact spot. It updates only while
                NeyborHuud is open. Turn it off any time.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!sharing}
              aria-label="Show me to friends"
              disabled={sharing === null}
              onClick={() => onSharing(!sharing)}
              className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50 ${sharing ? 'bg-brand-green-dark' : 'bg-line'}`}
            >
              <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${sharing ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-xs font-semibold text-muted">
          People who aren&apos;t your friends are never shown. You only see busy areas glowing.
        </p>
      </div>
    </AppBottomSheet>
  );
}

export function LensItemSheet({ item, onClose }: { item: { it: LensItem; lens: LensKey } | null; onClose: () => void }) {
  const it = item?.it;
  return (
    <AppBottomSheet open={!!it} onClose={onClose} title={it?.title ?? ''}>
      {it ? (
        <div className="flex flex-col gap-3 pb-2">
          {it.sub ? <p className="text-sm text-navy">{it.sub}</p> : null}
          {it.href ? (
            <Link href={it.href} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
              {item?.lens === 'businesses' ? 'See the business' : item?.lens === 'birthdays' ? 'Wish them happy birthday' : 'See profile'}
            </Link>
          ) : null}
        </div>
      ) : null}
    </AppBottomSheet>
  );
}
