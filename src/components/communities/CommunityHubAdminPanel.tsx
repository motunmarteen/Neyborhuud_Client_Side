'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hubCommunityService } from '@/services/hubCommunity.service';
import type { HubCommunity, HubJoinRequestItem } from '@/types/hubCommunity';

type Props = {
  hub: HubCommunity;
};

export function CommunityHubAdminPanel({ hub }: Props) {
  const queryClient = useQueryClient();
  const isAdmin = ['owner', 'admin', 'moderator'].includes(hub.myRole ?? '');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const { data: requestsData } = useQuery({
    queryKey: ['hub-join-requests', hub.id],
    queryFn: () => hubCommunityService.listJoinRequests(hub.id),
    enabled: isAdmin && hub.settings?.joinApprovalRequired,
  });

  const requests = requestsData?.data?.requests ?? [];

  if (!isAdmin) return null;

  const createInvite = async () => {
    try {
      const res = await hubCommunityService.createInvite(hub.id, { expiresInHours: 168 });
      const path = res.data?.inviteUrl ?? `/communities/join/${res.data?.code}`;
      const full =
        typeof window !== 'undefined'
          ? `${window.location.origin}${path}`
          : path;
      setInviteUrl(full);
      await navigator.clipboard.writeText(full);
      toast.success('Invite link copied');
      void queryClient.invalidateQueries({ queryKey: ['hub-invites', hub.id] });
    } catch {
      toast.error('Could not create invite');
    }
  };

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      await hubCommunityService.reviewJoinRequest(hub.id, requestId, action);
      toast.success(action === 'approve' ? 'Member approved' : 'Request declined');
      void queryClient.invalidateQueries({ queryKey: ['hub-join-requests', hub.id] });
      void queryClient.invalidateQueries({ queryKey: ['hub-community', hub.id] });
      void queryClient.invalidateQueries({ queryKey: ['hub-communities'] });
    } catch {
      toast.error('Could not update request');
    }
  };

  return (
    <div className="mod-card space-y-4 rounded-2xl p-4">
      <h2 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
        Community admin
      </h2>

      {hub.settings?.allowMemberInvites !== false ? (
        <div>
          <button
            type="button"
            onClick={() => void createInvite()}
            className="mod-chip mod-chip-active rounded-full px-4 py-2 text-xs font-bold text-primary"
          >
            Create invite link
          </button>
          {inviteUrl ? (
            <p className="mt-2 break-all text-xs text-[var(--neu-text-muted)]">{inviteUrl}</p>
          ) : null}
        </div>
      ) : null}

      {hub.settings?.joinApprovalRequired && requests.length > 0 ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold text-[var(--neu-text-muted)]">
            Pending join requests ({requests.length})
          </h3>
          <ul className="space-y-2">
            {requests.map((r: HubJoinRequestItem) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-black/5 px-3 py-2"
              >
                <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
                  {r.firstName || r.username || 'User'}
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void review(r.id, 'approve')}
                    className="text-xs font-bold text-primary"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(r.id, 'reject')}
                    className="text-xs font-bold text-[var(--neu-text-muted)]"
                  >
                    Decline
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hub.largeGroupMode ? (
        <p className="text-xs text-status-warning">
          Large community mode: live notifications go to admins and moderators. All members can
          still read and post via chat.
        </p>
      ) : null}
    </div>
  );
}
