'use client';

import { useEffect, useState } from 'react';
import { NIGERIA_SOURCES } from '@/lib/localNewsConfig';
import { newsService } from '@/services/news.service';

const FALLBACK_HEADLINES = [
  'Latest stories from your Huud',
  'Nigeria & neighbourhood news',
  'Open Local News for full coverage',
];

export function useSidebarLocalNews() {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const articles = await newsService.getArticles({
          region: 'nigeria',
          limit: 12,
        });
        const titles = articles
          .map((a) => a.title?.trim())
          .filter((t): t is string => Boolean(t));
        if (!cancelled && titles.length > 0) {
          setHeadlines(titles);
          setLoading(false);
          return;
        }
      } catch {
        /* try fallback below */
      }

      try {
        const pool = NIGERIA_SOURCES.slice(0, 4).map((s) => ({ id: s.id, name: s.name }));
        const fallback = await newsService.getMultipleFeeds(pool, 4);
        const titles = fallback
          .map((a) => a.title?.trim())
          .filter((t): t is string => Boolean(t));
        if (!cancelled) {
          setHeadlines(titles.length > 0 ? titles : FALLBACK_HEADLINES);
        }
      } catch {
        if (!cancelled) setHeadlines(FALLBACK_HEADLINES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { headlines, loading };
}
