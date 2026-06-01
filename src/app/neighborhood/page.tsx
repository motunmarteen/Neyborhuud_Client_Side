'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { contentService } from '@/services/content.service';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { BrowseFilterChip } from '@/components/layout/BrowseFilterChip';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { getPostId, TrendingPostRow } from '@/components/feed/TrendingPostRow';
import type { ContentType, FeedTab, Post } from '@/types/api';

export const dynamic = 'force-dynamic';

/** My Huud browse — same feed layers as /feed (Your Huud, Street Radar, Places) */
export type HuudView = 'your-huud' | 'street-radar' | 'fresh' | 'places';

type ContentFilter = 'all' | ContentType;

const VIEW_TABS = [
  { id: 'your-huud', label: 'Your Huud', icon: 'home_pin' },
  { id: 'street-radar', label: 'Street Radar', icon: 'radar' },
  { id: 'fresh', label: 'Fresh', icon: 'schedule' },
  { id: 'places', label: 'Places', icon: 'location_city' },
] as const;

const CONTENT_FILTERS: { id: ContentFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'fyi', label: 'FYI' },
  { id: 'job', label: 'Jobs' },
  { id: 'event', label: 'Events' },
  { id: 'marketplace', label: 'Market' },
];

const VALID_VIEWS = new Set<string>(VIEW_TABS.map((t) => t.id));

/** Legacy ?tab=hot from old /popular links */
const TAB_ALIASES: Record<string, HuudView> = {
  hot: 'street-radar',
};

function parseView(value: string | null): HuudView {
  if (value) {
    const aliased = TAB_ALIASES[value] ?? value;
    if (VALID_VIEWS.has(aliased)) return aliased as HuudView;
  }
  return 'your-huud';
}

