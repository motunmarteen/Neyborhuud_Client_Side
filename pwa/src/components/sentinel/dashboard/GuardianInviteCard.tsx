'use client';

/**
 * Invite family or friends who aren't on NeyborHuud yet to be your guardian (live Sentinel test
 * 2026-11-28: the guardian screen only listed people already following you back, so a mum or
 * brother without the app could never be added). Free: the message goes from your own phone.
 */

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { smsHref } from '@/components/safety/SosTextGuardians';

const APP_URL = 'https://app.neyborhuud.com/signup';

export function guardianInviteText(firstName: string | undefined, username: string | undefined): string {
  const me = firstName?.trim() || 'I';
  const handle = username ? ` Search for @${username} and follow me, then I'll add you.` : '';
  return (
    `${me === 'I' ? 'I' : `It's ${me}. I`}'d like you to be my safety guardian on NeyborHuud. ` +
    `If I ever press SOS, your phone rings with where I am. It's free: ${APP_URL}.${handle}`
  );
}

export function GuardianInviteCard({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const [ua, setUa] = useState('');
  useEffect(() => setUa(navigator.userAgent), []);
  const text = useMemo(
    () => guardianInviteText(user?.firstName, (user as { username?: string } | null)?.username),
    [user],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Invite copied');
    } catch {
      toast.error('Could not copy. Long-press to copy instead.');
    }
  };

  return (
    <div className={`rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${className}`}>
      <h4 className="font-heading text-[15px] font-extrabold text-navy">Someone not on NeyborHuud yet?</h4>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        Send them an invite. Once they join and you follow each other, add them here as your guardian.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={smsHref([], text, ua)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-navy px-4 text-[14px] font-bold text-white"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>sms</span>
          Text invite
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-green-soft px-4 text-[14px] font-bold text-brand-green-dark"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-10 items-center rounded-full bg-background px-4 text-[14px] font-bold text-navy"
        >
          Copy invite
        </button>
      </div>
    </div>
  );
}
