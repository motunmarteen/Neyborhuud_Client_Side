/**
 * Marketplace Hook
 * Manages marketplace products with social features (likes, comments, CRUD)
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { marketplaceService, Product } from "@/services/marketplace.service";
import { getErrorMessage } from "@/lib/error-handler";
import { toast } from "sonner";
import { getOfferToast, type OfferRole } from "@/lib/marketplaceMessages";
import { useAwardCoins } from "@/hooks/useGamification";
import { useMarketplaceOfflineQueue } from "@/hooks/useMarketplaceOfflineQueue";

/**
 * Hook for fetching a single product with engagement data
 */
export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: ["marketplace", "product", productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await marketplaceService.getProduct(productId);
      // Backend now returns the product flat under `data` (with a nested
      // `product` mirror for legacy callers). Unwrap so consumers can read
      // `product.title`, `product.price`, etc. directly.
      const payload: any = (response as any)?.data ?? response;
      return (payload?.product ?? payload) as Product | null;
    },
    enabled: !!productId,
    staleTime: 30000, // 30 seconds - engagement data changes frequently
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

/**
 * Hook for a seller's public trust status (tier + vouch progress) — powers the
 * "New Seller / Vouched Seller" badge on listings. Cached longer since a
 * seller's tier changes slowly.
 */
export function useSellerStatus(sellerId: string | null | undefined) {
  return useQuery({
    queryKey: ["marketplace", "seller-status", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      const res = await marketplaceService.getSellerStatus(sellerId);
      return (res as any)?.data ?? res ?? null;
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook for fetching marketplace products list
 */
export function useMarketplaceProducts(filter?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  delivery?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: ["marketplace", "products", filter],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getItems(pageParam, 20, filter),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || lastPage?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook for fetching nearby products
 */
export function useNearbyProducts(
  latitude: number | null,
  longitude: number | null,
  radius = 10000,
) {
  return useInfiniteQuery({
    queryKey: ["marketplace", "nearby", latitude, longitude, radius],
    queryFn: ({ pageParam = 1 }) => {
      if (!latitude || !longitude) {
        throw new Error("Location required for nearby products");
      }
      return marketplaceService.getNearbyItems(
        latitude,
        longitude,
        radius,
        pageParam,
        20,
      );
    },
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || lastPage?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!latitude && !!longitude,
  });
}

/**
 * Hook for fetching user's own listings
 */
export function useMyListings() {
  return useInfiniteQuery({
    queryKey: ["marketplace", "my-listings"],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getMyListings(pageParam, 20),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || lastPage?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook for fetching saved products
 */
export function useSavedProducts() {
  return useInfiniteQuery({
    queryKey: ["marketplace", "saved"],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getSavedItems(pageParam, 20),
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || lastPage?.data?.pagination;
      return pagination?.hasMore ? (pagination.page ?? 0) + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook for product CRUD mutations
 */
export function useProductMutations() {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  const createProduct = useMutation({
    mutationFn: (
      payload: Parameters<typeof marketplaceService.createProduct>[0],
    ) => marketplaceService.createProduct(payload),
    onSuccess: (data) => {
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "my-listings"],
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "nearby"] });
      awardCoins("listing_created");
      toast.success("Product listed successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to create product listing");
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: Parameters<typeof marketplaceService.updateProduct>[1];
    }) => marketplaceService.updateProduct(productId, data),
    onSuccess: (data, variables) => {
      // Invalidate the specific product
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", variables.productId],
      });
      // Invalidate products lists
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "my-listings"],
      });
      toast.success("Product updated successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update product");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (productId: string) =>
      marketplaceService.deleteProduct(productId),
    onSuccess: (data, productId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: ["marketplace", "product", productId],
      });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "my-listings"],
      });
      toast.success("Product deleted successfully!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to delete product");
    },
  });

  return { createProduct, updateProduct, deleteProduct };
}

/**
 * Hook for product like mutations with optimistic updates
 */
