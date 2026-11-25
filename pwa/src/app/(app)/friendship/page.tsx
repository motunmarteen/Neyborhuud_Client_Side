'use client';

/**
 * People (Chats → Find neighbours): neighbours in your area, who you follow and who follows you.
 * No map of homes (owner 2026-10-18: strangers are never shown on a map; friends only, opt-in, on
 * My Huud), and the server no longer sends anyone's location here.
 */

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Loader2, MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseSearchField } from '@/components/layout/BrowseSearchField';
import { LIST_CLASS, RowAvatar, RowsSkeleton } from '@/components/friendship/PeopleRows';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChip } from '@/components/ui/Chip';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { followService } from '@/services/follow.service';
import { geoService } from '@/services/geo.service';
import { chatService } from '@/services/chat.service';
import { chatThreadPath } from '@/lib/chatPaths';
import { toast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';

type Tab = 'near_me' | 'following' | 'followers';
const TABS: Tab[] = ['near_me', 'following', 'followers'];
/** Old links to the inbox that used to live here. */
const CHAT_TABS = ['chats', 'dms', 'direct', 'communities', 'groups'];

type Person = {
  _id?: string;
  id?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profilePicture?: string;
  lga?: string;
  state?: string;
  isVerified?: boolean;
};

const idOf = (p: Person) => p._id || p.id || '';
const nameOf = (p: Person) => [p.firstName, p.lastName].filter(Boolean).join(' ') || `@${p.username}`;
const listOf = (d: unknown, key: string) => (d as { data?: Record<string, Person[]> } | null | undefined)?.data?.[key] ?? [];

function People() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { user, mounted } = useClientAuthUser();
  const asked = params.get('tab') ?? '';
  const toChats = CHAT_TABS.includes(asked);
  const [tab, setTab] = useState<Tab>(TABS.includes(asked as Tab) ? (asked as Tab) : 'near_me');
  const [search, setSearch] = useState('');
  const me = user?.id ?? '';

  useEffect(() => {
    if (toChats) router.replace('/chat');
  }, [toChats, router]);

  const on = mounted && !!me && !toChats;
  const nearby = useQuery({ queryKey: ['connect-neighbors'], queryFn: () => geoService.getNeighbors(50), enabled: on && tab === 'near_me', staleTime: 120_000 });
  const following = useQuery({ queryKey: ['following', me], queryFn: () => followService.getFollowing(me, 1, 100), enabled: on, staleTime: 60_000 });
  const followers = useQuery({ queryKey: ['followers', me], queryFn: () => followService.getFollowers(me, 1, 100), enabled: on, staleTime: 60_000 });

  const followingList = listOf(following.data, 'following');
  const followerList = listOf(followers.data, 'followers');
  const query = tab === 'near_me' ? nearby : tab === 'following' ? following : followers;
  const all = tab === 'near_me' ? listOf(nearby.data, 'users') : tab === 'following' ? followingList : followerList;
  const iFollow = new Set(followingList.map(idOf));
  const q = search.trim().toLowerCase();
  const people = all.filter((p) => !q || `${nameOf(p)} ${p.username} ${p.lga ?? ''}`.toLowerCase().includes(q));

  const follow = useMutation({
    mutationFn: async ({ id, off }: { id: string; off: boolean }) => {
      if (off) await followService.unfollowUser(id);
      else await followService.followUser(id);
    },
    // The neighbours list is left as it is, so the row you just tapped does not jump away.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['following', me] }),
    onError: () => {
      toast.error(t('people.followFailed'));
    },
  });

  const message = useMutation({
    mutationFn: async (id: string) => {
      const res = await chatService.getOrCreateDirectConversation(id);
      type Conv = { _id?: string; conversationId?: string; id?: string };
      const d = res.data as (Conv & { conversation?: Conv }) | undefined;
      const c = d?.conversation ?? d;
      const cid = c?._id ?? c?.conversationId ?? c?.id;
      if (!cid) throw new Error('no conversation');
      return cid;
    },
    onSuccess: (cid) => router.push(chatThreadPath(cid)),
    onError: () => {
      toast.error(t('people.messageFailed'));
    },
  });

  const invite = async () => {
    const ref = user?.username ? `?ref=${encodeURIComponent(user.username)}` : '';
    const url = `${window.location.origin}/signup${ref}`;
    try {
      if (navigator.share) await navigator.share({ title: 'NeyborHuud', text: t('people.inviteText'), url });
      else {
        await navigator.clipboard.writeText(`${t('people.inviteText')} ${url}`);
        toast.success(t('people.inviteCopied'));
      }
    } catch {
      /* closed the share sheet */
    }
  };

  const pick = (next: Tab) => {
    setTab(next);
    setSearch('');
    router.replace(next === 'near_me' ? '/friendship' : `/friendship?tab=${next}`, { scroll: false });
  };

  return (
    <AppBrowseLayout
      header={
        <div className="flex flex-col gap-3">
          <BrowseSearchField value={search} onChange={setSearch} placeholder={t('people.search')} />
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label={t('people.filter')}>
            {TABS.map((k) => (
              <FilterChip
                key={k}
                active={tab === k}
                onClick={() => pick(k)}
                count={k === 'following' ? followingList.length : k === 'followers' ? followerList.length : undefined}
              >
                {t(`people.tab.${k}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      }
    >
      {mounted && !me ? (
        <EmptyState icon="👋🏾" title={t('people.signIn')} description={t('people.signInBody')} action={{ label: t('chats.signInBtn'), href: '/login?redirect=/friendship' }} />
      ) : !mounted || toChats || query.isLoading ? (
        <RowsSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} homeHref={null} />
      ) : people.length === 0 ? (
        q ? (
          <EmptyState icon="🔎" title={t('people.noMatch')} description={t('people.noMatchBody')} />
        ) : (
          <EmptyState
            icon="👋🏾"
            title={t(`people.empty.${tab}`)}
            description={t(`people.emptyBody.${tab}`)}
            action={tab === 'near_me' ? { label: t('people.invite'), onClick: () => void invite() } : { label: t('people.seeNearby'), onClick: () => pick('near_me') }}
          />
        )
      ) : (
        <ul className={LIST_CLASS}>
          {people.map((p) => {
            const id = idOf(p);
            const name = nameOf(p);
            const followed = iFollow.has(id);
            const busy = follow.isPending && follow.variables?.id === id;
            return (
              <li key={id || p.username} className="flex items-center gap-2 border-b border-line/60 px-4 py-3 last:border-0">
                <Link href={`/profile/${p.username}`} prefetch={false} className="flex min-w-0 flex-1 items-center gap-3">
                  <RowAvatar src={p.avatarUrl || p.profilePicture} name={name} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="line-clamp-2 text-[15px] font-bold leading-snug text-navy">{name}</span>
                      {p.isVerified ? <BadgeCheck size={15} className="shrink-0 text-brand-green-dark" aria-label={t('people.verified')} /> : null}
                    </span>
                    <span className="block truncate text-[13px] text-muted">{[p.lga, p.state].filter(Boolean).join(', ') || `@${p.username}`}</span>
                  </span>
                </Link>
                {id && id !== me ? (
                  <>
                    <button
                      type="button"
                      onClick={() => message.mutate(id)}
                      disabled={message.isPending}
                      aria-label={t('people.message', { name })}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background text-navy transition-colors hover:bg-[#E6EAF0] disabled:opacity-50"
                    >
                      <MessageCircle size={19} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => follow.mutate({ id, off: followed })}
                      disabled={busy}
                      aria-label={t(followed ? 'people.unfollowName' : 'people.followName', { name })}
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-60 ${
                        followed ? 'bg-green-soft text-brand-green-dark' : 'bg-brand-green-dark text-white'
                      }`}
                    >
                      {busy ? <Loader2 size={19} className="motion-safe:animate-spin" aria-hidden /> : followed ? <UserCheck size={19} aria-hidden /> : <UserPlus size={19} aria-hidden />}
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AppBrowseLayout>
  );
}

export default function PeoplePage() {
  return (
    <Suspense>
      <People />
    </Suspense>
  );
}
