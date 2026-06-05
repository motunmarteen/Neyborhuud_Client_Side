'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  postCount: number;
  trending: boolean;
}

function useNewsFeed() {
  const [items, setItems] = useState<RssArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const articles = await newsService.getArticles({
          region: 'nigeria',
          limit: 8,
        });
        if (!cancelled) setItems(articles);
      } catch {
        try {
          const fallback = await newsService.getMultipleFeeds(
            [
              { id: 'punch', name: 'Punch' },
              { id: 'vanguard', name: 'Vanguard' },
              { id: 'channels', name: 'Channels TV' },
            ],
            8,
          );
          if (!cancelled) setItems(fallback);
        } catch {
          if (!cancelled) {
            setItems([]);
            setError('Could not load headlines');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}

export function TrendingPanel() {
  const [topics] = useState<TrendingTopic[]>([]);
  const loading = false;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col gap-2 px-4 py-3">
            <div className="h-3 w-24 rounded bg-white/5" />
            <div className="h-5 w-48 rounded bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 px-6">
        <span className="material-symbols-outlined mb-3 text-4xl text-[var(--neu-text-muted)]">trending_up</span>
        <p className="mb-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>Nothing trending yet</p>
        <p className="text-center text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          Trending topics from your Huud and Nigeria will appear here as community activity grows.
        </p>
      </div>
    );
  }

  return null;
}

export function NewsPanel() {
  const { items, loading, error } = useNewsFeed();

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="px-4 pt-3">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse px-4 py-3">
            <div className="mb-2 h-5 w-full rounded bg-white/10" />
            <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 rounded bg-white/5" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 px-6">
        <span className="material-symbols-outlined mb-3 text-4xl text-[var(--neu-text-muted)]">newspaper</span>
        <p className="mb-1 text-sm font-medium" style={{ color: 'var(--neu-text)' }}>No headlines right now</p>
        <p className="mb-4 text-center text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          {error ?? 'Check Local News for the latest Nigeria and international stories.'}
        </p>
        <Link href="/local-news?tab=nigeria" className="mod-chip mod-chip-active rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline">
          Open Local News
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-lg font-extrabold" style={{ color: 'var(--neu-text)' }}>
          Today&rsquo;s News
        </h3>
        <Link href="/local-news?tab=nigeria" className="text-xs font-bold text-primary no-underline">
          See all
        </Link>
      </div>
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--neu-shadow-dark, rgba(255,255,255,0.05))' }}>
        {items.map((item) => (
          <a
            key={item.id}
            href={item.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <h4 className="mb-1.5 text-[15px] font-bold leading-snug" style={{ color: 'var(--neu-text)' }}>
              {item.title}
            </h4>
            <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              {item.sourceName ?? item.source ?? 'News'} · {item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
