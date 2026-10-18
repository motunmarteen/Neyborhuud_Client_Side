'use client';

/**
 * Shows every HuudCredit payment the moment the server makes it.
 *
 * The server sends `huudcredit:earned` to the person after each award (posts,
 * comments, deals, help, Lost & Found, tips...). Before this, most screens
 * never said anything, so rewards looked missing until the wallet was opened.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketService from '@/lib/socket';
import { nhToast } from '@/lib/toast';
import { emitCoinsUpdated } from '@/lib/gamification-events';
import { useAuth } from '@/hooks/useAuth';
import type { Standing } from '@/lib/standing';

type EarnedEvent = {
  amount: number;
  action: string;
  description: string | null;
  balance: number | null;
};

/** Screens that already celebrate these payments themselves. */
const SHOWN_ELSEWHERE = new Set(['login_streak', 'admin_award']);

const REASONS: Record<string, string> = {
  post_content: 'For your post',
  comment: 'For your comment',
  like_post: 'For showing love',
  acknowledge: 'For confirming a post',
  share_external: 'For sharing outside the app',
  cross_post: 'For sharing with another area',
  emergency_report: 'Neighbours confirmed your report',
  sos_help: 'For helping a neighbour',
  event_created: 'For your event',
  job_posted: 'For your job post',
  marketplace_listed: 'For your listing',
  marketplace_purchase: 'For a completed deal',
  referral: 'For an invite',
  follower_milestone: 'Follower milestone',
  tip_received: 'A neighbour tipped you',
  tip_refund: 'Your tip came back',
  lost_found_return: 'You returned a lost item',
  lost_found_helper: 'Your tip helped return an item',
  lost_found_pledge_release: "The owner's thank-you",
  lost_found_pledge_refund: 'Your pledge came back',
  poll_engaged: 'Neighbours voted on your poll',
  email_verified: 'Email verified',
  complete_profile: 'Profile complete',
  sign_up: 'Welcome to NeyborHuud',
  report_confirmed: 'You confirmed a true report',
  incident_confirmed: 'Neighbours confirmed your report',
};

export function HuudCreditListener() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const onEarned = (e: EarnedEvent) => {
      if (!e || !(e.amount > 0)) return;
      for (const key of ['stats', 'wallet', 'transactions']) {
        void queryClient.invalidateQueries({ queryKey: ['gamification', key] });
      }
      emitCoinsUpdated(typeof e.balance === 'number' ? { totalHuudCoins: e.balance } : undefined);
      if (SHOWN_ELSEWHERE.has(e.action)) return;
      nhToast.reward({ coins: e.amount, reason: REASONS[e.action] ?? e.description ?? 'Thank you' });
    };
    // Phase 7: moving up the ⭐ Impact ladder gets its own card.
    const onLevelUp = (s: Standing) => {
      if (!s || !s.name) return;
      void queryClient.invalidateQueries({ queryKey: ['gamification', 'stats'] });
      nhToast.thanks({ emoji: s.emoji, title: `You are now a ${s.name}`, sub: `Level ${s.level} · ${s.unlock}`, duration: 7000 });
    };
    const socket = socketService.connect() ?? socketService.getSocket();
    if (!socket) return;
    socket.on('huudcredit:earned', onEarned);
    socket.on('impact:level_up', onLevelUp);
    return () => {
      socket.off('huudcredit:earned', onEarned);
      socket.off('impact:level_up', onLevelUp);
    };
  }, [user?.id, queryClient]);

  return null;
}
