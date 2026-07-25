'use client';

/**
 * MessageActionSheet — the message long-press/tap action menu (audit finding
 * #6 reply-to, #9/#16 report message). Opens from the same long-press
 * trigger as the emoji reaction picker (MessageStack in ChatMessageCard),
 * rendered as a small portal-based menu positioned next to the message,
 * mirroring MessageReactions' own positioning approach for visual
 * consistency between the two popups.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/api';

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'other', label: 'Other' },
];

export type MessageActionSheetProps = {
  msg: ChatMessage;
  mine: boolean;
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
  onReply: (msg: ChatMessage) => void;
  onDeleteForMe?: (msg: ChatMessage) => void;
};

export function MessageActionSheet({ msg, mine, open, onClose, anchorRef, onReply, onDeleteForMe }: MessageActionSheetProps) {
  const messageId = msg.id ?? msg._id;
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = anchorRef?.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const menuW = menu.offsetWidth;
    const menuH = menu.offsetHeight;
    const gap = 6;
    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + gap;
    if (top + menuH > vh - pad) top = rect.top - menuH - gap;
    top = Math.max(pad, Math.min(top, vh - menuH - pad));

    let left = mine ? rect.right - menuW : rect.left;
    left = Math.max(pad, Math.min(left, vw - menuW - pad));

    setMenuStyle({ position: 'fixed', top: `${top}px`, left: `${left}px`, zIndex: 251, visibility: 'visible' });
  }, [mine, anchorRef]);

  useEffect(() => {
    if (!open || !messageId) return;
    const raf = requestAnimationFrame(updatePosition);
    const onReflow = () => updatePosition();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, updatePosition, messageId]);

  useEffect(() => {
    if (!open) {
      setReportOpen(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setReportOpen(false); onClose(); }
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (anchorRef?.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setReportOpen(false);
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open, anchorRef, onClose]);

  if (!open || !messageId || typeof document === 'undefined') return null;

  const handleReply = () => {
    onReply(msg);
    onClose();
  };

  const handleDeleteForMe = () => {
    onDeleteForMe?.(msg);
    onClose();
  };

  const submitReport = async (reason: string) => {
    setReporting(true);
    try {
      await chatService.reportMessage(messageId, reason);
      toast.success('Report submitted. Our team will review it.');
      setReportOpen(false);
      onClose();
    } catch (err) {
      const apiMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(apiMsg || 'Could not submit report.');
    } finally {
      setReporting(false);
    }
  };

  return createPortal(
    <div ref={menuRef} className="mod-card-elevated flex flex-col overflow-hidden rounded-2xl" style={menuStyle} role="menu" aria-label="Message actions">
      {!reportOpen ? (
        <>
          {!msg.isDeleted && (
            <button
              type="button"
              role="menuitem"
              onClick={handleReply}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">reply</span>
              Reply
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteForMe}
            className="flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <span className="material-symbols-outlined text-[18px]">visibility_off</span>
            Delete for me
          </button>
          {!mine && !msg.isDeleted && (
            <button
              type="button"
              role="menuitem"
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
              Report message
            </button>
          )}
        </>
      ) : (
        <div className="w-56 py-1">
          <p className="px-4 pb-1.5 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Report message</p>
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="menuitem"
              disabled={reporting}
              onClick={() => void submitReport(r.value)}
              className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
