'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { chatService } from '@/services/chat.service';
import type { ChatMessage } from '@/types/api';

const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

type MessageReactionsProps = {
  msg: ChatMessage;
  currentUserId?: string;
  /** Outgoing bubbles sit on the right — anchor picker so it grows leftward. */
  mine?: boolean;
  onUpdated?: (reactions: ChatMessage['reactions']) => void;
};

export function MessageReactions({ msg, currentUserId, mine, onUpdated }: MessageReactionsProps) {
  const messageId = msg.id ?? msg._id;
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
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
  }, [mine]);

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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  const handleReact = async (emoji: string) => {
    if (!messageId) return;
    setOpen(false);
    try {
      const res = await chatService.setReaction(messageId, emoji);
      onUpdated?.(res.data?.reactions);
    } catch {
      /* ignore */
    }
  };

  const pickerMenu =
    open && typeof document !== 'undefined'
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

  return (
    <div className="chat-reactions">
      {entries.map(([emoji, data]) => {
        const reacted = currentUserId && data.userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => void handleReact(emoji)}
            className={`chat-reactions__chip ${reacted ? 'chat-reactions__chip--mine' : ''}`}
          >
            <span aria-hidden>{emoji}</span>
            <span className="tabular-nums">{data.count}</span>
          </button>
        );
      })}
      <button
        ref={triggerRef}
        type="button"
        className={`chat-reactions__add ${open ? 'chat-reactions__add--open' : ''}`}
        aria-label="Add reaction"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined text-[16px]">add_reaction</span>
      </button>
      {pickerMenu}
    </div>
  );
}
