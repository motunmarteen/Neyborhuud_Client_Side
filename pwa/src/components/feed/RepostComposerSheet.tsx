'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Post } from '@/types/api';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import { QuotedPostEmbed } from '@/components/feed/QuotedPostEmbed';
import { contentService } from '@/services/content.service';
import { XRepostIcon } from '@/components/icons/XIcons';
import { getRegisteredLocationSync } from '@/hooks/useRegisteredLocation';

type RepostComposerSheetProps = {
  open: boolean;
  sourcePost: Post;
  onClose: () => void;
  onReposted?: () => void;
};

export function RepostComposerSheet({
  open,
  sourcePost,
  onClose,
  onReposted,
}: RepostComposerSheetProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRepost = async () => {
    const postId = sourcePost.id ?? sourcePost._id;
    if (!postId) return;

    setIsSubmitting(true);
    try {
      const loc = getRegisteredLocationSync();
      if (!loc) {
        toast.error('Set your home location in Settings to repost');
        setIsSubmitting(false);
        return;
      }
      await contentService.repostPost(postId, comment, { lat: loc.latitude, lng: loc.longitude });
      toast.success(comment.trim() ? 'Quote reposted to your feed' : 'Reposted to your feed');
      setComment('');
      onReposted?.();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not repost. Try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <BottomSheetOverlay 
      open={open} 
      onClose={onClose} 
      ariaLabel="Repost composer"
      panelClassName="flex w-full flex-col overflow-hidden rounded-t-[32px] bg-white  border border-black/[0.08]  md:max-w-[560px] shadow-2xl pb-4"
    >
      <div className="px-4 pt-4 pb-3 border-b border-black/[0.06] ">
        <h2 className="text-base font-black text-neu-text ">Repost</h2>
      </div>
      <div className="flex flex-col gap-4 px-4 pb-6 pt-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment…"
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-2xl border border-black/[0.08]  bg-black/[0.02]  px-4 py-3 text-sm text-neu-text  placeholder:text-neu-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        {sourcePost.mood === 'repost' && sourcePost.content?.trim() && sourcePost.quotedPost && (
          <p className="text-sm font-medium text-neu-text-secondary  whitespace-pre-wrap">
            {sourcePost.content.trim()}
          </p>
        )}

        <QuotedPostEmbed post={sourcePost.quotedPost ?? sourcePost} compact />

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleRepost}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-green-dark py-3 text-sm font-black text-white transition-opacity disabled:opacity-50"
        >
          <XRepostIcon size={18} className="text-white" />
          {comment.trim() ? 'Quote repost' : 'Repost'}
        </button>
      </div>
    </BottomSheetOverlay>
  );
}
