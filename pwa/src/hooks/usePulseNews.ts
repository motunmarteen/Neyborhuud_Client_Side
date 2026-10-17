'use client';

/** Nigerian headlines for the ⚡ ribbon and Today's Pulse (one fetch, shared by both). */

import { useQuery } from '@tanstack/react-query';
import { newsService } from '@/services/news.service';
import type { RssArticle } from '@/types/incident';

async function loadHeadlines(): Promise<RssArticle[]> {
  try {
    const items = await newsService.getArticles({ region: 'nigeria', limit: 8 });
    if (items.length) return items;
  } catch {
    /* try the feeds directly */
  }
  try {
    return await newsService.getMultipleFeeds(
      [
        { id: 'punch', name: 'Punch' },
        { id: 'vanguard', name: 'Vanguard' },
      ],
      8,
    );
  } catch {
    return [];
  }
}

export function usePulseNews() {
  const q = useQuery({ queryKey: ['pulse', 'news'], queryFn: loadHeadlines, staleTime: 15 * 60_000, retry: false });
  return q.data ?? [];
}
