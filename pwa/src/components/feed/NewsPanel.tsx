'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Newspaper, ArrowRight } from 'lucide-react';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  postCount: number;
  trending: boolean;
}

function useNewsFeed(region: 'nigeria' | 'international') {
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
          region,
          limit: 8,
        });
        if (!cancelled) setItems(articles);
      } catch {
        try {
          const fallbackSources = region === 'nigeria'
            ? [
                { id: 'punch', name: 'Punch' },
                { id: 'vanguard', name: 'Vanguard' },
                { id: 'channels', name: 'Channels TV' },
              ]
            : [
                { id: 'bbc_world', name: 'BBC World' },
                { id: 'aljazeera', name: 'Al Jazeera' },
                { id: 'nytimes', name: 'NY Times World' },
              ];
          const fallback = await newsService.getMultipleFeeds(fallbackSources, 8);
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
  }, [region]);

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
  const [region, setRegion] = useState<'nigeria' | 'international'>('nigeria');
  const { items, loading, error } = useNewsFeed(region);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="px-4 pt-3 flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="flex gap-2 px-4 mb-2">
          <div className="h-7 w-20 animate-pulse rounded-xl bg-white/10" />
          <div className="h-7 w-24 animate-pulse rounded-xl bg-white/5" />
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

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9AA3B1]">
          <Newspaper size={13} className="text-[#0E8A3E]" />
          <span>Today’s News</span>
        </div>
        <Link href={`/local-news?tab=${region}`} className="text-[#0E8A3E] text-[11px] font-bold hover:underline flex items-center gap-0.5">
          <span>See all</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      {/* Region Tabs */}
      <div className="flex gap-1.5 px-1 mb-3">
        <button
          onClick={() => setRegion('nigeria')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            region === 'nigeria'
              ? 'bg-emerald-50 text-[#0E8A3E] shadow-xs'
              : 'text-[#5B6478] hover:bg-black/[0.04] hover:text-[#1D2433]'
          }`}
        >
          Nigeria
        </button>
        <button
          onClick={() => setRegion('international')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            region === 'international'
              ? 'bg-emerald-50 text-[#0E8A3E] shadow-xs'
              : 'text-[#5B6478] hover:bg-black/[0.04] hover:text-[#1D2433]'
          }`}
        >
          World
        </button>
      </div>

      {error || items.length === 0 ? (
        <div className="flex flex-col items-center py-6 px-4 text-center rounded-2xl bg-white border border-black/[0.08] shadow-xs">
          <Newspaper size={24} className="text-[#9AA3B1] mb-2" />
          <p className="text-xs font-semibold text-[#5B6478]">No headlines right now</p>
          <Link href={`/local-news?tab=${region}`} className="text-xs font-bold text-[#0E8A3E] hover:underline mt-1 inline-block">
            Open Local News →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.slice(0, 4).map((item) => (
            <a
              key={item.id}
              href={item.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-white border border-black/[0.08] hover:border-[#0E8A3E]/40 transition-all shadow-xs group block"
            >
              <h4 className="text-xs font-bold text-[#1D2433] group-hover:text-[#0E8A3E] transition-colors line-clamp-2 leading-snug">
                {item.title}
              </h4>
              <p className="text-[10px] font-semibold text-[#9AA3B1] mt-1.5 flex items-center gap-1.5">
                <span className="text-[#0E8A3E] font-bold">{item.sourceName ?? item.source ?? 'News'}</span>
                <span>•</span>
                <span>{item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'Recent'}</span>
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
