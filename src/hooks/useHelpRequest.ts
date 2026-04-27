/**
 * Help Request Hooks
 * React Query hooks for Help Request posts.
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { helpRequestService } from "@/services/help-request.service";
import { Post } from "@/types/api";

function normalizeHelpRequestItem(item: any): Post {
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
    likes: item.likesCount || item.likeCount || item.likes || 0,
    comments: item.commentsCount || item.commentCount || item.comments || 0,
    shares: item.sharesCount || item.shareCount || item.shares || 0,
    views: item.viewsCount || item.viewCount || item.views || 0,
    isLiked: item.isLiked || false,
    isSaved: item.isSaved || false,
    contentType: "help_request",
    tags: item.tags || [],
    media: Array.isArray(item.mediaUrls) ? item.mediaUrls : [],
    location: item.location,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt,
    metadata: item.metadata,
    priority: item.priority,
    // Help Request-specific fields
    targetAmount: item.targetAmount,
    amountReceived: item.amountReceived ?? 0,
    helpRequestPayment: item.helpRequestPayment,
    helpCategory: item.metadata?.helpCategory ?? item.helpCategory,
  };
}

export function useHelpRequestList(filters?: { category?: string }) {
  return useInfiniteQuery({
    queryKey: ["helpRequest", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await helpRequestService.getRequests({
        ...filters,
        page: pageParam as number,
        limit: 20,
      });
      const raw = response?.data as any;
      // Backend wraps response: { success, message, data: { content: [], pagination: {} } }
      // Also handle direct { content: [], pagination: {} } shape
      const dataBlock = raw?.data ?? raw;
      const items: any[] = Array.isArray(dataBlock?.content)
        ? dataBlock.content
        : Array.isArray(dataBlock?.data)
          ? dataBlock.data
          : Array.isArray(dataBlock)
            ? dataBlock
            : [];
      const pagination = dataBlock?.pagination || {
        total: 0,
        page: pageParam,
        limit: 20,
        totalPages: 1,
      };
      return {
        helpRequests: items.map(normalizeHelpRequestItem),
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
