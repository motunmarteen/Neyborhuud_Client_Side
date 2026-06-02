'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { hubCommunityService } from '@/services/hubCommunity.service';
import { useJoinHubCommunity } from '@/hooks/useHubCommunities';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { toast } from 'sonner';

export default function JoinByInvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { user, mounted } = useClientAuthUser();
  const joinMutation = useJoinHubCommunity();

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
    try {
      const res = await hubCommunityService.joinByCode(code);
      if (res.data?.pending) {
        toast.success('Join request sent for admin approval');
        return;
      }
      const cid = res.data?.conversationId ?? res.data?.hub?.conversationId;
      if (cid) router.push(`/chat/${cid}`);
      else if (preview?.id) router.push(`/communities/${preview.id}`);
    } catch {
      toast.error('Could not join with this invite');
    }
  };

  if (isLoading) {
    return (
      <AppBrowseLayout maxWidth="680">
        <div className="mod-card h-32 animate-pulse rounded-2xl" />
      </AppBrowseLayout>
    );
  }

  if (isError || !preview) {
    return (
      <AppBrowseLayout maxWidth="680">
        <BrowseEmptyState
          icon="link_off"
          title="Invalid invite"
          description="This link may have expired or been revoked."
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
    <AppBrowseLayout maxWidth="680">
      <div className="mod-card space-y-4 rounded-2xl p-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
          {preview.name}
        </h1>
        <p className="text-sm text-[var(--neu-text-muted)]">{preview.description}</p>
        <p className="text-xs text-[var(--neu-text-muted)]">
          {(preview.membersCount ?? 0).toLocaleString()} members
        </p>
        {mounted ? (
          <button
            type="button"
            disabled={joinMutation.isPending}
            onClick={() => void handleJoin()}
            className="mod-chip mod-chip-active w-full rounded-xl py-3 text-sm font-bold text-primary disabled:opacity-50"
          >
            {joinMutation.isPending ? 'Joining…' : user ? 'Join community' : 'Sign in to join'}
          </button>
        ) : (
          <div className="mod-inset h-12 animate-pulse rounded-xl" />
        )}
      </div>
    </AppBrowseLayout>
  );
}