function patchProductLikeInPages(old: any, productId: string, isLiked: boolean, likesCount: number) {
  if (!old?.pages) return old;
  const patchList = (list: Product[]) =>
    list.map((p) => {
      const pid = p.id || (p as any)._id;
      if (pid !== productId) return p;
      return {
        ...p,
        isLiked,
        engagement: {
          ...p.engagement,
          isLiked,
          likesCount,
          commentsCount: p.engagement?.commentsCount ?? 0,
        },
      };
    });

  return {
    ...old,
    pages: old.pages.map((page: any) => {
      if (!page) return page;
      if (Array.isArray(page.data)) {
        return { ...page, data: patchList(page.data) };
      }
      if (page.data?.data && Array.isArray(page.data.data)) {
        return {
          ...page,
          data: { ...page.data, data: patchList(page.data.data) },
        };
      }
      return page;
    }),
  };
}

export function useProductLike(productId: string) {
  const queryClient = useQueryClient();
  const { enqueue } = useMarketplaceOfflineQueue();

  return useMutation({
    mutationFn: () => marketplaceService.toggleLike(productId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["marketplace", "product", productId],
      });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData<Product>([
        "marketplace",
        "product",
        productId,
      ]);
      const previousMainList = queryClient.getQueriesData({ queryKey: ["marketplace", "products"] });
      const previousMyListings = queryClient.getQueriesData({
        queryKey: ["marketplace", "my-listings"],
      });
      const previousSaved = queryClient.getQueriesData({ queryKey: ["marketplace", "saved"] });

      // Optimistically update
      if (previousProduct) {
        queryClient.setQueryData<Product>(
          ["marketplace", "product", productId],
          (old) => {
            if (!old) return old;
            const currentIsLiked = old.engagement?.isLiked ?? false;
            const currentLikes = old.engagement?.likesCount ?? 0;

            return {
              ...old,
              engagement: {
                ...old.engagement,
                isLiked: !currentIsLiked,
                likesCount: currentIsLiked
                  ? currentLikes - 1
                  : currentLikes + 1,
                commentsCount: old.engagement?.commentsCount ?? 0,
              },
            };
          },
        );
      }

      const listProduct = previousProduct ||
        (() => {
          for (const [, data] of previousMainList) {
            const pages = (data as any)?.pages;
            if (!pages) continue;
            for (const page of pages) {
              const arr = Array.isArray(page?.data)
                ? page.data
                : page?.data?.data;
              if (!Array.isArray(arr)) continue;
              const hit = arr.find(
                (p: Product) => (p.id || (p as any)._id) === productId,
              );
              if (hit) return hit;
            }
          }
          return null;
        })();

      if (listProduct) {
        const currentIsLiked =
          listProduct.engagement?.isLiked ?? listProduct.isLiked ?? false;
        const currentLikes = listProduct.engagement?.likesCount ?? 0;
        const nextIsLiked = !currentIsLiked;
        const nextLikes = currentIsLiked ? currentLikes - 1 : currentLikes + 1;

        queryClient.setQueriesData({ queryKey: ["marketplace", "products"] }, (old) =>
          patchProductLikeInPages(old, productId, nextIsLiked, nextLikes),
        );
        queryClient.setQueriesData({ queryKey: ["marketplace", "my-listings"] }, (old) =>
          patchProductLikeInPages(old, productId, nextIsLiked, nextLikes),
        );
        queryClient.setQueriesData({ queryKey: ["marketplace", "saved"] }, (old) =>
          patchProductLikeInPages(old, productId, nextIsLiked, nextLikes),
        );
      }

      return {
        previousProduct,
        previousMainList,
        previousMyListings,
        previousSaved,
      };
    },
    onError: (error: any, _, context: any) => {
      // Offline / network failure: keep the optimistic UI as-is and queue the
      // action for replay when connectivity returns, instead of rolling back
      // (which would flip the like state right back in front of the user).
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueue({ type: "like", productId });
        return;
      }

      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ["marketplace", "product", productId],
          context.previousProduct,
        );
      }
      if (context?.previousMainList) {
        context.previousMainList.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousMyListings) {
        context.previousMyListings.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousSaved) {
        context.previousSaved.forEach(([key, data]: [any, any]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.error(getErrorMessage(error) || "Failed to update like");
    },
    onSuccess: (data) => {
      // Update with server data (detail + list caches stay in sync)
      const responseData = (data as any).data || data;
      const isLiked = !!responseData.isLiked;
      const likesCount = Number(responseData.likesCount) || 0;

      queryClient.setQueryData<Product>(
        ["marketplace", "product", productId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            engagement: {
              ...old.engagement,
              isLiked,
              likesCount,
              commentsCount: old.engagement?.commentsCount ?? 0,
            },
          };
        },
      );

      queryClient.setQueriesData({ queryKey: ["marketplace", "products"] }, (old) =>
        patchProductLikeInPages(old, productId, isLiked, likesCount),
      );
      queryClient.setQueriesData({ queryKey: ["marketplace", "my-listings"] }, (old) =>
        patchProductLikeInPages(old, productId, isLiked, likesCount),
      );
      queryClient.setQueriesData({ queryKey: ["marketplace", "saved"] }, (old) =>
        patchProductLikeInPages(old, productId, isLiked, likesCount),
      );
      queryClient.invalidateQueries({ queryKey: ["feed-discovery"] });
    },
  });
}

