/**
 * ProductEngagement Component
 * Like and comment buttons for marketplace products
 */

import { useProductLike } from "@/hooks/useMarketplace";
import { Product } from "@/services/marketplace.service";

interface ProductEngagementProps {
  product: Product;
  onCommentClick?: () => void;
  currentUserId?: string;
}

export function ProductEngagement({
  product,
  onCommentClick,
  currentUserId,
}: ProductEngagementProps) {
  const { mutate: toggleLike, isPending: isLikePending } = useProductLike(
    product.id,
  );

  const isLiked = product.engagement?.isLiked ?? false;
  const likesCount = product.engagement?.likesCount ?? 0;
  const commentsCount = product.engagement?.commentsCount ?? 0;

  const handleLikeClick = () => {
    if (!currentUserId) {
      // User not authenticated
      return;
    }
    toggleLike();
  };

  return (
    <div className="flex items-center gap-4 border-t border-gray-800 pt-4">
      {/* Like Button */}
      <button
        onClick={handleLikeClick}
        disabled={isLikePending || !currentUserId}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        aria-label={isLiked ? "Unlike this product" : "Like this product"}
      >
        <svg
          className={`w-6 h-6 transition-all ${
            isLiked
              ? "text-red-500 fill-current scale-110"
              : "text-gray-400 group-hover:text-red-500 group-hover:scale-110"
          }`}
          fill={isLiked ? "currentColor" : "none"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <span className={isLiked ? "text-red-500 font-semibold" : "text-gray-400"}>
          {likesCount > 0 ? likesCount : "Like"}
        </span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
        aria-label="View comments"
      >
        <svg
          className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-gray-400">
          {commentsCount > 0 ? commentsCount : "Comment"}
        </span>
      </button>
    </div>
  );
}
