'use client';

/** An invite link to a community: see what it is, then join. */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { RowAvatar, RowsSkeleton } from '@/components/friendship/PeopleRows';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { hubCommunityService } from '@/services/hubCommunity.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { toast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';

export default function JoinByInvitePage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user, mounted } = useClientAuthUser();
  const [joining, setJoining] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invite-preview', code],
    queryFn: () => hubCommunityService.previewInvite(code),
    enabled: !!code,
  });
  const preview = data?.data?.hub;

  const handleJoin = async () => {
    if (!user) {
      router.push(`/login?redirect=/communities/join/${code}`);
      return;
    }
    setJoining(true);
    try {
      const res = await hubCommunityService.joinByCode(code);
      if (res.data?.pending) {
        toast.success(t('comm.requestSent'));
        return;
      }
      const cid = res.data?.conversationId ?? res.data?.hub?.conversationId;
      if (cid) router.push(`/chat/${cid}`);
      else if (preview?.id) router.push(`/communities/${preview.id}`);
    } catch {
      toast.error(t('comm.inviteFailed'));
    } finally {
      setJoining(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <AppBrowseLayout>
        <RowsSkeleton rows={2} />
      </AppBrowseLayout>
    );
  }

  if (isError || !preview) {
    return (
      <AppBrowseLayout>
        <EmptyState icon="🔗" title={t('comm.badInvite')} description={t('comm.badInviteBody')} action={{ label: t('comm.seeAll'), href: '/communities' }} />
      </AppBrowseLayout>
    );
  }

  return (
    <AppBrowseLayout>
      <section className="flex flex-col items-center gap-3 rounded-[22px] bg-white px-6 py-8 text-center shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <RowAvatar name={preview.name ?? ''} community />
        <p className="text-sm text-muted">{t('comm.invited')}</p>
        <h1 className="font-heading text-xl font-extrabold text-navy">{preview.name}</h1>
        {preview.description ? <p className="max-w-sm text-sm leading-relaxed text-navy">{preview.description}</p> : null}
        <p className="text-[13px] text-muted">{t('comm.members', { count: preview.membersCount ?? 0 })}</p>
        <Button fullWidth loading={joining} onClick={() => void handleJoin()} className="mt-2 max-w-sm">
          {t(user ? 'comm.joinLong' : 'comm.signInJoin')}
        </Button>
      </section>
    </AppBrowseLayout>
  );
}
