'use client';

/**
 * IncognitoInviteListener — global handler for incognito-invite socket events.
 *
 * - incognito:approval-needed → ask the other participant to approve/decline.
 * - incognito:invited         → ask the invitee to accept (join the window).
 *
 * Renders nothing; mounted once near the app root.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import socketService from '@/lib/socket';
import { chatService } from '@/services/chat.service';

type ApprovalNeeded = {
  inviteId: string;
  conversationId: string;
  invitee: string;
  invitedBy: string;
  durationSeconds: number;
};
type Invited = {
  inviteId: string;
  conversationId: string;
  invitedBy: string;
  durationSeconds: number;
};

function minutesLabel(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.round(m / 60)} hour${m >= 120 ? 's' : ''}` : `${m} min`;
}

export function IncognitoInviteListener() {
  const router = useRouter();

  useEffect(() => {
    const onApprovalNeeded = (data: ApprovalNeeded) => {
      toast('Approve a guest invite?', {
        description: `Someone wants to invite a guest to your chat for ${minutesLabel(
          data.durationSeconds,
        )}. They'll only see messages while present.`,
        duration: 30_000,
        action: {
          label: 'Approve',
          onClick: async () => {
            try {
              await chatService.reviewIncognitoInvite(data.inviteId, true);
              toast.success('Approved. The guest has been notified.');
            } catch {
              toast.error('Could not approve.');
            }
          },
        },
        cancel: {
          label: 'Decline',
          onClick: async () => {
            try {
              await chatService.reviewIncognitoInvite(data.inviteId, false);
            } catch {
              /* no-op */
            }
          },
        },
      });
    };

    const onInvited = (data: Invited) => {
      toast('You\'ve been invited to a chat', {
        description: `You can join for ${minutesLabel(
          data.durationSeconds,
        )}. You'll see only messages from when you join until the timer ends.`,
        duration: 60_000,
        action: {
          label: 'Accept',
          onClick: async () => {
            try {
              const res = await chatService.acceptIncognitoInvite(data.inviteId);
              const cid = (res as { data?: { conversationId?: string } })?.data?.conversationId
                ?? data.conversationId;
              router.push(`/chat/${encodeURIComponent(cid)}`);
            } catch {
              toast.error('Could not join — the invite may have expired.');
            }
          },
        },
      });
    };

    socketService.on('incognito:approval-needed', onApprovalNeeded);
    socketService.on('incognito:invited', onInvited);
    return () => {
      socketService.off('incognito:approval-needed', onApprovalNeeded);
      socketService.off('incognito:invited', onInvited);
    };
  }, [router]);

  return null;
}
