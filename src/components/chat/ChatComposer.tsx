'use client';

import { useEffect, type RefObject, KeyboardEvent } from 'react';
import ChatActionMenu, { type ActionResult } from '@/components/chat/ChatActionMenu';

export type ChatComposerProps = {
  inputText: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  sending: boolean;
  uploadProgress: number | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onAction: (result: ActionResult) => void;
};

export function ChatComposer({
  inputText,
  onInputChange,
  onKeyDown,
  onSend,
  sending,
  uploadProgress,
  textareaRef,
  onAction,
}: ChatComposerProps) {
  const canSend = Boolean(inputText.trim()) && !sending;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || inputText.trim()) return;
    el.style.height = '';
  }, [inputText, textareaRef]);

  return (
    <div className="chat-room__composer shrink-0">
      {uploadProgress !== null ? (
        <div className="chat-room__upload mod-inset mx-3 mb-2 mt-2 h-1.5 overflow-hidden rounded-full">
          <div
            className="chat-room__upload-fill h-full rounded-full bg-primary transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}

      <div className="chat-room__composer-row">
        <ChatActionMenu disabled={sending} onAction={onAction} />

        <div
          className={`chat-room__input-wrap mod-inset flex-1${inputText.trim() ? ' chat-room__input-wrap--grow' : ''}`}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            maxLength={10000}
            onChange={(e) => {
              const value = e.target.value;
              onInputChange(value);
              const el = e.target;
              el.style.height = '0px';
              if (!value.trim()) {
                el.style.height = '';
              } else {
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }
            }}
            onKeyDown={onKeyDown}
            placeholder="Message…"
            className="chat-room__input"
            aria-label="Message"
          />
          {inputText.length > 8000 ? (
            <span
              className={`chat-room__char-count ${inputText.length >= 10000 ? 'text-brand-red' : 'text-[var(--neu-text-muted)]'}`}
            >
              {10000 - inputText.length}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="chat-room__send mod-fab"
          aria-label="Send message"
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="material-symbols-outlined text-[22px] text-white">send</span>
          )}
        </button>
      </div>
    </div>
  );
}