/**
 * Hook for product comments
 */
export function useProductComments(productId: string | null) {
  return useInfiniteQuery({
    queryKey: ["marketplace", "comments", productId],
    queryFn: ({ pageParam = 1 }) => {
      if (!productId) throw new Error("Product ID required");
      return marketplaceService.getComments(productId, pageParam, 20);
    },
    getNextPageParam: (lastPage) => {
      const pagination =
        (lastPage as any).pagination || (lastPage as any).data?.pagination;
      return pagination && pagination.page < pagination.pages
        ? pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!productId,
  });
}

/**
 * Hook for comment mutations with optimistic updates
 */
export function useProductCommentMutations(productId: string) {
  const queryClient = useQueryClient();
  const lastCommentTimeRef = useRef(0);
  const RATE_LIMIT_MS = 20000; // 20 seconds between comments

  const addComment = useMutation({
    mutationFn: (payload: {
      body: string;
      parentId?: string;
      mediaUrls?: string[];
    }) => {
      // Check rate limit
      const now = Date.now();
      if (now - lastCommentTimeRef.current < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil(
          (RATE_LIMIT_MS - (now - lastCommentTimeRef.current)) / 1000,
        );
        throw new Error(
          `You're commenting too fast. Please wait ${remainingSeconds} seconds.`,
        );
      }

      return marketplaceService.addComment(productId, payload);
    },
    onMutate: async (newComment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["marketplace", "product", productId],
      });
      await queryClient.cancelQueries({
        queryKey: ["marketplace", "comments", productId],
      });

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData([
        "marketplace",
        "product",
        productId,
      ]);
      const previousComments = queryClient.getQueryData([
        "marketplace",
        "comments",
        productId,
      ]);

      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        _id: `temp-${Date.now()}`,
        body: newComment.body,
        mediaUrls: newComment.mediaUrls || [],
        parentId: newComment.parentId,
        likesCount: 0,
        createdAt: new Date().toISOString(),
        user: {
          id: "current-user",
          username: "You",
          firstName: "",
          lastName: "",
          avatar: null,
        },
      };

      // Optimistically update product engagement
      queryClient.setQueryData<Product>(
        ["marketplace", "product", productId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            engagement: {
              ...old.engagement,
              commentsCount: (old.engagement?.commentsCount ?? 0) + 1,
              likesCount: old.engagement?.likesCount ?? 0,
              isLiked: old.engagement?.isLiked,
            },
          };
        },
      );

      // Optimistically update comments list
      queryClient.setQueryData(
        ["marketplace", "comments", productId],
        (old: any) => {
          if (!old) return old;
          const firstPage = old.pages[0];

          // Safely get existing comments (handle both wrapped and unwrapped responses)
          const existingComments =
            firstPage?.data?.comments || firstPage?.comments || [];

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                ...(firstPage?.data
                  ? {
                      data: {
                        ...firstPage.data,
                        comments: [optimisticComment, ...existingComments],
                      },
                    }
                  : {
                      comments: [optimisticComment, ...existingComments],
                    }),
              },
              ...old.pages.slice(1),
            ],
          };
        },
      );

      return { previousProduct, previousComments };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ["marketplace", "product", productId],
          context.previousProduct,
        );
      }
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["marketplace", "comments", productId],
          context.previousComments,
        );
      }

      toast.error(getErrorMessage(error) || "Failed to post comment");
    },
    onSuccess: () => {
      lastCommentTimeRef.current = Date.now();
      // Refetch to get real data from server
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "comments", productId],
      });
      toast.success("Comment posted!");
    },
  });

  return { addComment };
}

