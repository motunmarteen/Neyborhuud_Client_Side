/**
 * FYI Bulletin Hooks
 * React Query hooks for FYI bulletin posts
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { fyiService } from "@/services/fyi.service";
import { Post } from "@/types/api";

function normalizeFYIItem(item: any): Post {
  const authorId = item.authorId || {};
  const firstName = authorId.firstName || "";
  const lastName = authorId.lastName || "";
  const name =
    `${firstName} ${lastName}`.trim() || authorId.username || "Unknown";

  return {
    id: item._id?.toString() || item.id || "",
    content: item.body || item.content || "",
    body: item.body || item.content,
    author: {
      id: authorId._id?.toString() || authorId.id || "",
      name,
      username: authorId.username || "",
      avatarUrl: authorId.profilePicture || authorId.avatarUrl || null,
    },
    likes: item.likeCount || item.likes || 0,
    comments: item.commentCount || item.comments || 0,
    shares: item.shareCount || item.shares || 0,
    views: item.viewCount || item.views || 0,
    isLiked: item.isLiked || false,
    isSaved: item.isSaved || false,
    contentType: "fyi",
    tags: item.tags || [],
    media: Array.isArray(item.mediaUrls) ? item.mediaUrls : [],
    location: item.location,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
    fyiSubtype: item.metadata?.fyiType || item.fyiSubtype,
    priority: item.priority,
  };
}

/**
 * Fetch paginated FYI bulletins with optional filters
 */
export function useFYIList(filters?: {
  type?: string;
  priority?: string;
  feedTab?: string;
  lga?: string;
  state?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["fyi", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fyiService.getBulletins({
        ...filters,
        page: pageParam as number,
        limit: 20,
      });
      const raw = response?.data as any;
      const items: any[] = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw)
          ? raw
          : [];
      const pagination = raw?.pagination || {
        total: 0,
        page: pageParam,
        limit: 20,
        totalPages: 1,
      };
      return {
        fyi: items.map(normalizeFYIItem),
        pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}
