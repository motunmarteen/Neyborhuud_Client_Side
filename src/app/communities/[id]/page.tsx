'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { useHubCommunity, useJoinHubCommunity, useLeaveHubCommunity, useHubCommunityMembers } from '@/hooks/useHubCommunities';
import { CommunityHubAdminPanel } from '@/components/communities/CommunityHubAdminPanel';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hubId = params.id as string;
  const { user } = useClientAuthUser();

  const { data, isLoading, isError } = useHubCommunity(hubId);
  const joinMutation = useJoinHubCommunity();
  const leaveMutation = useLeaveHubCommunity();

  const hub = data?.data?.hub;

  const { data: membersData } = useHubCommunityMembers(hubId, 1);
  const members = membersData?.data?.members ?? [];

  const openChat = () => {
    if (hub?.conversationId) {
      router.push(`/chat/${hub.conversationId}`);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) {
      router.push(`/login?redirect=/communities/${hubId}`);
      return;
    }
    if (!hub) return;
    if (hub.joined) {
      await leaveMutation.mutateAsync(hubId);
    } else {
      const res = await joinMutation.mutateAsync(hubId);
      const cid = res.data?.conversationId ?? res.data?.hub?.conversationId;
      if (cid) {
        router.push(`/chat/${cid}`);
      }
    }
  };

  if (isLoading) {
    return (
      <AppBrowseLayout maxWidth="680" subtitle="Loading community…">
        <div className="mod-card h-48 animate-pulse rounded-2xl" />
      </AppBrowseLayout>
    );
  }

  if (isError || !hub) {
    return (
      <AppBrowseLayout maxWidth="680" subtitle="Community">
        <BrowseEmptyState
          icon="groups"
          title="Community not found"
          description="This hub may have been removed or the link is invalid."
          action={
            <Link href="/communities" className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary no-underline">
              Browse communities
            </Link>
          }
        />
      </AppBrowseLayout>
    );
  }

  return (
    <AppBrowseLayout
      maxWidth="680"
      subtitle={
        <span className="inline-flex min-w-0 items-center gap-2">
          <Link href="/communities" className="text-[var(--neu-text-muted)] no-underline">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <span className="truncate">{hub.name}</span>
        </span>
      }
    >
      <div className="space-y-4">
        <div className="mod-card rounded-2xl p-5">
          <div className="mb-4 flex items-start gap-4">
            <div className="mod-inset flex h-14 w-14 items-center justify-center rounded-2xl text-primary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {hub.icon}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
                {hub.name}
              </h1>
              <p className="mt-1 text-sm text-[var(--neu-text-muted)]">{hub.categoryLabel}</p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[var(--neu-text)]">{hub.description || 'No description yet.'}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-[var(--neu-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">group</span>
              {hub.membersCount.toLocaleString()} members
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {hub.activityLevel} activity
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">
                {hub.visibility === 'private' ? 'lock' : 'public'}
              </span>
              {hub.visibility === 'private' ? 'Private' : 'Public'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {hub.joined ? (
            <>
              <button
                type="button"
                onClick={openChat}
                className="mod-chip mod-chip-active flex-1 rounded-xl py-3 text-sm font-bold text-primary"
              >
                Open group chat
              </button>
              <button
                type="button"
                onClick={() => void handleJoinLeave()}
                disabled={leaveMutation.isPending || hub.myRole === 'owner'}
                className="mod-chip flex-1 rounded-xl py-3 text-sm font-bold disabled:opacity-50"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                {hub.myRole === 'owner' ? 'You own this hub' : leaveMutation.isPending ? 'Leaving…' : 'Leave'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleJoinLeave()}
              disabled={joinMutation.isPending}
              className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Joining…' : 'Join & open chat'}
            </button>
          )}
        </div>

        <Link
          href="/chat?tab=communities"
          className="mod-card flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold no-underline"
          style={{ color: 'var(--neu-text)' }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">forum</span>
            View in Messages
          </span>
          <span className="material-symbols-outlined text-[var(--neu-text-muted)]">chevron_right</span>
        </Link>

        {hub.joined && members.length > 0 ? (
          <div className="mod-card rounded-2xl p-4">
            <h2 className="mb-3 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Members
            </h2>
            <ul className="space-y-2">
              {members.slice(0, 12).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--neu-text)' }}>
                    {m.firstName || m.lastName
                      ? `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()
                      : m.username ?? 'Member'}
                  </span>
                  <span className="text-xs capitalize text-[var(--neu-text-muted)]">{m.role}</span>
                </li>
              ))}
            </ul>
            {hub.membersCount > members.length ? (
              <p className="mt-2 text-xs text-[var(--neu-text-muted)]">
                + {(hub.membersCount - members.length).toLocaleString()} more members
              </p>
            ) : null}
          </div>
        ) : null}

        <CommunityHubAdminPanel hub={hub} />
      </div>
    </AppBrowseLayout>
  );
}
