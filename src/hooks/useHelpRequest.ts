/**
 * Help Request Hooks
 * React Query hooks for Help Request posts and offer management.
 */

import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { helpRequestService } from "@/services/help-request.service";
import { Post } from "@/types/api";
import { toast } from "sonner";

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
    // Help Request-specific fields — backend stores these inside metadata
    targetAmount: item.targetAmount ?? item.metadata?.targetAmount,
    amountReceived: item.amountReceived ?? item.metadata?.amountReceived ?? 0,
    helpRequestPayment: item.helpRequestPayment ?? item.metadata?.helpRequestPayment,
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

/** Fetch a single help request post */
export function useHelpRequestDetail(id: string) {
  return useQuery({
    queryKey: ["helpRequest", "detail", id],
    queryFn: async () => {
      const res = await helpRequestService.getById(id);
      const raw = (res as any)?.data;
      // Backend shape: { data: { content: {...post}, comments: [...] } }
      const dataBlock = raw?.data ?? raw;
      const item = dataBlock?.content ?? dataBlock;
      return normalizeHelpRequestItem(item);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Fetch offers on a help request */
export function useHelpOffers(postId: string, enabled = true) {
  return useQuery({
    queryKey: ["helpRequest", "offers", postId],
    queryFn: async () => {
      const res = await helpRequestService.getOffers(postId);
      const raw = (res as any)?.data;
      const data = raw?.data ?? raw;
      return {
        offers: (data?.offers ?? []) as any[],
        count: data?.count ?? 0,
        myOffer: data?.myOffer ?? null,
      };
    },
    enabled: !!postId && enabled,
    staleTime: 15_000,
  });
}

/** Submit an offer to help */
export function useSubmitHelpOffer(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { message: string; offeredAmount?: number }) =>
      helpRequestService.submitOffer(postId, data),
    onSuccess: () => {
      toast.success("Your offer has been sent to the requestor!");
      qc.invalidateQueries({ queryKey: ["helpRequest", "offers", postId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Could not submit offer";
      toast.error(msg);
    },
  });
}

/** Requestor confirms they received help */
export function useConfirmHelpOffer(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => helpRequestService.confirmOffer(postId, offerId),
    onSuccess: (res) => {
      const msg = (res as any)?.data?.message ?? "Help confirmed!";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["helpRequest", "offers", postId] });
      qc.invalidateQueries({ queryKey: ["helpRequest", "detail", postId] });
      qc.invalidateQueries({ queryKey: ["helpRequest"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not confirm");
    },
  });
}

/** Requestor rejects an offer */
export function useRejectHelpOffer(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => helpRequestService.rejectOffer(postId, offerId),
    onSuccess: () => {
      toast.success("Offer rejected");
      qc.invalidateQueries({ queryKey: ["helpRequest", "offers", postId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Could not reject");
    },
  });
}

/** Owner updates help request status */
export function useUpdateHelpStatus(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => helpRequestService.updateStatus(postId, status),
    onSuccess: (_, status) => {
      toast.success(`Request marked as ${status.replace("_", " ")}`);
      qc.invalidateQueries({ queryKey: ["helpRequest", "detail", postId] });
      qc.invalidateQueries({ queryKey: ["helpRequest"] });
    },
    onError: () => toast.error("Could not update status"),
  });
}
