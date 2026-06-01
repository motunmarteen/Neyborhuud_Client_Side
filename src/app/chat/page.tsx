'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/feed/BottomNav';
import { FriendshipChatInbox } from '@/components/friendship/FriendshipChatInbox';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { CHAT_TAB_COMMUNITIES } from '@/lib/chatPaths';

type ChatTab = 'all' | 'direct' | 'communities';

const CHAT_TABS: { id: ChatTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'direct', label: 'DMs' },
  { id: 'communities', label: 'Communities' },
];

function parseTab(value: string | null): ChatTab {
  if (value === 'direct') return 'direct';
  // Legacy `?tab=groups` — same inbox as communities
  if (value === 'communities' || value === 'groups') return CHAT_TAB_COMMUNITIES;
  return 'all';
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, mounted } = useClientAuthUser();
  const tab = parseTab(searchParams.get('tab'));
  const [createOpen, setCreateOpen] = useState(false);

  // Normalize legacy `?tab=groups` in the address bar
  useEffect(() => {
    if (searchParams.get('tab') !== 'groups') return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', CHAT_TAB_COMMUNITIES);
    router.replace(`/chat?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const setTab = useCallback(
    (id: ChatTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === 'all') params.delete('tab');
      else params.set('tab', id);
      const q = params.toString();
      router.replace(q ? `/chat?${q}` : '/chat', { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <>
      <div className="border-b border-gray-100 bg-white px-4 pt-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-800">Chat</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/communities"
              className="mod-chip rounded-full px-3 py-1.5 text-xs font-bold text-primary no-underline"
            >
              Browse
            </Link>
            {mounted && user ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D431]/10 text-[#00D431]"
                aria-label="Create community"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            ) : null}
          </div>
        </div>
        <div className="browse-chip-row browse-chip-row--scroll no-scrollbar pb-2">
          {CHAT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`mod-chip shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                tab === t.id ? 'mod-chip-active text-primary' : ''
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <FriendshipChatInbox inboxFilter={tab} hideSearchBar={false} />
      <CreateCommunityModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex-1 pb-24">
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading messages…</div>}>
          <ChatPageContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
