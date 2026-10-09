'use client';

/**
 * Bottom sheet for editing one of your own text messages.
 * The server enforces the rules (sender only, text only, 15-minute window).
 */
import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/types/api';

type Props = {
  msg: ChatMessage | null;
  onCancel: () => void;
  onSave: (msg: ChatMessage, content: string) => Promise<void>;
};

export function EditMessageSheet({ msg, onCancel, onSave }: Props) {
  if (!msg) return null;
  // Keyed by message so the draft resets when a different message is edited.
  return <EditMessageSheetInner key={msg.id} msg={msg} onCancel={onCancel} onSave={onSave} />;
}

function EditMessageSheetInner({ msg, onCancel, onSave }: Props & { msg: ChatMessage }) {
  const [text, setText] = useState(msg.content ?? '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const trimmed = text.trim();
  const unchanged = trimmed === (msg.content ?? '').trim();

  const save = async () => {
    if (!trimmed || unchanged || saving) return;
    setSaving(true);
    try {
      await onSave(msg, trimmed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Edit message">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Cancel editing" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Edit message</h2>
          <span className="text-[11px] text-gray-400">You can edit for 15 minutes after sending</span>
        </div>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={5000}
          aria-label="Message text"
          rows={4}
          className="w-full resize-none rounded-2xl border border-gray-200 px-3 py-2 text-[15px] text-gray-900 outline-none focus:border-emerald-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void save();
            }
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={!trimmed || unchanged || saving}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
