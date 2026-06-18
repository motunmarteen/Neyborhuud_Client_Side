'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Post } from '@/types/api';
import type { PostCardMenuSection } from '@/components/feed/PostCardActionsSheet';
import { postInteractionService } from '@/services/post-interaction.service';
import { blockService } from '@/services/block.service';
import { followService } from '@/services/follow.service';
import { safetyService } from '@/services/safety.service';
import { chatService } from '@/services/chat.service';
import { handleApiError } from '@/lib/error-handler';

export type UsePostCardMenuActionsParams = {
  post: Post;
  postId: string;
  authorId?: string;
  authorName: string;
  authorUsername: string;
  isOwnerPost: boolean;
  isAnonymousAuthor: boolean;
  isFollowing?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onFeedPreferenceApplied?: (postId: string, signal: 'not_interested' | 'hide') => void;
};

export function usePostCardMenuActions({
  post,
  postId,
  authorId,
  authorName,
  authorUsername,
  isOwnerPost,
  isAnonymousAuthor,
  isFollowing = false,
  onEdit,
  onDelete,
  onPin,
  onReport,
  onFeedPreferenceApplied,
}: UsePostCardMenuActionsParams) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidateSocial = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
    queryClient.invalidateQueries({ queryKey: ['fyi'] });
    queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
    queryClient.invalidateQueries({ queryKey: ['follow-status', authorId] });
    queryClient.invalidateQueries({ queryKey: ['block-status', authorId] });
  }, [queryClient, authorId]);

  const applyFeedSignal = useCallback(
    async (signal: 'interested' | 'not_interested' | 'hide') => {
      if (!postId) return;
      try {
        await postInteractionService.setFeedSignal(postId, signal);
        invalidateSocial();
        if (signal === 'interested') {
          toast.success('Marked as interested — we’ll show more like this.');
        } else if (signal === 'not_interested') {
          toast.success('Got it — fewer posts like this.');
          onFeedPreferenceApplied?.(postId, 'not_interested');
        } else {
          toast.success('Post hidden from your feed.');
          onFeedPreferenceApplied?.(postId, 'hide');
        }
      } catch (error) {
        handleApiError(error);
      }
    },
    [postId, invalidateSocial, onFeedPreferenceApplied],
  );

  const handleMessage = useCallback(async () => {
    if (!authorId || isAnonymousAuthor) return;
    try {
      const res = await chatService.getOrCreateDirectConversation(authorId);
      const conv = (res.data as { conversation?: { _id?: string; conversationId?: string; id?: string } })?.conversation
        ?? (res.data as { _id?: string; conversationId?: string; id?: string });
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) router.push(`/chat/${convId}`);
    } catch (error) {
      handleApiError(error);
    }
  }, [authorId, isAnonymousAuthor, router]);

  const handleCall = useCallback(async () => {
    if (!authorId || isAnonymousAuthor) return;
    try {
      const res = await chatService.getOrCreateDirectConversation(authorId);
      const conv = (res.data as { conversation?: { _id?: string; conversationId?: string; id?: string } })?.conversation
        ?? (res.data as { _id?: string; conversationId?: string; id?: string });
      const convId = conv?._id ?? conv?.conversationId ?? conv?.id;
      if (convId) router.push(`/chat/${convId}?voice=1`);
    } catch (error) {
      handleApiError(error);
    }
  }, [authorId, isAnonymousAuthor, router]);

  const handleMakeGuardian = useCallback(async () => {
    if (!authorId || isAnonymousAuthor) return;
    try {
      await safetyService.requestGuardian({ guardianId: authorId, relationshipType: 'friend' });
      toast.success(`Guardian request sent to ${authorName}.`);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.message('A guardian request is already pending or accepted.');
        return;
      }
      handleApiError(error);
    }
  }, [authorId, isAnonymousAuthor, authorName]);

  const handleUnfollow = useCallback(async () => {
    if (!authorId) return;
    try {
      await followService.unfollowUser(authorId);
      invalidateSocial();
      toast.success(`Unfollowed @${authorUsername}.`);
    } catch (error) {
      handleApiError(error);
    }
  }, [authorId, authorUsername, invalidateSocial]);

  const handleBlock = useCallback(async () => {
    if (!authorId || isAnonymousAuthor) return;
    try {
      await blockService.blockUser(authorId);
      invalidateSocial();
      toast.success(`Blocked @${authorUsername}.`);
      onFeedPreferenceApplied?.(postId, 'hide');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.message('User is already blocked.');
        return;
      }
      handleApiError(error);
    }
  }, [authorId, isAnonymousAuthor, authorUsername, invalidateSocial, onFeedPreferenceApplied, postId]);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === 'undefined' || !postId) return;
    const url = `${window.location.origin}/feed?post=${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch {
      toast.error('Could not copy link.');
    }
  }, [postId]);

  const sections: PostCardMenuSection[] = useMemo(() => {
    const feedItems: PostCardMenuSection['items'] = [];
    const connectItems: PostCardMenuSection['items'] = [];
    const safetyItems: PostCardMenuSection['items'] = [];
    const manageItems: PostCardMenuSection['items'] = [];

    if (!isOwnerPost) {
      feedItems.push(
        { id: 'interested', label: 'Interested', icon: 'thumb_up', onSelect: () => applyFeedSignal('interested') },
        { id: 'not-interested', label: 'Not interested', icon: 'thumb_down', onSelect: () => applyFeedSignal('not_interested') },
        { id: 'hide', label: 'Hide post', icon: 'visibility_off', onSelect: () => applyFeedSignal('hide') },
      );
    }

    manageItems.push({
      id: 'copy-link',
      label: 'Copy link',
      icon: 'link',
      onSelect: handleCopyLink,
    });

    if (!isOwnerPost && !isAnonymousAuthor && authorId) {
      connectItems.push(
        { id: 'message', label: 'Message', icon: 'chat', onSelect: handleMessage },
        { id: 'call', label: 'Call in Huud', icon: 'call', onSelect: handleCall },
        { id: 'guardian', label: 'Make guardian', icon: 'shield_person', onSelect: handleMakeGuardian },
      );
      if (isFollowing) {
        connectItems.push({
          id: 'unfollow',
          label: 'Unfollow',
          icon: 'person_remove',
          onSelect: handleUnfollow,
        });
      }
    }

    if (!isOwnerPost && !isAnonymousAuthor) {
      if (onReport && postId) {
        safetyItems.push({
          id: 'report',
          label: 'Report post',
          icon: 'flag',
          danger: true,
          onSelect: () => onReport(postId),
        });
      }
      if (authorId) {
        safetyItems.push({
          id: 'block',
          label: 'Block user',
          icon: 'block',
          danger: true,
          onSelect: handleBlock,
        });
      }
    }

    if (isOwnerPost) {
      if (onEdit) {
        manageItems.push({
          id: 'edit',
          label: 'Edit post',
          icon: 'edit',
          onSelect: () => onEdit(post),
        });
      }
      if (onPin && postId) {
        manageItems.push({
          id: 'pin',
          label: post.isPinned ? 'Extend pin' : 'Pin to feed',
          icon: 'push_pin',
          onSelect: () => onPin(postId),
        });
      }
      if (onDelete && postId) {
        manageItems.push({
          id: 'delete',
          label: 'Delete post',
          icon: 'delete',
          danger: true,
          onSelect: () => onDelete(postId),
        });
      }
    }

    return [
      { id: 'feed', title: 'Your feed', items: feedItems },
      { id: 'connect', title: 'Connect', items: connectItems },
      { id: 'manage', title: 'Post', items: manageItems },
      { id: 'safety', title: 'Safety', items: safetyItems },
    ].filter((section) => section.items.length > 0);
  }, [
    post,
    postId,
    authorId,
    isOwnerPost,
    isAnonymousAuthor,
    isFollowing,
    onEdit,
    onDelete,
    onPin,
    onReport,
    applyFeedSignal,
    handleMessage,
    handleCall,
    handleMakeGuardian,
    handleUnfollow,
    handleBlock,
    handleCopyLink,
  ]);

  return { sections };
}