function StatCard({
  icon,
  label,
  value,
  tone = 'primary',
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: 'primary' | 'red' | 'blue';
}) {
  const toneClass =
    tone === 'red'
      ? 'text-brand-red bg-brand-red/15'
      : tone === 'blue'
        ? 'text-brand-blue bg-brand-blue/10'
        : 'text-primary bg-primary/15';

  return (
    <div className="mod-card flex items-center gap-3 rounded-xl p-4">
      <div className={`mod-inset flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--neu-text)' }}>
          {value}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function feedOptions(view: HuudView, filter: ContentFilter) {
  const contentType = filter === 'all' ? undefined : filter;
  if (view === 'your-huud') {
    return { feedTab: 'your_huud' as FeedTab, contentType, limit: 30 };
  }
  if (view === 'places') {
    return { feedTab: 'following_places' as FeedTab, contentType, limit: 30 };
  }
  return {
    feedTab: 'street_radar' as FeedTab,
    ranked: view === 'street-radar',
    contentType,
    limit: 30,
  };
}

function viewMeta(view: HuudView, huudName: string) {
  switch (view) {
    case 'your-huud':
      return {
        label: huudName,
        icon: 'home_pin',
        section: `Nearby in ${huudName}`,
        emptyTitle: 'Nothing in your area yet',
        emptyDescription: `Be the first to share something in ${huudName}.`,
        emptySuffix: `Posts from ${huudName}`,
        ranked: false,
      };
    case 'street-radar':
      return {
        label: 'Street Radar',
        icon: 'radar',
        section: 'Trending on Street Radar',
        emptyTitle: 'Nothing trending yet',
        emptyDescription: 'Check back soon or switch to Fresh for the latest nearby posts.',
        emptySuffix: "What's buzzing on Street Radar",
        ranked: true,
      };
    case 'fresh':
      return {
        label: 'Fresh',
        icon: 'schedule',
        section: 'Latest nearby',
        emptyTitle: 'No fresh posts yet',
        emptyDescription: 'New posts from Street Radar will show up here.',
        emptySuffix: 'Latest posts nearby',
        ranked: false,
      };
    case 'places':
      return {
        label: 'Following places',
        icon: 'location_city',
        section: 'Places you follow',
        emptyTitle: 'No place updates yet',
        emptyDescription: 'Follow places to see their posts here.',
        emptySuffix: 'Updates from places you follow',
        ranked: false,
      };
  }
}

function HuudBrowseInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const huudName = useHuudDisplayName(user);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<HuudView>(() => parseView(searchParams.get('tab')));
  const [filter, setFilter] = useState<ContentFilter>('all');

  useEffect(() => {
    const parsed = parseView(searchParams.get('tab'));
    setView(parsed);
    const rawTab = searchParams.get('tab');
    if (rawTab && TAB_ALIASES[rawTab]) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', parsed);
      router.replace(`/neighborhood?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 9.0765, lng: 7.3986 }),
      );
    } else {
      setCoords({ lat: 9.0765, lng: 7.3986 });
    }
  }, []);

  const lat = coords?.lat ?? 9.0765;
  const lng = coords?.lng ?? 7.3986;
  const meta = viewMeta(view, huudName);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['huud-browse', lat, lng, view, filter],
    queryFn: () => contentService.getLocationFeed(lat, lng, feedOptions(view, filter)),
    enabled: !!coords,
  });

  const posts = (data?.content ?? []) as Post[];

  const stats = useMemo(() => {
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes ?? 0), 0);
    const topLikes = posts[0]?.likes ?? 0;
    return { count: posts.length, totalLikes, topLikes };
  }, [posts]);

  const setViewAndUrl = (next: HuudView) => {
    setView(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    router.replace(`/neighborhood?${params.toString()}`, { scroll: false });
  };

  const subtitleSuffix =
    !isLoading && posts.length > 0
      ? view === 'street-radar'
        ? ` · ${stats.count} trending · ${stats.totalLikes.toLocaleString()} reactions`
        : ` · ${stats.count} post${stats.count === 1 ? '' : 's'}`
      : ` · ${meta.emptySuffix}`;

  return (
    <AppBrowseLayout
      maxWidth="680"
      subtitle={
        <span className="inline-flex min-w-0 items-center gap-2">
          <span
            className="material-symbols-outlined shrink-0 text-xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {meta.icon}
          </span>
          <span className="truncate">
            {meta.label}
            {subtitleSuffix}
          </span>
        </span>
      }
      header={
        <>
          <BrowseTabStrip
            tabs={[...VIEW_TABS]}
            activeId={view}
            onChange={(id) => setViewAndUrl(id as HuudView)}
            trailing={
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="mod-chip mod-chip-active inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-primary disabled:opacity-50"
                aria-label="Refresh My Huud feed"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${isFetching ? 'animate-spin' : ''}`}
                  aria-hidden
                >
                  refresh
                </span>
                <span className="hidden min-[420px]:inline">
                  {isFetching ? 'Loading' : 'Refresh'}
                </span>
              </button>
            }
          />

          <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
            {CONTENT_FILTERS.map((item) => (
              <BrowseFilterChip
                key={item.id}
                active={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </BrowseFilterChip>
            ))}
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {!isLoading && posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {view === 'street-radar' ? (
              <>
                <StatCard icon="radar" label="Street Radar posts" value={stats.count} tone="blue" />
                <StatCard
                  icon="favorite"
                  label="Top post likes"
                  value={stats.topLikes.toLocaleString()}
                  tone="primary"
                />
              </>
            ) : (
              <>
                <StatCard icon="home_pin" label="Posts shown" value={stats.count} />
                <StatCard
                  icon="favorite"
                  label="Total reactions"
                  value={stats.totalLikes.toLocaleString()}
                  tone="blue"
                />
              </>
            )}
          </div>
        ) : null}

        {isLoading || !coords ? (
          <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mod-inset h-[5.5rem] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <BrowseEmptyState
            icon={meta.icon}
            title={meta.emptyTitle}
            description={meta.emptyDescription}
            filledIcon
          />
        ) : (
          <div>
            <h2 className="mb-3 text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              {meta.section}
            </h2>
            <div
              className="mod-card divide-y overflow-hidden rounded-2xl"
              style={{ borderColor: 'var(--neu-shadow-dark)' }}
            >
              {posts.map((post, index) => {
                const id = getPostId(post);
                return (
                  <TrendingPostRow
                    key={id || `huud-${view}-${index}`}
                    post={post}
                    rank={meta.ranked ? index + 1 : undefined}
                    variant={meta.ranked ? 'ranked' : 'local'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!isLoading && posts.length > 0 ? (
          <p className="text-center text-[11px] text-[var(--neu-text-muted)]">
            Tap a post to open the main feed
          </p>
        ) : null}
      </div>
    </AppBrowseLayout>
  );
}

export default function NeighborhoodPage() {
  return (
    <Suspense
      fallback={
        <AppBrowseLayout maxWidth="680" subtitle="My Huud">
          <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="mod-inset h-[5.5rem] animate-pulse rounded-xl" />
            ))}
          </div>
        </AppBrowseLayout>
      }
    >
      <HuudBrowseInner />
    </Suspense>
  );
}
