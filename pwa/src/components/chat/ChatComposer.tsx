'use client';

import { useCallback, useEffect, useRef, type RefObject, KeyboardEvent } from 'react';
import { ArrowUp, ChevronLeft, Mic } from 'lucide-react';
import ChatActionMenu, { type ActionResult, type ChatActionMenuHandle } from '@/components/chat/ChatActionMenu';
import { useHoldToRecord } from '@/components/chat/useHoldToRecord';

function fmtDuration(ms: number): string {
  const secs = Math.floor(ms / 1000);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

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
  const actionMenuRef = useRef<ChatActionMenuHandle>(null);

  // Hold the mic to talk, release to send, slide left to cancel.
  // A quick tap opens the tap-to-record sheet instead.
  const onRecorded = useCallback((file: File, durationMs: number) => {
    onAction({
      type: 'audio',
      content: `🎤 Voice note (${fmtDuration(durationMs)})`,
      mediaFile: file,
      mediaUrl: URL.createObjectURL(file), // local playback while uploading
    });
  }, [onAction]);
  const openRecorderSheet = useCallback(() => actionMenuRef.current?.openVoiceRecorder(), []);
  const voice = useHoldToRecord({ onRecorded, onTap: openRecorderSheet, disabled: sending });
  const recording = voice.state === 'recording';

  useEffect(() => {
    const el = textareaRef.current;
    if (!el || inputText.trim()) return;
    el.style.height = '';
  }, [inputText, textareaRef]);

  const placeholderText = recipientName ? `Message ${recipientName.split(' ')[0]}…` : 'Message…';

  return (
    <div className="relative z-40 shrink-0 bg-white/95 backdrop-blur-2xl border-t border-black/[0.06] pb-[env(safe-area-inset-bottom,16px)] pt-2 select-none">
      {uploadProgress !== null ? (
        <div className="mx-auto w-full max-w-[600px] px-2 mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#00B82E] transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[600px] px-2 items-end gap-2">
        <ChatActionMenu ref={actionMenuRef} disabled={sending} onAction={onAction} />

        {recording ? (
          <div
            className="flex h-10 flex-1 items-center gap-3 rounded-[22px] bg-rose-50 px-4 mb-0.5"
            role="status"
            aria-live="polite"
          >
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
            <span className="w-10 shrink-0 text-[14px] font-bold tabular-nums text-rose-600">{fmtDuration(voice.elapsedMs)}</span>
            <span
              className="flex flex-1 items-center justify-center gap-1 text-[13px] font-semibold text-slate-500"
              style={{ transform: `translateX(${voice.slideX * 0.5}px)`, opacity: 1 - voice.cancelProgress * 0.7 }}
            >
              <ChevronLeft size={16} /> Slide to cancel
            </span>
          </div>
        ) : (
        <div className="relative flex flex-1 items-end bg-slate-100/90 border border-black/[0.05] rounded-[22px]">
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
            className="w-full resize-none overflow-y-auto bg-transparent px-4 py-2.5 text-[15px] leading-tight text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-label="Message"
            style={{ minHeight: '40px' }}
          />

          {inputText.length > 8000 ? (
            <span
              className={`absolute bottom-10 right-3 text-[10px] font-bold ${inputText.length >= 10000 ? 'text-rose-500' : 'text-slate-400'}`}
            >
              {10000 - inputText.length}
            </span>
          ) : null}
        </div>
        )}

        <button
          type="button"
          {...(canSend ? { onClick: onSend } : voice.handlers)}
          onKeyDown={(e) => {
            // Keyboard users: Enter/Space opens the tap-to-record sheet.
            if (!canSend && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openRecorderSheet();
            }
          }}
          disabled={sending && !canSend}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all mb-0.5 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs ${
            canSend
              ? 'bg-[#00B82E] text-white hover:bg-[#00B02A]'
              : recording
                ? 'scale-125 bg-rose-500 text-white'
                : 'bg-slate-900 text-white hover:bg-black'
          }`}
          style={canSend ? undefined : { touchAction: 'none' }}
          aria-label={canSend ? "Send message" : "Hold to record a voice message, tap for recorder"}
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : canSend ? (
            <ArrowUp size={20} strokeWidth={2.6} />
          ) : (
            <Mic size={19} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
}
