'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { FriendshipChatInbox } from '@/components/friendship/FriendshipChatInbox';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { CHAT_TAB_COMMUNITIES } from '@/lib/chatPaths';
import { unwrapApiData } from '@/lib/apiPayload';

type ChatTab = 'all' | 'direct' | 'communities';

const CHAT_TABS: { id: ChatTab; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'forum' },
  { id: 'direct', label: 'DMs', icon: 'chat' },
  { id: 'communities', label: 'Communities', icon: 'groups' },
];

function parseTab(value: string | null): ChatTab {
  if (value === 'direct') return 'direct';
  if (value === 'communities' || value === 'groups') return CHAT_TAB_COMMUNITIES;
  return 'all';
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, mounted } = useClientAuthUser();
  const tab = parseTab(searchParams.get('tab'));
  const [createOpen, setCreateOpen] = useState(false);

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
      <AppBrowseLayout
        maxWidth="680"
        className="chat-inbox-layout !gap-3 !pb-2 !pt-0"
        header={
          <div className="px-4">
            <BrowseTabStrip
              tabs={CHAT_TABS}
              activeId={tab}
              onChange={(id) => setTab(id as ChatTab)}
              trailing={
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href="/communities"
                    className="mod-chip inline-flex h-9 items-center rounded-full px-3 text-xs font-bold text-primary no-underline"
                  >
                    Browse
                  </Link>
                  {mounted && user ? (
                    <button
                      type="button"
                      onClick={() => setCreateOpen(true)}
                      className="mod-fab flex h-9 w-9 items-center justify-center rounded-full border-0"
                      aria-label="Create community"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white">add</span>
                    </button>
                  ) : null}
                </div>
              }
            />
          </div>
        }
      >
        <FriendshipChatInbox inboxFilter={tab} hideSearchBar={false} />
      </AppBrowseLayout>
      <CreateCommunityModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="neu-base flex min-h-app items-center justify-center p-8 text-sm text-[var(--neu-text-muted)]">
          Loading messages…
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
