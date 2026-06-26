'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/api';

const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export type MessageReactionsProps = {
  msg: ChatMessage;
  currentUserId?: string;
  mine?: boolean;
  onUpdated?: (reactions: ChatMessage['reactions']) => void;
  openPicker?: boolean;
  onClosePicker?: () => void;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
};

export function MessageReactions({ msg, currentUserId, mine, onUpdated, openPicker, onClosePicker, anchorRef }: MessageReactionsProps) {
  const messageId = msg.id ?? msg._id;
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
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

    let top = rect.top - menuH - gap;
    if (top < pad) top = rect.bottom + gap;
    top = Math.max(pad, Math.min(top, vh - menuH - pad));

    let left = mine ? rect.right - menuW : rect.left;
    left = Math.max(pad, Math.min(left, vw - menuW - pad));

    setMenuStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 250,
      visibility: 'visible',
    });
  }, [mine, anchorRef]);

  useEffect(() => {
    if (!openPicker || !messageId) return;
    const raf = requestAnimationFrame(updatePosition);
    const onReflow = () => updatePosition();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [openPicker, updatePosition, messageId]);

  useEffect(() => {
    if (!openPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClosePicker?.();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (anchorRef?.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClosePicker?.();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [openPicker, anchorRef, onClosePicker]);

  const handleReact = async (emoji: string) => {
    if (!messageId) return;
    onClosePicker?.();
    try {
      const res = await chatService.setReaction(messageId, emoji);
      onUpdated?.(res.data?.reactions);
    } catch {
      /* ignore */
    }
  };

  const pickerMenu =
    openPicker && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className="chat-reactions__menu chat-reactions__menu--portal mod-card-elevated"
            style={menuStyle}
            role="menu"
            aria-label="Choose reaction"
          >
            {QUICK_EMOJI.map((e) => (
              <button
                key={e}
                type="button"
                className="chat-reactions__emoji"
                role="menuitem"
                onClick={() => void handleReact(e)}
                aria-label={`React ${e}`}
              >
                {e}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  if (!messageId || msg.isDeleted) return null;

  const reactions = msg.reactions ?? {};
  const entries = Object.entries(reactions).filter(([, v]) => v.count > 0);

  if (entries.length === 0 && !openPicker) return null;

  return (
    <div className={`mt-0.5 flex items-center gap-1.5 ${mine ? 'justify-end' : 'justify-start'}`}>
      {entries.map(([emoji, data]) => {
        const reacted = currentUserId && data.userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => void handleReact(emoji)}
            className={`flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-bold transition-transform active:scale-95 ${
              reacted
                ? 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-500/20'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span aria-hidden>{emoji}</span>
            <span className="tabular-nums">{data.count}</span>
          </button>
        );
      })}
      {pickerMenu}
    </div>
  );
}
