'use client';

/** The Chats list: direct, group and community conversations in one list, newest first. */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { chatService } from '@/services/chat.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { chatThreadPath, isCommunityChat } from '@/lib/chatPaths';
import { formatTimeAgo } from '@/utils/timeAgo';
import { useTranslation } from '@/lib/i18n';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChip } from '@/components/ui/Chip';
import { LIST_CLASS, RowAvatar, RowsSkeleton } from '@/components/friendship/PeopleRows';
import type { Conversation } from '@/types/api';

/** What a chat is about. "chats" = plain chats between people (the key stays for old links). */
type Kind = 'chats' | 'groups' | 'emergency' | 'market' | 'jobs' | 'services' | 'events';
type Filter = 'all' | Kind;
const FILTERS: { id: Filter; icon?: string }[] = [
  { id: 'all' },
  { id: 'chats' },
  { id: 'groups' },
  { id: 'emergency', icon: '🚨' },
  { id: 'market', icon: '🛒' },
  { id: 'jobs', icon: '💼' },
  { id: 'services', icon: '🛠️' },
  { id: 'events', icon: '🎉' },
];
const KIND_OF_CONTEXT: Record<string, Kind> = { marketplace: 'market', jobs: 'jobs', services: 'services', events: 'events', incident: 'emergency' };
const TOPIC_ICON: Partial<Record<Kind, string>> = { market: '🛒', jobs: '💼', services: '🛠️', events: '🎉' };

type Row = {
  id: string;
  ts: number;
  name: string;
  avatar: string | null;
  community: boolean;
  kind: Kind;
  /** What a market, job, service or event chat is about, e.g. the item's name. */
  topic: string | null;
  verified: boolean;
  danger: boolean;
  unread: number;
  preview: string;
};

type LooseConversation = Conversation & { conversationId?: string; _id?: string; unreadCount?: number };

export function ChatsStream({ search }: { search?: string }) {
  const { t } = useTranslation();
  const { user, mounted } = useClientAuthUser();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getConversations({ limit: 40 }),
    staleTime: 30_000,
    enabled: mounted && !!user,
  });

  const rows = useMemo<Row[]>(() => {
    const list = (data as { data?: { conversations?: LooseConversation[] } } | undefined)?.data?.conversations ?? [];
    const seen = new Map<string, Row>();
    for (const c of list) {
      const id = c.conversationId ?? c._id ?? c.id ?? '';
      if (!id) continue;
      const community = isCommunityChat(c);
      const kind: Kind =
        c.type === 'incident' ? 'emergency' : community ? 'groups' : KIND_OF_CONTEXT[c.contextType ?? ''] ?? 'chats';
      const danger = kind === 'emergency';
      const topic = TOPIC_ICON[kind] ? c.context?.productTitle || c.context?.jobTitle || c.context?.label || c.contextLabel || null : null;
      const other = c.otherParticipant;
      seen.set(id, {
        id,
        ts: new Date(c.lastMessageAt || c.updatedAt || c.createdAt || 0).getTime(),
        name: danger
          ? t('chats.emergency')
          : community
            ? c.name || c.groupName || t('chats.community')
            : other?.name || other?.username || c.name || t('chats.direct'),
        avatar: (community ? c.imageUrl : other?.avatarUrl) || null,
        community,
        kind,
        topic,
        verified: !!other?.isVerified,
        danger,
        unread: c.unreadCount ?? 0,
        preview: c.lastMessage?.content || (community ? t('chats.noMessages') : t('chats.sayHello')),
      });
    }
    const q = search?.trim().toLowerCase();
    return [...seen.values()].filter((r) => !q || r.name.toLowerCase().includes(q)).sort((a, b) => b.ts - a.ts);
  }, [data, search, t]);

  const inFilter = (r: Row, f: Filter) => f === 'all' || r.kind === f;
  const shown = rows.filter((r) => inFilter(r, filter));

  if (mounted && !user) {
    return (
      <EmptyState icon="💬" title={t('chats.signIn')} description={t('chats.signInBody')} action={{ label: t('chats.signInBtn'), href: '/login?redirect=/chat' }} />
    );
  }

  return (
    <>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1" role="group" aria-label={t('chats.filter')}>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
            icon={f.icon}
            count={rows.filter((r) => inFilter(r, f.id)).reduce((n, r) => n + r.unread, 0)}
          >
            {t(`chats.f.${f.id}`)}
          </FilterChip>
        ))}
      </div>

      {!mounted || isLoading ? (
        <RowsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} homeHref={null} />
      ) : shown.length === 0 ? (
        search?.trim() ? (
          <EmptyState icon="🔎" title={t('chats.noMatch')} description={t('chats.noMatchBody')} />
        ) : filter === 'groups' ? (
          <EmptyState icon="🏘️" title={t('chats.noGroups')} description={t('chats.noGroupsBody')} action={{ label: t('chats.seeCommunities'), href: '/communities' }} />
        ) : filter !== 'all' && filter !== 'chats' ? (
          <EmptyState icon={FILTERS.find((f) => f.id === filter)?.icon} title={t(`chats.empty.${filter}`)} description={t(`chats.emptyBody.${filter}`)} />
        ) : (
          <EmptyState icon="💬" title={t('chats.none')} description={t('chats.noneBody')} action={{ label: t('chats.findNeighbours'), href: '/friendship' }} />
        )
      ) : (
        <ul className={LIST_CLASS}>
          {shown.map((row) => (
            <li key={row.id} className="border-b border-line/60 last:border-0">
              <Link
                href={chatThreadPath(row.id)}
                prefetch={false}
                className="flex min-h-[72px] items-center gap-3 px-4 py-3 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              >
                <RowAvatar src={row.avatar} name={row.name} community={row.community} danger={row.danger} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className={`truncate text-[15px] ${row.unread ? 'font-extrabold' : 'font-bold'} ${row.danger ? 'text-brand-red' : 'text-navy'}`}>{row.name}</span>
                    {row.verified ? <BadgeCheck size={15} className="shrink-0 text-brand-green-dark" aria-label={t('people.verified')} /> : null}
                  </span>
                  {row.topic ? (
                    <span className="block truncate text-[12px] font-bold text-brand-green-dark">
                      {TOPIC_ICON[row.kind]} {row.topic}
                    </span>
                  ) : null}
                  <span className={`block truncate text-[13px] ${row.unread ? 'font-bold text-navy' : 'text-muted'}`}>{row.preview}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {row.ts ? (
                    <span className={`text-[11px] ${row.unread ? 'font-bold text-brand-green-dark' : 'text-muted'}`}>{formatTimeAgo(new Date(row.ts).toISOString())}</span>
                  ) : null}
                  {row.unread ? (
                    <span className="min-w-5 rounded-full bg-brand-green-dark px-1.5 text-center text-[11px] font-bold leading-5 text-white">
                      <span className="sr-only">{t('chats.unread')} </span>
                      {row.unread > 99 ? '99+' : row.unread}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