/**
 * Hook for save/unsave product
 */
export function useSaveProduct(productId: string) {
  const queryClient = useQueryClient();
  const { enqueue } = useMarketplaceOfflineQueue();

  const saveProduct = useMutation({
    mutationFn: () => marketplaceService.saveItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", productId],
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "saved"] });
      toast.success("Product saved!");
    },
    onError: (error) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueue({ type: "save", productId });
        toast.success("Saved — will sync once you're back online");
        return;
      }
      toast.error(getErrorMessage(error) || "Failed to save product");
    },
  });

  const unsaveProduct = useMutation({
    mutationFn: () => marketplaceService.unsaveItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", productId],
      });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "saved"] });
      toast.success("Product unsaved!");
    },
    onError: (error) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueue({ type: "unsave", productId });
        toast.success("Unsaved — will sync once you're back online");
        return;
      }
      toast.error(getErrorMessage(error) || "Failed to unsave product");
    },
  });

  return { saveProduct, unsaveProduct };
}

// ==================== Buyer Intent & Transactions Hooks ====================

/**
 * Hook for making an offer on a negotiable product.
 * The caller is always the buyer in this flow (initial offer or accepting a
 * seller's counter by re-submitting at the counter price).
 */
export function useMakeOffer(productId: string) {
  const queryClient = useQueryClient();
  const awardCoins = useAwardCoins();

  return useMutation({
    mutationFn: (amount: number) =>
      marketplaceService.makeOffer(productId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "offers"],
      });
      awardCoins("offer_made");
      // Toast is shown by the caller so it can include the offer amount and
      // tailor the perspective (e.g. accepting a counter vs. fresh offer).
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to send offer");
    },
  });
}

/**
 * Hook for responding to an offer.
 * In the current product, only the seller invokes this hook (the seller
 * accepts, rejects, or counters a buyer's offer). `viewerRole` defaults to
 * `'seller'` for that reason — pass `'buyer'` explicitly if a future flow
 * lets buyers respond directly.
 */
export function useRespondToOffer(
  offerId: string,
  viewerRole: OfferRole = "seller",
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      counterAmount,
    }: {
      action: "accept" | "reject" | "counter";
      counterAmount?: number;
    }) => marketplaceService.respondToOffer(offerId, action, counterAmount),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "offers"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "offer", offerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product-offers"],
      });

      const amount = variables.counterAmount ?? 0;
      toast.success(
        getOfferToast(
          { action: variables.action, amount, actorRole: viewerRole },
          viewerRole,
        ),
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to respond to offer");
    },
  });
}

/**
 * Hook for accepting an offer via the shorthand endpoint (no body needed).
 * Always invoked by the seller in the current product.
 */
export function useAcceptOffer(viewerRole: OfferRole = "seller") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => marketplaceService.acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "offers"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product-offers"],
      });
      toast.success(
        getOfferToast(
          { action: "accept", amount: 0, actorRole: viewerRole },
          viewerRole,
        ),
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to accept offer");
    },
  });
}

/**
 * Hook for rejecting an offer via the shorthand endpoint (no body needed).
 * Always invoked by the seller in the current product.
 */
export function useRejectOffer(viewerRole: OfferRole = "seller") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => marketplaceService.rejectOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "offers"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product-offers"],
      });
      toast.success(
        getOfferToast(
          { action: "reject", amount: 0, actorRole: viewerRole },
          viewerRole,
        ),
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to reject offer");
    },
  });
}

/**
 * Hook for fetching all offers on a specific product (seller view).
 * GET /api/v1/marketplace/products/:productId/offers
 */
