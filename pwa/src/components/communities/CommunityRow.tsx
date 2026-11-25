'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RowAvatar } from '@/components/friendship/PeopleRows';
import { useTranslation } from '@/lib/i18n';
import type { HubCommunity } from '@/types/hubCommunity';

type CommunityRowProps = {
  community: HubCommunity;
  onJoin: (id: string) => void;
  joinPending?: boolean;
};

/** A community in a list: tap for details, Join or Chat on the right. */
export function CommunityRow({ community: c, onJoin, joinPending = false }: CommunityRowProps) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0">
      <Link href={`/communities/${c.id}`} prefetch={false} className="flex min-w-0 flex-1 items-center gap-3">
        <RowAvatar src={c.imageUrl} name={c.name} community />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1">
            <span className="truncate text-[15px] font-bold text-navy">{c.name}</span>
            {c.visibility === 'private' ? <Lock size={13} className="shrink-0 text-muted" aria-label={t('comm.private')} /> : null}
          </span>
          <span className="block truncate text-[13px] text-muted">
            {t('comm.members', { count: c.membersCount })}
            {c.categoryLabel ? ` · ${c.categoryLabel}` : ''}
          </span>
        </span>
      </Link>
      {c.joined ? (
        <Link
          href={c.conversationId ? `/chat/${c.conversationId}` : `/communities/${c.id}`}
          prefetch={false}
          className="tap-target inline-flex min-h-10 shrink-0 items-center rounded-full bg-green-soft px-4 text-[13px] font-bold text-brand-green-dark transition-colors hover:bg-[#D6F1DE]"
        >
          {t('comm.chat')}
        </Link>
      ) : (
        <Button size="sm" loading={joinPending} onClick={() => onJoin(c.id)} aria-label={t('comm.joinName', { name: c.name })}>
          {t('comm.join')}
        </Button>
      )}
    </li>
  );
}
