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
  recipientName?: string;
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
  recipientName,
}: ChatComposerProps) {
  const canSend = Boolean(inputText.trim()) && !sending;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || inputText.trim()) return;
    el.style.height = '';
  }, [inputText, textareaRef]);

  const placeholderText = recipientName ? `Message ${recipientName.split(' ')[0]}…` : 'Message…';

  return (
    <div className="relative z-40 shrink-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-[env(safe-area-inset-bottom,16px)] pt-2">
      {uploadProgress !== null ? (
        <div className="mx-auto w-full max-w-[600px] px-2 mb-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[600px] px-1 items-end gap-2">
        <ChatActionMenu disabled={sending} onAction={onAction} />

        <div className="relative flex flex-1 items-end bg-gray-100 rounded-[20px] rounded-br-[2px]">
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
            placeholder={placeholderText}
            className="w-full resize-none overflow-y-auto bg-transparent px-4 py-2.5 text-[15px] leading-tight text-gray-900 placeholder:text-gray-500 focus:outline-none"
            aria-label="Message"
            style={{ minHeight: '40px' }}
          />
          {/* Bubble Tail */}
          <div 
            className="absolute right-[-5px] bottom-0 w-[8px] h-[10px] bg-gray-100" 
            style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} 
          />
          
          {inputText.length > 8000 ? (
            <span
              className={`absolute bottom-10 right-3 text-[10px] font-bold ${inputText.length >= 10000 ? 'text-red-500' : 'text-gray-400'}`}
            >
              {10000 - inputText.length}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={canSend ? onSend : undefined}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors mb-0.5 bg-slate-800 text-white hover:bg-slate-900 active:bg-black`}
          aria-label={canSend ? "Send message" : "Record voice message"}
        >
          {sending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="material-symbols-outlined text-[20px]">
              {canSend ? 'arrow_upward' : 'mic'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
