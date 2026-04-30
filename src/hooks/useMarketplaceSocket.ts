/**
 * useMarketplaceSocket Hook
 * Handles real-time WebSocket updates for marketplace products
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import socketService from "@/lib/socket";
import { Product } from "@/services/marketplace.service";

interface ProductUpdatedEvent {
  productId: string;
  action: "liked" | "unliked";
  userId: string;
  likesCount: number;
}

interface ProductCommentedEvent {
  productId: string;
  comment: {
    id: string;
    _id: string;
    body: string;
    user: {
      id: string;
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
    mediaUrls?: string[];
    likesCount: number;
    createdAt: string;
  };
}

/**
 * Hook to listen for real-time marketplace updates
 */
export function useMarketplaceSocket() {
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect to socket if not already connected
    if (!socketService.isConnected() && !isConnectedRef.current) {
      socketService.connect();
      isConnectedRef.current = true;
    }

    // Handler for product:updated event (likes/unlikes)
    const handleProductUpdated = (data: ProductUpdatedEvent) => {
      console.log("📢 Product updated:", data);

      // Update the specific product in cache
      queryClient.setQueryData<Product>(
        ["marketplace", "product", data.productId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            engagement: {
              ...old.engagement,
              likesCount: data.likesCount,
              commentsCount: old.engagement?.commentsCount ?? 0,
              // Only update isLiked if it's the current user's action
              // (handled by optimistic update in the mutation)
            },
          };
        },
      );

      // Also invalidate product lists to reflect changes
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "products"],
        refetchType: "none", // Don't refetch, just mark as stale
      });
    };

    // Handler for product:commented event
    const handleProductCommented = (data: ProductCommentedEvent) => {
      console.log("💬 New comment on product:", data);

      // Update the product's comment count
      queryClient.setQueryData<Product>(
        ["marketplace", "product", data.productId],
        (old) => {
          if (!old) return old;

          return {
            ...old,
            engagement: {
              ...old.engagement,
              likesCount: old.engagement?.likesCount ?? 0,
              commentsCount: (old.engagement?.commentsCount ?? 0) + 1,
            },
          };
        },
      );

      // Add the comment to the comments list
      queryClient.setQueryData(
        ["marketplace", "comments", data.productId],
        (old: any) => {
          if (!old || !old.pages || !old.pages[0]) return old;

          // Check if comment already exists (from optimistic update)
          const firstPage = old.pages[0];
          const existingComments = firstPage?.data?.comments || firstPage?.comments || [];
          
          const commentExists = existingComments.some(
            (c: any) =>
              c.id === data.comment.id || c._id === data.comment._id,
          );

          if (commentExists) {
            // Replace optimistic comment with real data
            return {
              ...old,
              pages: old.pages.map((page: any, idx: number) => {
                if (idx === 0) {
                  const pageComments = page?.data?.comments || page?.comments || [];
                  const updatedComments = pageComments.map((c: any) =>
                    c.id?.startsWith("temp-") &&
                    c.body === data.comment.body
                      ? data.comment
                      : c,
                  );
                  
                  return {
                    ...page,
                    ...(page?.data ? {
                      data: {
                        ...page.data,
                        comments: updatedComments,
                      }
                    } : {
                      comments: updatedComments,
                    }),
                  };
                }
                return page;
              }),
            };
          }

          // Add new comment from another user
          const paginationData = firstPage?.data?.pagination || firstPage?.pagination || { total: 0 };
          
          return {
            ...old,
            pages: [
              {
                ...firstPage,
                ...(firstPage?.data ? {
                  data: {
                    ...firstPage.data,
                    comments: [data.comment, ...existingComments],
                    pagination: {
                      ...paginationData,
                      total: paginationData.total + 1,
                    },
                  }
                } : {
                  comments: [data.comment, ...existingComments],
                  pagination: {
                    ...paginationData,
                    total: paginationData.total + 1,
                  },
                }),
              },
              ...old.pages.slice(1),
            ],
          };
        },
      );
    };

    // Register event listeners
    socketService.on("product:updated", handleProductUpdated);
    socketService.on("product:commented", handleProductCommented);

    // Cleanup on unmount
    return () => {
      socketService.off("product:updated", handleProductUpdated);
      socketService.off("product:commented", handleProductCommented);
      // Don't disconnect the socket as other components might be using it
    };
  }, [queryClient]);

  return {
    isConnected: socketService.isConnected(),
    joinProduct: (productId: string) => {
      socketService.emit("join:product", productId);
    },
    leaveProduct: (productId: string) => {
      socketService.emit("leave:product", productId);
    },
  };
}

/**
 * Hook to join/leave a specific product room for real-time updates
 */
export function useProductRoom(productId: string | null) {
  const { joinProduct, leaveProduct } = useMarketplaceSocket();

  useEffect(() => {
    if (!productId) return;

    // Join product-specific room
    joinProduct(productId);

    // Leave room on unmount
    return () => {
      leaveProduct(productId);
    };
  }, [productId, joinProduct, leaveProduct]);
}
