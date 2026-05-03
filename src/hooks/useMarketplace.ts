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
export function useProductLike(productId: string) {
  const queryClient = useQueryClient();

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

      return { previousProduct };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ["marketplace", "product", productId],
          context.previousProduct,
        );
      }
      toast.error(getErrorMessage(error) || "Failed to update like");
    },
    onSuccess: (data) => {
      // Update with server data
      const responseData = (data as any).data || data;
      queryClient.setQueryData<Product>(
        ["marketplace", "product", productId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            engagement: {
              ...old.engagement,
              isLiked: responseData.isLiked,
              likesCount: responseData.likesCount,
              commentsCount: old.engagement?.commentsCount ?? 0,
            },
          };
        },
      );
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
    mutationFn: (data: { productId: string; offerId?: string }) =>
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
 * Hook for fetching my orders (as buyer)
 */
export function useMyOrders() {
  return useInfiniteQuery({
    queryKey: ["marketplace", "orders", "my-orders"],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getMyOrders(pageParam, 20),
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.pagination || lastPage?.data?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.pages
        ? pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Hook for fetching my sales (as seller)
 */
export function useMySales() {
  return useInfiniteQuery({
    queryKey: ["marketplace", "orders", "my-sales"],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getMySales(pageParam, 20),
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.pagination || lastPage?.data?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.pages
        ? pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
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
 * Hook for fetching my offers (sent or received)
 */
export function useMyOffers(type: "sent" | "received") {
  return useInfiniteQuery({
    queryKey: ["marketplace", "offers", type],
    queryFn: ({ pageParam = 1 }) =>
      marketplaceService.getMyOffers(type, pageParam, 20),
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage?.pagination || lastPage?.data?.pagination;
      if (!pagination) return undefined;
      return pagination.page < pagination.pages
        ? pagination.page + 1
        : undefined;
    },
    initialPageParam: 1,
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
