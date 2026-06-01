import type { NewsSource } from '@/types/incident';
import type { GistSectionId } from '@/types/huudGist';

export const LOCAL_NEWS_TABS = [
  { id: 'huud-gist', label: 'Huud Gist', icon: 'forum' },
  { id: 'nigeria', label: 'Nigeria', icon: 'flag' },
  { id: 'international', label: 'International', icon: 'public' },
] as const;

export type LocalNewsTab = (typeof LOCAL_NEWS_TABS)[number]['id'];

export const NIGERIA_SOURCES: NewsSource[] = [
  { id: 'punch', name: 'Punch' },
  { id: 'vanguard', name: 'Vanguard' },
  { id: 'channels', name: 'Channels TV' },
  { id: 'thisday', name: 'ThisDay' },
  { id: 'guardian_ng', name: 'Guardian NG' },
  { id: 'premiumtimes', name: 'Premium Times' },
  { id: 'dailytrust', name: 'Daily Trust' },
  { id: 'tribune', name: 'Tribune' },
  { id: 'sun', name: 'The Sun' },
];

export const INTERNATIONAL_SOURCES: NewsSource[] = [
  { id: 'bbc_world', name: 'BBC World' },
  { id: 'bbc_africa', name: 'BBC Africa' },
  { id: 'aljazeera', name: 'Al Jazeera' },
  { id: 'skynews', name: 'Sky News' },
  { id: 'nytimes', name: 'NY Times World' },
  { id: 'cnn', name: 'CNN' },
];

/** RSS topic chips — client-side classification until backend category feeds land */
export const NEWS_TOPICS = [
  { id: 'all', label: 'All' },
  {
    id: 'sports',
    label: 'Sports',
    keywords: ['sport', 'football', 'soccer', 'afcon', 'premier league', 'athlete', 'match', 'nba', 'olympic'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    keywords: ['entertainment', 'celebrity', 'music', 'nollywood', 'movie', 'film', 'showbiz', 'artist', 'concert'],
  },
  {
    id: 'education',
    label: 'Education',
    keywords: ['education', 'school', 'university', 'student', 'teacher', 'exam', 'waec', 'jamb', 'campus'],
  },
  {
    id: 'investment',
    label: 'Investment',
    keywords: ['investment', 'investor', 'stock', 'bond', 'portfolio', 'capital', 'venture', 'ipo', 'dividend'],
  },
  {
    id: 'technology',
    label: 'Technology',
    keywords: ['technology', 'tech', 'startup', 'software', 'ai', 'digital', 'internet', 'cyber', 'innovation'],
  },
  {
    id: 'business',
    label: 'Business',
    keywords: ['business', 'economy', 'market', 'trade', 'company', 'corporate', 'finance', 'bank', 'naira'],
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    keywords: ['agriculture', 'farm', 'farmer', 'crop', 'livestock', 'harvest', 'food security', 'fishery'],
  },
] as const;

export type NewsTopicId = (typeof NEWS_TOPICS)[number]['id'];

export function sourcesForTab(tab: LocalNewsTab): NewsSource[] {
  if (tab === 'nigeria') return NIGERIA_SOURCES;
  if (tab === 'international') return INTERNATIONAL_SOURCES;
  return [];
}

export function parseLocalNewsTab(value: string | null): LocalNewsTab {
  if (value && LOCAL_NEWS_TABS.some((t) => t.id === value)) return value as LocalNewsTab;
  return 'huud-gist';
}

export function parseNewsTopic(value: string | null): NewsTopicId {
  if (value && NEWS_TOPICS.some((t) => t.id === value)) return value as NewsTopicId;
  return 'all';
}

export function parseGistSection(value: string | null): GistSectionId {
  if (value && value !== '') return value as GistSectionId;
  return 'all';
}

/** Client-side topic filter when RSS fallback path is used (no server topic filter). */
export function filterArticlesByTopic<T extends { title?: string; description?: string }>(
  articles: T[],
  topic: NewsTopicId,
): T[] {
  if (topic === 'all') return articles;
  const topicDef = NEWS_TOPICS.find((t) => t.id === topic);
  if (!topicDef || !('keywords' in topicDef)) return articles;
  const keywords = topicDef.keywords as readonly string[];
  return articles.filter((article) => {
    const text = `${article.title ?? ''} ${article.description ?? ''}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
}
