'use client';

/**
 * Reply to a post with one of your avatar stickers (owner 2026-10-18). The sticker is uploaded
 * through the app's own media upload and posted as a comment marked as a sticker, so it shows
 * as a sticker (no bubble, no repeated caption) under the post.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { StickerPicker, uploadSticker } from '@/components/avatar/StickerPicker';
import { useCommentMutations } from '@/hooks/useComments';
import { useTranslation } from '@/lib/i18n';

export function StickerReplySheet({
  postId,
  parentId,
  open,
  onClose,
  onSent,
}: {
  postId: string;
  parentId?: string;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { t } = useTranslation();
  const { createComment } = useCommentMutations(postId);
  const [busy, setBusy] = useState(false);

  const send = async (dataUrl: string, caption: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const url = await uploadSticker(dataUrl, caption);
      await createComment({ body: caption, mediaUrls: [url], sticker: true, parentId });
      toast.success(t('sticker.sent'));
      onSent?.();
      onClose();
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message;
      toast.error(msg || t('sticker.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet open={open} onClose={onClose} title={t('sticker.title')}>
      <div className={busy ? 'pointer-events-none opacity-60' : undefined} aria-busy={busy}>
        {open ? <StickerPicker onPick={(url, caption) => void send(url, caption)} /> : null}
      </div>
    </AppBottomSheet>
  );
}
