/**
 * XPostCard — the feed's post card (tracker F-13).
 *
 * The look is the shared PostCard (components/feed/PostCard.tsx, approved on /design-kit):
 * type badge on the avatar, photo slider, one reaction, type-specific details and
 * main button. This wrapper keeps everything the feed relied on: follow, the ⋯ menu,
 * share, instant repost, the repost chain, safety actions, Helpful — and adds poll
 * voting and Lost & Found.
 * Same props as before, so the feed, profiles, FYI and help requests switch together.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Post, PostAuthor } from '@/types/api';
import { useFollow } from '@/hooks/useFollow';
import ShareModal from './ShareModal';
import { PostCardActionsSheet } from '@/components/feed/PostCardActionsSheet';
import { usePostCardMenuActions } from '@/hooks/usePostCardMenuActions';
import { RepostComposerSheet } from '@/components/feed/RepostComposerSheet';
import { PostRepostChainModal } from './PostRepostChainModal';
import { PostCard, getPostKind, type EmergencyAction, type PostPoll, type PostPrimaryAction } from '@/components/feed/PostCard';
import { getPostAuthorUserId } from '@/lib/postAuthor';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';
import { usePostMutations } from '@/hooks/usePosts';
import { apiMessage, votePoll } from '@/lib/pollsApi';

interface XPostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onEmergencyAction?: (action: string) => void;
  onCardClick?: () => void;
  currentUserId?: string;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onPin?: (postId: string) => void;
  onHelpful?: () => void;
  onReposted?: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onFeedPreferenceApplied?: (postId: string, signal: 'not_interested' | 'hide') => void;
}

export function XPostCard({
  post,
  onLike,
  onComment,
  onSave,
  onEmergencyAction,
  onCardClick,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onPin,
  onHelpful,
  onReposted,
  onFeedPreferenceApplied,
  userLocation,
}: XPostCardProps) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showRepostComposer, setShowRepostComposer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chainModalOpen, setChainModalOpen] = useState(false);
  const [pollOverride, setPollOverride] = useState<PostPoll | null>(null);
  const { sharePost, unsharePost } = usePostMutations();

  const author = post.author as PostAuthor;
  const fullName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') : '';
  const authorName = fullName || author?.name || author?.username || 'Anonymous';
  const authorUsername = author?.username || 'user';
  const authorAvatar = resolveUserAvatarUrl(author);
  const isAnonymousAuthor = !author?.id || author.id === 'anonymous';
  const isOwnerPost = !!currentUserId && (author?.id === currentUserId || post.authorId === currentUserId);
  const authorUserId = getPostAuthorUserId(post);
  const postId = post.id ?? (post as { _id?: string })._id ?? '';

  const canFollow = !isOwnerPost && !isAnonymousAuthor && !!authorUserId;
  const { isFollowing, toggleFollow, isPending: isFollowPending } = useFollow(authorUserId, { enabled: canFollow });

  const { sections: menuSections } = usePostCardMenuActions({
    post,
    postId,
    authorId: authorUserId,
    authorName,
    authorUsername,
    isOwnerPost,
    isAnonymousAuthor,
    isFollowing,
    onEdit,
    onDelete,
    onPin,
    onReport,
    onFeedPreferenceApplied,
  });

  const kind = getPostKind(post);
  const isNewLostFound = kind === 'lost_found' && !!post.metadata?.lostFound;
  const shown: Post = pollOverride ? { ...post, metadata: { ...post.metadata, poll: pollOverride } } : post;

  const handleInstantRepost = async () => {
    try {
      if (post.isShared) {
        await unsharePost(post.id);
        toast.success('Repost removed');
      } else {
        await sharePost({ postId: post.id, location: userLocation || undefined });
        toast.success('Reposted to your feed');
      }
      onReposted?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Action failed. Try again.'));
    }
  };

  const handleVote = async (optionIndex: number) => {
    try {
      const poll = await votePoll(postId, optionIndex);
      setPollOverride(poll as unknown as PostPoll);
    } catch (err) {
      toast.error(apiMessage(err, 'Your vote was not counted. Try again.'));
    }
  };

  const handlePrimary = (action: PostPrimaryAction) => {
    switch (action) {
      case 'message_seller':
      case 'apply':
      case 'book':
        if (isOwnerPost) {
          toast.info('This is your own post.');
          return;
        }
        router.push(`/chat?user=${encodeURIComponent(authorUsername)}`);
        return;
      case 'found_it':
      case 'its_mine':
        router.push(`/lost-found/${postId}`);
        return;
      default:
        // going (events) and help (help requests) continue on the post itself
        onCardClick?.();
    }
  };

  const openCard = () => {
    if (isNewLostFound) router.push(`/lost-found/${postId}`);
    else onCardClick?.();
  };

  return (
    <>
      <PostCard
        post={shown}
        onLike={onLike}
        onComment={onComment}
        onSave={onSave}
        onShare={() => setShowShare(true)}
        onRepost={handleInstantRepost}
        onHelpful={onHelpful}
        onMenu={() => setMenuOpen(true)}
        onCardClick={openCard}
        onOpenQuoted={onCardClick}
        onOpenRepostChain={post.repostedBy || post.sharedFrom ? () => setChainModalOpen(true) : undefined}
        onPrimaryAction={handlePrimary}
        onEmergencyAction={onEmergencyAction ? (a: EmergencyAction) => onEmergencyAction(a) : undefined}
        onVote={handleVote}
        onFollow={canFollow ? toggleFollow : undefined}
        isFollowing={isFollowing}
        followPending={isFollowPending}
      />

      {showShare ? <ShareModal postId={postId} postContent={post.content ?? ''} onClose={() => setShowShare(false)} /> : null}
      <RepostComposerSheet open={showRepostComposer} sourcePost={post} onClose={() => setShowRepostComposer(false)} onReposted={onReposted} />
      {chainModalOpen ? <PostRepostChainModal postId={postId} open={chainModalOpen} onClose={() => setChainModalOpen(false)} /> : null}
      <PostCardActionsSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        authorName={isAnonymousAuthor ? 'Anonymous Neyborh' : authorName}
        authorUsername={authorUsername}
        authorAvatar={authorAvatar}
        sections={menuSections}
      />
    </>
  );
}