export function useProductOffers(productId: string | null, status?: string) {
  return useQuery({
    queryKey: ["marketplace", "product-offers", productId, status],
    queryFn: async () => {
      if (!productId) return null;
      const res = await marketplaceService.getProductOffers(productId, status);
      const payload = (res as any)?.data ?? res;
      return {
        product: payload?.data?.product ?? payload?.product ?? null,
        offers: (payload?.data?.offers ??
          payload?.offers ??
          []) as import("@/types/api").MarketplaceOffer[],
        pagination: payload?.data?.pagination ?? payload?.pagination ?? null,
      };
    },
    enabled: !!productId,
    staleTime: 30_000,
  });
}

/**
 * Hook for creating an order (request to buy)
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { productId: string; offerId?: string; buyNow?: boolean }) =>
      marketplaceService.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "orders"],
      });
      toast.success("Request to buy sent to seller!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to create order");
    },
  });
}

/**
 * Hook for the unified P2P deal list — every offer/order the user is buyer OR
 * seller on. Replaces useMyOrders / useMySales / useMyOffers.
 * role: omit for all deals, or filter to "buying" | "selling".
 */
export function useMyDeals(role?: "buying" | "selling") {
  return useQuery({
    queryKey: ["marketplace", "my-deals", role ?? "all"],
    queryFn: async () => {
      const res = await marketplaceService.getMyDeals(role);
      const payload: any = (res as any)?.data ?? res;
      return (payload?.deals ?? []) as import("@/services/marketplace.service").MyDeal[];
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching a specific order
 */
export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["marketplace", "order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await marketplaceService.getOrder(orderId);
      return (
        (response as any)?.data?.order || (response as any)?.order || response
      );
    },
    enabled: !!orderId,
  });
}


/**
 * Hook for fetching a specific offer
 */
export function useOffer(offerId: string | null) {
  return useQuery({
    queryKey: ["marketplace", "offer", offerId],
    queryFn: async () => {
      if (!offerId) return null;
      const response = await marketplaceService.getOffer(offerId);
      return (
        (response as any)?.data?.offer || (response as any)?.offer || response
      );
    },
    enabled: !!offerId,
  });
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) =>
      marketplaceService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "order", orderId],
      });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "orders"],
      });
      toast.success("Order status updated!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to update order status");
    },
  });
}

/**
 * Hook for confirming payment (buyer)
 */
export function useConfirmPayment(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proofUrl: string) =>
      marketplaceService.confirmPayment(orderId, proofUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "order", orderId],
      });
      toast.success("Payment proof uploaded!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to upload payment proof");
    },
  });
}

/**
 * Hook for confirming receipt (seller)
 */
export function useConfirmReceipt(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => marketplaceService.confirmReceipt(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "order", orderId],
      });
      toast.success("Payment confirmed!");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Failed to confirm payment");
    },
  });
}

/**
 * Hook for boosting a marketplace listing with HuudCoins.
 * On success invalidates the listings cache so the boosted badge appears immediately.
 */
export function useBoostProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, days }: { productId: string; days: 3 | 7 | 14 | 30 }) =>
      marketplaceService.boostProduct(productId, days),
    onSuccess: (res, { days }) => {
      const data = (res as any)?.data ?? res;
      const until = data?.boostedUntil
        ? new Date(data.boostedUntil).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
        : "";
      toast.success(
        data?.extended
          ? `Boost extended! Featured until ${until} 🚀`
          : `Listing boosted for ${days} days! Featured until ${until} 🚀`,
        { description: `${data?.deducted ?? "–"} HuudCoins deducted from your wallet.` },
      );
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "products"] });
      queryClient.invalidateQueries({ queryKey: ["gamification", "wallet"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || "Boost failed. Please try again.");
    },
  });
}

/** Fetch up to `limit` marketplace listings by seller (profile pages). */
export function useUserMarketplace(userId: string | null, limit = 3) {
  return useQuery({
    queryKey: ["marketplace", "by-user", userId, limit],
    queryFn: async () => {
      const res = await marketplaceService.getItems(1, limit, { sellerId: userId! });
      const payload = (res as any)?.data ?? res;
      const items =
        payload?.products ??
        payload?.items ??
        payload?.data ??
        payload ??
        [];
      return Array.isArray(items) ? items : [];
    },
    enabled: !!userId,
    staleTime: 60_000,
    retry: false,
  });
}
