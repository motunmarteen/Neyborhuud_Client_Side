/**
 * News Service
 * Consumes /api/v1/news — categories, sources, articles (server-parsed RSS), and raw feed proxy.
 */

import apiClient from '@/lib/api-client';
import type {
  NewsArticlesResponse,
  NewsCategoriesResponse,
  NewsCategory,
  NewsSource,
  NewsTopic,
  RssArticle,
} from '@/types/incident';

function normalizeArticleLink(link: string): string {
  if (!link) return '';
  try {
    const url = new URL(link);
    url.hash = '';
    return url.href;
  } catch {
    return link.split('#')[0];
  }
}

function parseRssXml(xml: string, sourceId: string, sourceName: string): RssArticle[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item'));

    return items.slice(0, 20).map((item, index): RssArticle => {
      const getText = (tag: string) => item.querySelector(tag)?.textContent?.trim() ?? '';
      const guid = getText('guid') || getText('link') || `${sourceId}-${index}`;
      const title = getText('title');
      const description = getText('description')
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-z]+;/gi, ' ')
        .trim();
      const link = getText('link');
      const pubDate = getText('pubDate');

      let imageUrl: string | undefined;
      const mediaContent = item.querySelector('content');
      const enclosure = item.querySelector('enclosure');
      if (mediaContent?.getAttribute('url')) {
        imageUrl = mediaContent.getAttribute('url') ?? undefined;
      } else if (enclosure?.getAttribute('url')) {
        imageUrl = enclosure.getAttribute('url') ?? undefined;
      } else {
        const imgMatch = item.querySelector('description')?.textContent?.match(
          /<img[^>]+src=["']([^"']+)["']/i,
        );
        if (imgMatch) imageUrl = imgMatch[1];
      }

      return {
        id: `${sourceId}::${guid}`,
        title,
        description: description.substring(0, 300),
        link,
        pubDate,
        source: sourceId,
        sourceName,
        imageUrl,
      };
    });
  } catch {
    return [];
  }
}

export const newsService = {
  async getCategories() {
    return apiClient.get<NewsCategoriesResponse>('/news/categories');
  },

  async getTopics() {
    return apiClient.get<{ topics: NewsTopic[] }>('/news/topics');
  },

  async getSources(region?: 'nigeria' | 'international') {
    return apiClient.get<{ sources: NewsSource[] }>('/news/sources', {
      params: region ? { region } : undefined,
    });
  },

  /**
   * Primary RSS path — server fetch, parse, topic filter, and merge.
   */
  async getArticles(params: {
    region: 'nigeria' | 'international';
    topic?: string;
    sources?: string[];
    limit?: number;
  }): Promise<RssArticle[]> {
    const response = await apiClient.get<NewsArticlesResponse>('/news/articles', {
      params: {
        region: params.region,
        topic: params.topic ?? 'all',
        sources: params.sources?.length ? params.sources.join(',') : undefined,
        limit: params.limit ?? 12,
      },
    });
    return response.data?.articles ?? [];
  },

  /** Raw XML feed proxy (fallback / legacy). */
  async getFeed(sourceId: string, sourceName: string): Promise<RssArticle[]> {
    const xml = await apiClient.get<string>(`/news/feed`, {
      params: { source: sourceId },
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return parseRssXml(typeof xml === 'string' ? xml : '', sourceId, sourceName);
  },

  /** Client-side merge fallback when /articles is unavailable. */
  async getMultipleFeeds(
    sources: Array<{ id: string; name: string }>,
    maxPerSource = 10,
  ): Promise<RssArticle[]> {
    const results = await Promise.allSettled(
      sources.map((s) => newsService.getFeed(s.id, s.name)),
    );

    const articles: RssArticle[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value.slice(0, maxPerSource));
      }
    });

    articles.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    const seen = new Set<string>();
    return articles.filter((article) => {
      const dedupeKey = normalizeArticleLink(article.link) || `${article.source}::${article.id}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  },
};

export type { NewsCategory, NewsTopic };
