/**
 * News Service
 * Fetches RSS feeds via the backend proxy (/api/v1/news)
 * and parses the XML client-side.
 */

import apiClient from "@/lib/api-client";
import type { NewsCategory, RssArticle } from "@/types/incident";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ── Simple RSS XML → article parser ──────────────────────────────────────────

function parseRssXml(xml: string, sourceId: string, sourceName: string): RssArticle[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    const items = Array.from(doc.querySelectorAll("item"));
    return items.slice(0, 20).map((item, index): RssArticle => {
      const getText = (tag: string) =>
        item.querySelector(tag)?.textContent?.trim() ?? "";

      const guid = getText("guid") || getText("link") || `${sourceId}-${index}`;
      const title = getText("title");
      const description = getText("description")
        // Strip HTML tags from description
        .replace(/<[^>]*>/g, "")
        .replace(/&[a-z]+;/gi, " ")
        .trim();
      const link = getText("link");
      const pubDate = getText("pubDate");

      // Try to extract image from media:content, enclosure, or description
      let imageUrl: string | undefined;
      const mediaContent = item.querySelector("content");
      const enclosure = item.querySelector("enclosure");
      if (mediaContent?.getAttribute("url")) {
        imageUrl = mediaContent.getAttribute("url") ?? undefined;
      } else if (enclosure?.getAttribute("url")) {
        imageUrl = enclosure.getAttribute("url") ?? undefined;
      } else {
        const imgMatch = item.querySelector("description")?.textContent?.match(
          /<img[^>]+src=["']([^"']+)["']/i,
        );
        if (imgMatch) imageUrl = imgMatch[1];
      }

      return {
        id: guid,
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

// ── Service ───────────────────────────────────────────────────────────────────

export const newsService = {
  async getCategories() {
    return apiClient.get<ApiResponse<{ categories: NewsCategory[] }>>(
      "/news/categories",
    );
  },

  async getSources() {
    return apiClient.get<ApiResponse<{ sources: Array<{ id: string; name: string }> }>>(
      "/news/sources",
    );
  },

  /**
   * Fetch a single RSS feed by source id.
   * The backend returns raw XML; we parse it here.
   */
  async getFeed(sourceId: string, sourceName: string): Promise<RssArticle[]> {
    const response = await apiClient.get<string>(`/news/feed`, {
      params: { source: sourceId },
      responseType: "text",
      // Override Content-Type so axios doesn't try to JSON-parse RSS XML
      transformResponse: [(data) => data],
    });
    const xml = typeof response.data === "string" ? response.data : "";
    return parseRssXml(xml, sourceId, sourceName);
  },

  /**
   * Fetch multiple sources in parallel and merge/sort by date.
   */
  async getMultipleFeeds(
    sources: Array<{ id: string; name: string }>,
    maxPerSource = 10,
  ): Promise<RssArticle[]> {
    const results = await Promise.allSettled(
      sources.map((s) => newsService.getFeed(s.id, s.name)),
    );

    const articles: RssArticle[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        articles.push(...result.value.slice(0, maxPerSource));
      }
    });

    // Sort by pubDate descending
    articles.sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    });

    return articles;
  },
};
