'use client';

/**
 * Tap a 👑 on the map: who last week's Area Champion is and how they earned it (Phase 7, M-14).
 * The champion can share their card; anyone can see how to become one.
 */

import Link from 'next/link';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import type { AreaChampion } from '@/hooks/useAreaChampions';

type Props = {
  champion: AreaChampion | null;
  onClose: () => void;
  /** Members only: opens the share card. */
  onShare?: (c: AreaChampion) => void;
  isMember: boolean;
  /** Visitors: where "Join" goes (keeps the invite code). */
  joinHref?: string;
};

export function ChampionSheet({ champion: c, onClose, onShare, isMember, joinHref = '/signup' }: Props) {
  return (
    <AppBottomSheet open={!!c} onClose={onClose} title="Area Champion of the Week">
      {c ? (
        <div className="flex flex-col gap-4 pb-2">
          <div className="flex items-center gap-3 rounded-[22px] bg-[#FFF6DB] p-4">
            <span aria-hidden className="text-4xl">
              👑
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="font-heading text-lg font-black text-navy">{c.isMe ? 'You are' : `${c.name} is`} {c.lga}&apos;s champion</p>
              <p className="text-sm font-bold text-[#A86F0A]">⭐ {c.impact.toLocaleString('en-NG')} Impact last week</p>
            </div>
          </div>
          <p className="text-sm text-navy">
            {c.isMe ? 'You' : 'They'} helped neighbours the most in {c.lga} last week: reports neighbours confirmed, help given,
            deals finished and lost items returned. The crown stays on the map until Sunday night.
          </p>
          <div className="flex flex-col gap-1 rounded-2xl border border-line p-3">
            <p className="text-sm font-bold text-navy">How to become a champion</p>
            <p className="text-xs font-semibold text-muted">
              Every Monday the verified neighbour with the most Impact in each area that week (at least 25) gets the crown. Likes
              and posts don&apos;t count; HuudCredit can&apos;t buy it.
            </p>
          </div>
          <div className="flex gap-2">
            {isMember && c.username && !c.isMe ? (
              <Link
                href={`/profile/${encodeURIComponent(c.username)}`}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-line bg-white px-4 text-[15px] font-bold text-navy"
              >
                See profile
              </Link>
            ) : null}
            {isMember && onShare ? (
              <button
                type="button"
                onClick={() => onShare(c)}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-[15px] font-bold text-white"
              >
                <span aria-hidden>📲</span> Share
              </button>
            ) : null}
            {!isMember ? (
              <Link
                href={joinHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-primary px-4 text-[15px] font-bold text-white"
              >
                Join free and help your area
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppBottomSheet>
  );
}
