'use client';

/**
 * Feed composer and "what to show" tabs, from the agreed mockup:
 *   "Wetin dey happen around you?  + Post"
 *   For you · Safety · FYI · Posts · Market · Work · Events · Help · Polls · News
 * Tabs set ?type= on /feed (News opens the news page).
 */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export const FEED_TABS: { id: string; label: string; type?: string; href?: string }[] = [
  { id: 'all', label: 'For you' },
  { id: 'safety', label: '🛡️ Safety', type: 'emergency' },
  { id: 'fyi', label: '📢 FYI', type: 'fyi' },
  { id: 'post', label: '✏️ Posts', type: 'post' },
  { id: 'market', label: '🛒 Market', type: 'marketplace' },
  { id: 'work', label: '💼 Work', type: 'job' },
  { id: 'events', label: '🎉 Events', type: 'event' },
  { id: 'help', label: '🙋🏾 Help', type: 'help_request' },
  { id: 'poll', label: '🗳️ Polls', type: 'poll' },
  { id: 'news', label: '📰 News', href: '/local-news' },
];

const CHIP = 'inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function FeedComposer({ initial, onOpen }: { initial: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-3 flex min-h-14 items-center gap-3 rounded-[20px] border border-line bg-white px-3 text-left shadow-[0_2px_10px_rgba(29,36,51,0.06)] transition-colors hover:bg-background sm:mx-4"
    >
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green-soft font-heading text-sm font-extrabold text-brand-green-dark">
        {initial}
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-muted">Wetin dey happen around you?</span>
      <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-extrabold text-white">+ Post</span>
    </button>
  );
}

export function FeedTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get('type') || '';
  const activeId = FEED_TABS.find((t) => t.type && t.type === (type === 'incident_report' ? 'emergency' : type))?.id ?? 'all';

  return (
    <nav aria-label="What to show" className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-1 sm:px-4">
      {FEED_TABS.map((t) => {
        const on = t.id === activeId;
        const cls = `${CHIP} ${on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:bg-background'}`;
        return t.href ? (
          <Link key={t.id} href={t.href} className={cls}>
            {t.label}
          </Link>
        ) : (
          <button
            key={t.id}
            type="button"
            aria-pressed={on}
            className={cls}
            onClick={() => router.replace(t.type ? `/feed?type=${t.type}` : '/feed', { scroll: false })}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
