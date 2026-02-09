/**
 * Post Search Result Component
 * Displays a post result in the search dropdown
 */

'use client';
import { SearchPost } from '@/types/search';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Props {
  post: SearchPost;
  onClose: () => void;
}

export const PostSearchResult = ({ post, onClose }: Props) => {
  const router = useRouter();

  const handleClick = () => {
    // Navigate to post detail page - adjust route as needed
    router.push(`/feed?postId=${post.id}`);
    onClose();
  };

  // Safety check
  if (!post || !post.id) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 hover:bg-gray-50 dark:hover:bg-surface-base-dark rounded-lg transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {/* Author Avatar */}
        <div className="relative h-10 w-10 shrink-0">
          {post.author?.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-1 mb-1">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {post.author?.name || 'Unknown'}
            </span>
            {post.author?.isVerified && (
              <i className="bi bi-patch-check-fill text-primary text-xs shrink-0" />
            )}
            <span className="text-gray-500 dark:text-text-secondary-dark text-sm">
              · {formatTimeAgo(post.createdAt)}
            </span>
          </div>

          {/* Post Title */}
          {post.title && (
            <h4 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">{post.title}</h4>
          )}

          {/* Post Content */}
          <p className="text-gray-700 dark:text-text-secondary-dark text-sm line-clamp-2">{post.content}</p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {post.tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-primary text-sm">
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-gray-500 dark:text-text-secondary-dark text-sm">
                  +{post.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-text-secondary-dark">
            <span className="flex items-center gap-1">
              <i className={`bi ${post.isLiked ? 'bi-heart-fill text-red-500' : 'bi-heart'}`} />
              {post.likes || 0}
            </span>
            <span className="flex items-center gap-1">
              <i className="bi bi-chat" />
              {post.comments || 0}
            </span>
          </div>
        </div>

        {/* Post Media Thumbnail */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="relative w-16 h-16 shrink-0">
            <Image 
              src={post.mediaUrls[0]} 
              alt="" 
              fill
              className="rounded object-cover"
            />
            {post.mediaUrls.length > 1 && (
              <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center text-white text-xs font-semibold">
                +{post.mediaUrls.length - 1}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
