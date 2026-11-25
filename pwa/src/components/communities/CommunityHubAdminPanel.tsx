'use client';

/** Community admin tools: people waiting to join, and an invite link. */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Link2 } from 'lucide-react';
import { hubCommunityService } from '@/services/hubCommunity.service';
import { LIST_CLASS, RowAvatar } from '@/components/friendship/PeopleRows';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import { useTranslation } from '@/lib/i18n';
import type { HubCommunity } from '@/types/hubCommunity';

const ADMIN_ROLES = ['owner', 'admin', 'moderator'];

export function CommunityHubAdminPanel({ hub }: { hub: HubCommunity }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isAdmin = ADMIN_ROLES.includes(hub.myRole ?? '');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [making, setMaking] = useState(false);

  const { data } = useQuery({
    queryKey: ['hub-join-requests', hub.id],
    queryFn: () => hubCommunityService.listJoinRequests(hub.id),
    enabled: isAdmin && !!hub.settings?.joinApprovalRequired,
  });
  const requests = data?.data?.requests ?? [];

  if (!isAdmin) return null;

  // Some phones refuse copying; the link is on screen to copy by hand.
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('comm.admin.copied'));
    } catch {
      /* shown below */
    }
  };

  const createInvite = async () => {
    setMaking(true);
    try {
      const res = await hubCommunityService.createInvite(hub.id, { expiresInHours: 168 });
      const url = new URL(res.data?.inviteUrl ?? `/communities/join/${res.data?.code}`, window.location.origin).href;
      setInviteUrl(url);
      void queryClient.invalidateQueries({ queryKey: ['hub-invites', hub.id] });
      await copy(url);
    } catch {
      toast.error(t('comm.admin.inviteFailed'));
    } finally {
      setMaking(false);
    }
  };

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await hubCommunityService.reviewJoinRequest(hub.id, requestId, action);
      toast.success(t(action === 'approve' ? 'comm.admin.approved' : 'comm.admin.declined'));
      for (const key of [['hub-join-requests', hub.id], ['hub-community', hub.id], ['hub-communities']]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    } catch {
      toast.error(t('comm.admin.reviewFailed'));
    }
  };

  return (
    <>
      {requests.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 font-heading text-base font-extrabold text-navy">{t('comm.admin.waiting', { count: requests.length })}</h2>
          <ul className={LIST_CLASS}>
            {requests.map((r) => {
              const name = [r.firstName, r.lastName].filter(Boolean).join(' ') || `@${r.username ?? ''}`;
              return (
                <li key={r.id} className="border-b border-line/60 px-4 py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <RowAvatar src={r.avatarUrl} name={name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-navy">{name}</span>
                      {r.message ? <span className="block text-[13px] text-muted">{r.message}</span> : r.username ? <span className="block text-[13px] text-muted">@{r.username}</span> : null}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => void review(r.id, 'approve')}>
                      {t('comm.admin.approve')}
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => void review(r.id, 'reject')}>
                      {t('comm.admin.decline')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {hub.settings?.allowMemberInvites !== false ? (
        <section className="rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-navy">{t('comm.admin.invite')}</span>
              <span className="block text-[13px] text-muted">{t('comm.admin.inviteBody')}</span>
            </span>
            <Button size="sm" variant="soft" loading={making} leftIcon={<Link2 size={16} aria-hidden />} onClick={() => void createInvite()}>
              {t(inviteUrl ? 'comm.admin.newLink' : 'comm.admin.getLink')}
            </Button>
          </div>
          {inviteUrl ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-background py-1 pl-4 pr-1">
              <span className="min-w-0 flex-1 select-all truncate text-[13px] text-navy">{inviteUrl}</span>
              <button type="button" onClick={() => void copy(inviteUrl)} aria-label={t('comm.admin.copy')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-navy hover:bg-white">
                <Copy size={17} aria-hidden />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {hub.largeGroupMode ? <p className="rounded-2xl bg-amber-soft px-4 py-3 text-[13px] text-amber-ink">{t('comm.admin.large')}</p> : null}
    </>
  );
}
