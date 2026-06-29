import { NEWS_TOPICS, type NewsTopicId } from '@/lib/localNewsConfig';
import type { RssArticle } from '@/types/incident';

function articleText(article: RssArticle) {
  return `${article.title} ${article.description}`.toLowerCase();
}

/** Classify RSS headlines by topic keywords (v1 — replace with backend categories when available). */
export function filterArticlesByTopic(articles: RssArticle[], topicId: NewsTopicId): RssArticle[] {
  if (topicId === 'all') return articles;

  const topic = NEWS_TOPICS.find((t) => t.id === topicId);
  if (!topic || !('keywords' in topic)) return articles;

  const keywords = topic.keywords as readonly string[];
  return articles.filter((article) => {
    const text = articleText(article);
    return keywords.some((kw) => text.includes(kw));
  });
}

export function countArticlesByTopic(articles: RssArticle[], topicId: NewsTopicId): number {
  return filterArticlesByTopic(articles, topicId).length;
}
