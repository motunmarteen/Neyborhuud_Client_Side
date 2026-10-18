'use client';

/**
 * On a profile (Phase 7): the badges this neighbour earned (the new 16, then Legacy ones from
 * before) and the public thank-yous (shout-outs) others gave them. Visitors to someone else's
 * profile can give a shout-out (50 HuudCredit); the owner can hide any shout-out.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { getErrorMessage } from '@/lib/error-handler';
import { useHideShoutout, useSendShoutout, useShoutouts, useUserBadges } from '@/hooks/usePhase7';

const SHOUTOUT_PRICE = 50;

export function ProfileRecognition({ userId, firstName, isOwnProfile, canAct }: { userId: string; firstName: string; isOwnProfile: boolean; canAct: boolean }) {
  const { data: badges } = useUserBadges(userId);
  const { data: shoutouts } = useShoutouts(userId);
  const hide = useHideShoutout(userId);
  const [open, setOpen] = useState(false);
  const earned = badges?.earned ?? [];
  const legacy = badges?.legacy ?? [];

  return (
    <section className="mx-auto mt-4 flex w-[calc(100%-1.5rem)] max-w-[600px] flex-col gap-3" aria-label="Badges and shout-outs">
      {earned.length || legacy.length ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#F4F5F6] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Badges</p>
          {earned.length ? (
            <ul className="flex flex-wrap gap-2">
              {earned.map((b) => (
                <li key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm">
                  <span aria-hidden>{b.emoji}</span>
                  {b.name}
                </li>
              ))}
            </ul>
          ) : null}
          {legacy.length ? (
            <details>
              <summary className="cursor-pointer text-xs font-bold text-gray-500">Legacy badges ({legacy.length})</summary>
              <ul className="mt-2 flex flex-wrap gap-2">
                {legacy.map((b) => (
                  <li key={b.id} title={b.description} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1.5 text-xs font-semibold text-gray-600">
                    <span aria-hidden>{b.emoji}</span>
                    {b.name}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-2xl bg-[#F4F5F6] p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Shout-outs</p>
          {!isOwnProfile && canAct ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <span aria-hidden>📣</span> Give {firstName} a shout-out
            </button>
          ) : null}
        </div>
        {shoutouts?.length ? (
          <ul className="flex flex-col gap-2">
            {shoutouts.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 rounded-xl bg-white p-3 shadow-sm">
                <p className="text-sm text-gray-800">“{s.message}”</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-500">
                    {s.from?.name ?? 'A neighbour'} · {new Date(s.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                  </p>
                  {isOwnProfile ? (
                    <button type="button" onClick={() => hide.mutate(s.id)} className="text-xs font-bold text-gray-500 underline">
                      Hide
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-semibold text-gray-500">
            {isOwnProfile ? 'When a neighbour thanks you publicly, it shows here.' : `No shout-outs for ${firstName} yet.`}
          </p>
        )}
      </div>

      <ShoutoutSheet open={open} onClose={() => setOpen(false)} toUserId={userId} firstName={firstName} />
    </section>
  );
}

function ShoutoutSheet({ open, onClose, toUserId, firstName }: { open: boolean; onClose: () => void; toUserId: string; firstName: string }) {
  const [text, setText] = useState('');
  const send = useSendShoutout(toUserId);
  const left = 140 - text.length;
  return (
    <AppBottomSheet open={open} onClose={onClose} title={`Shout-out for ${firstName}`}>
      <form
        className="flex flex-col gap-3 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate(text.trim(), {
            onSuccess: () => {
              toast.success(`Shout-out sent to ${firstName}`);
              setText('');
              onClose();
            },
            onError: (err) => toast.error(getErrorMessage(err)),
          });
        }}
      >
        <label htmlFor="shoutout" className="text-sm font-bold text-navy">
          Say thank you, in public
        </label>
        <textarea
          id="shoutout"
          value={text}
          maxLength={140}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={`Thank you ${firstName} for helping me find my keys!`}
          className="w-full rounded-2xl border border-line p-3 text-[15px] text-navy outline-none focus:border-primary"
        />
        <p className="text-xs font-semibold text-muted">
          {left} characters left · No links or phone numbers · It shows on {firstName}&apos;s profile.
        </p>
        <button
          type="submit"
          disabled={text.trim().length < 3 || send.isPending}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {send.isPending ? 'Sending…' : `Send for 🪙 ${SHOUTOUT_PRICE}`}
        </button>
      </form>
    </AppBottomSheet>
  );
}
