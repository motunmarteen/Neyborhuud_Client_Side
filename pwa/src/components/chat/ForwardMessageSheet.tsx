'use client';

/**
 * Pick up to N chats to forward a message to. Only IDs are sent — the
 * server copies the original content (see chatService.forwardMessage).
 * Messages that have already been forwarded many times can go to one chat
 * at a time (WhatsApp-style brake on viral misinformation).
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { chatService } from '@/services/chat.service';
import { isCommunityChat } from '@/lib/chatPaths';
import { maxForwardTargets } from '@/lib/chatMessageRules';
import { toast } from '@/lib/toast';
import type { ChatMessage, Conversation } from '@/types/api';

type Props = {
  msg: ChatMessage | null;
  currentConversationId: string;
  onClose: () => void;
};

type ConvIds = { id?: string; _id?: string; conversationId?: string };

function convId(c: Conversation): string {
  const ids = c as Conversation & ConvIds;
  return String(ids.conversationId ?? ids._id ?? ids.id ?? '');
}

function convName(c: Conversation): string {
  if (isCommunityChat(c)) return c.name || c.groupName || 'Community';
  const o = c.otherParticipant;
  return o?.name || o?.username || c.name || 'Chat';
}

function convAvatar(c: Conversation): string | null {
  if (isCommunityChat(c)) return c.imageUrl ?? null;
  return c.otherParticipant?.avatarUrl ?? null;
}

export function ForwardMessageSheet({ msg, currentConversationId, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', 'forward-picker'],
    queryFn: () => chatService.getConversations({ limit: 50 }),
    enabled: !!msg,
    staleTime: 30_000,
  });

  const conversations = useMemo(() => {
    const list = ((data as { data?: { conversations?: Conversation[] } })?.data?.conversations ?? [])
      .filter((c) => convId(c) && convId(c) !== currentConversationId);
    const q = query.trim().toLowerCase();
    return q ? list.filter((c) => convName(c).toLowerCase().includes(q)) : list;
  }, [data, query, currentConversationId]);

  if (!msg) return null;
  const sourceId = String(msg.id ?? (msg as ChatMessage & { _id?: string })._id ?? '');
  const max = maxForwardTargets(msg);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) {
        toast.message(max === 1 ? 'This message has been forwarded many times — you can send it to one chat at a time.' : `You can forward to up to ${max} chats at once.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    let ok = 0;
    let firstError: string | null = null;
    for (const target of selected) {
      try {
        await chatService.forwardMessage(sourceId, target);
        ok++;
      } catch (err) {
        firstError ??=
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not forward';
      }
    }
    setSending(false);
    if (ok) toast.success(ok === 1 ? 'Message forwarded' : `Forwarded to ${ok} chats`);
    if (firstError) toast.error(firstError);
    if (ok) {
      setSelected([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-label="Forward message">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-t-3xl bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-base font-bold text-gray-900">Forward to…</h2>
          <span className="text-[11px] text-gray-400">{selected.length}/{max} selected</span>
        </div>
        <div className="px-4 py-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>
        <ul className="flex-1 overflow-y-auto px-2">
          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-gray-400">Loading chats…</li>
          ) : conversations.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-gray-400">No other chats yet</li>
          ) : (
            conversations.map((c) => {
              const id = convId(c);
              const on = selected.includes(id);
              const avatar = convAvatar(c);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left ${on ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {avatar ? <Image src={avatar} alt="" fill sizes="40px" className="object-cover" /> : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-gray-500">
                          {convName(c).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{convName(c)}</span>
                      <span className="block text-[11px] text-gray-400">{isCommunityChat(c) ? 'Group' : 'Chat'}</span>
                    </span>
                    <span className={`material-symbols-outlined text-[22px] ${on ? 'text-emerald-600' : 'text-gray-300'}`} aria-hidden="true">
                      {on ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => void send()}
            disabled={!selected.length || sending}
            className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            {sending ? 'Forwarding…' : selected.length ? `Forward to ${selected.length}` : 'Choose chats'}
          </button>
        </div>
      </div>
    </div>
  );
}
