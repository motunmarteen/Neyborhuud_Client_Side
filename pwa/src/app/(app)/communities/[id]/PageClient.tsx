'use client';

/** One community: what it is, the one main button (Join or Open chat), members, admin tools, leave. */

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Globe, Lock, MessageCircle, Users } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { CommunityHubAdminPanel } from '@/components/communities/CommunityHubAdminPanel';
import { LIST_CLASS, RowAvatar, RowsSkeleton } from '@/components/friendship/PeopleRows';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHubCommunity, useHubCommunityMembers, useJoinHubCommunity, useLeaveHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { toast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';

const MEMBERS_SHOWN = 12;

export default function CommunityDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const hubId = params.id as string;
  const { user, mounted } = useClientAuthUser();
  const [leaving, setLeaving] = useState(false);

  const { data, isLoading, isError } = useHubCommunity(hubId);
  const join = useJoinHubCommunity();
  const leave = useLeaveHubCommunity();
  const hub = data?.data?.hub;
  const { data: membersData } = useHubCommunityMembers(hubId, 1);
  const members = membersData?.data?.members ?? [];

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/communities/${hubId}`);
      return;
    }
    try {
      const res = await join.mutateAsync(hubId);
      if (res.data?.pending) {
        toast.success(t('comm.requestSent'));
        return;
      }
      const cid = res.data?.conversationId ?? res.data?.hub?.conversationId;
      if (cid) router.push(`/chat/${cid}`);
    } catch {
      toast.error(t('comm.joinFailed'));
    }
  };

  const handleLeave = async () => {
    try {
      await leave.mutateAsync(hubId);
      setLeaving(false);
      toast.success(t('comm.left'));
    } catch {
      toast.error(t('comm.leaveFailed'));
    }
  };

  if (isLoading || !mounted) {
    return (
      <AppBrowseLayout>
        <RowsSkeleton rows={3} />
      </AppBrowseLayout>
    );
  }

  if (isError || !hub) {
    return (
      <AppBrowseLayout>
        <EmptyState icon="🏘️" title={t('comm.notFound')} description={t('comm.notFoundBody')} action={{ label: t('comm.seeAll'), href: '/communities' }} />
      </AppBrowseLayout>
    );
  }

  return (
    <AppBrowseLayout>
      <section className="rounded-[22px] bg-white p-5 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <div className="flex items-center gap-3">
          <RowAvatar src={hub.imageUrl} name={hub.name} community />
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-extrabold leading-tight text-navy">{hub.name}</h1>
            {hub.categoryLabel ? <p className="text-[13px] text-muted">{hub.categoryLabel}</p> : null}
          </div>
        </div>
        {hub.description ? <p className="mt-3 text-sm leading-relaxed text-navy">{hub.description}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip icon={<Users size={13} />}>{t('comm.members', { count: hub.membersCount })}</Chip>
          <Chip icon={hub.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}>{t(hub.visibility === 'private' ? 'comm.private' : 'comm.public')}</Chip>
        </div>
        <div className="mt-4">
          {hub.joined ? (
            <Button fullWidth leftIcon={<MessageCircle size={18} aria-hidden />} disabled={!hub.conversationId} onClick={() => router.push(`/chat/${hub.conversationId}`)}>
              {t('comm.openChat')}
            </Button>
          ) : (
            <Button fullWidth loading={join.isPending} onClick={() => void handleJoin()}>
              {t(!user ? 'comm.signInJoin' : hub.settings?.joinApprovalRequired ? 'comm.askJoin' : 'comm.joinLong')}
            </Button>
          )}
        </div>
      </section>

      <CommunityHubAdminPanel hub={hub} />

      {hub.joined && members.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 font-heading text-base font-extrabold text-navy">{t('comm.membersTitle')}</h2>
          <ul className={LIST_CLASS}>
            {members.slice(0, MEMBERS_SHOWN).map((m) => {
              const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || (m.username ? `@${m.username}` : t('comm.member'));
              const row = (
                <>
                  <RowAvatar name={name} src={(m as { avatarUrl?: string | null }).avatarUrl} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-navy">{name}</span>
                  {m.role && m.role !== 'member' ? <Chip tone="green">{t(`comm.role.${m.role}`)}</Chip> : null}
                </>
              );
              return (
                <li key={m.id} className="border-b border-line/60 last:border-0">
                  {m.username ? (
                    <Link href={`/profile/${m.username}`} prefetch={false} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-background">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {hub.membersCount > Math.min(members.length, MEMBERS_SHOWN) ? (
            <p className="mt-2 text-center text-[13px] text-muted">{t('comm.more', { n: hub.membersCount - Math.min(members.length, MEMBERS_SHOWN) })}</p>
          ) : null}
        </section>
      ) : null}

      {hub.joined && hub.myRole !== 'owner' ? (
        <Button variant="ghost" fullWidth onClick={() => setLeaving(true)} className="!text-brand-red">
          {t('comm.leave')}
        </Button>
      ) : null}

      <AppBottomSheet open={leaving} onClose={() => setLeaving(false)} title={t('comm.leaveAsk')} description={t('comm.leaveBody', { name: hub.name })}>
        <div className="flex flex-col gap-2 pb-2">
          <Button variant="danger" fullWidth loading={leave.isPending} onClick={() => void handleLeave()}>
            {t('comm.leave')}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setLeaving(false)}>
            {t('comm.stay')}
          </Button>
        </div>
      </AppBottomSheet>
    </AppBrowseLayout>
  );
}
