'use client';

/**
 * EventRsvpCard — the interactive RSVP card posted into an event's auto-created
 * chat thread (a `type: 'system'` message carrying `meta.rsvpAction`).
 *
 * Everyone in the thread gets the same three buttons — Going · Maybe · Can't Go
 * — and can change their answer at any time; changing it never removes you from
 * the thread. The event details are snapshotted into `meta` at post time, so
 * the card renders with no live fetch. The attendee count IS live: the server
 * broadcasts `event:rsvp_update` to the whole conversation whenever anyone's
 * RSVP changes, the same fan-out the live-location card uses.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChatMessage } from '@/types/api';
import { eventsService, type RsvpStatus } from '@/services/events.service';
import { useChatCardAction } from '@/hooks/useChatCardAction';
import socketService from '@/lib/socket';

const CHOICES: {
  status: RsvpStatus;
  label: string;
  icon: string;
  active: string;
  idle: string;
}[] = [
  {
    status: 'going',
    label: 'Going',
    icon: '🎉',
    active: 'bg-emerald-600 text-white',
    idle: 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50',
  },
  {
    status: 'maybe',
    label: 'Maybe',
    icon: '🤔',
    active: 'bg-amber-500 text-white',
    idle: 'border border-amber-200 bg-white text-amber-700 hover:bg-amber-50',
  },
  {
    status: 'not_going',
    label: "Can't Go",
    icon: '🙅',
    active: 'bg-slate-700 text-white',
    idle: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
  },
];

const BUSY_LABEL: Record<RsvpStatus, string> = {
  going: 'Saving…',
  maybe: 'Saving…',
  not_going: 'Saving…',
};

function formatWhen(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function EventRsvpCard({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId?: string;
}) {
  const meta = msg.meta ?? {};
  const eventId = meta.eventId ? String(meta.eventId) : undefined;
  const title = typeof meta.eventTitle === 'string' ? meta.eventTitle : undefined;
  const venue = typeof meta.eventVenue === 'string' ? meta.eventVenue : undefined;
  const when = formatWhen(meta.eventStartDate);
  const actorId = meta.actorId ? String(meta.actorId) : undefined;

  const [going, setGoing] = useState<number>(
    typeof meta.goingCount === 'number' ? meta.goingCount : 0,
  );
  const [maybe, setMaybe] = useState<number>(
    typeof meta.maybeCount === 'number' ? meta.maybeCount : 0,
  );
  // The card announces ONE person's RSVP, but every viewer acts on their own —
  // so only the announcer's own choice can be pre-selected from meta.
  const [mine, setMine] = useState<RsvpStatus | null>(
    currentUserId && actorId && currentUserId === actorId
      ? ((meta.rsvpAction as RsvpStatus) ?? null)
      : null,
  );

  const { busy, disabled, run } = useChatCardAction(!!eventId);

  useEffect(() => {
    if (!eventId) return;
    const onUpdate = (data: unknown) => {
      const d = data as { eventId?: string; goingCount?: number; maybeCount?: number };
      if (String(d?.eventId ?? '') !== eventId) return;
      if (typeof d.goingCount === 'number') setGoing(d.goingCount);
      if (typeof d.maybeCount === 'number') setMaybe(d.maybeCount);
    };
    socketService.on('event:rsvp_update', onUpdate);
    return () => socketService.off('event:rsvp_update', onUpdate);
  }, [eventId]);

  // Reflect the viewer's own saved answer, which meta can't know for anyone
  // other than the person this announcement is about. One small request per
  // card the viewer didn't author; acceptable because a thread holds at most
  // one card per attendee and only the visible ones mount.
  useEffect(() => {
    if (!eventId || !currentUserId || (actorId && currentUserId === actorId)) return;
    let cancelled = false;
    eventsService
      .getMyRsvp(eventId)
      .then((res) => {
        if (cancelled) return;
        const data = (res as { data?: { status?: RsvpStatus | null } })?.data;
        if (data?.status) setMine(data.status);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId, currentUserId, actorId]);

  const choose = (status: RsvpStatus) => {
    if (!eventId || status === mine) return;
    void run(
      status,
      async () => {
        const res = await eventsService.setRsvp(eventId, status);
        const counts = (res as { data?: { counts?: { goingCount?: number; maybeCount?: number } } })
          ?.data?.counts;
        if (typeof counts?.goingCount === 'number') setGoing(counts.goingCount);
        if (typeof counts?.maybeCount === 'number') setMaybe(counts.maybeCount);
        setMine(status);
      },
      status === 'going'
        ? "You're going 🎉"
        : status === 'maybe'
          ? 'Marked as maybe.'
          : "Marked as can't go.",
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-purple-50 max-w-[300px] sm:max-w-sm">
      <div className="flex items-center gap-2 px-3 py-2 text-purple-700">
        <span className="text-base">📅</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          NeyborHuud Event · RSVP
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        {title ? (
          eventId ? (
            <Link
              href={`/events/${eventId}`}
              className="block text-sm font-bold text-gray-900 hover:underline"
            >
              {title}
            </Link>
          ) : (
            <p className="text-sm font-bold text-gray-900">{title}</p>
          )
        ) : null}

        {when && <p className="mt-0.5 text-xs text-purple-700">{when}</p>}
        {venue && <p className="text-xs text-gray-600">{venue}</p>}

        <p className="mt-1 text-sm leading-snug text-gray-700">{msg.content}</p>

        <p className="mt-2 text-xs font-semibold text-purple-700">
          {going} going
          {maybe > 0 ? ` · ${maybe} maybe` : ''}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {CHOICES.map((c) => {
            const isMine = mine === c.status;
            return (
              <button
                key={c.status}
                type="button"
                onClick={() => choose(c.status)}
                disabled={disabled || !eventId}
                aria-pressed={isMine}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
                  isMine ? c.active : c.idle
                }`}
              >
                {busy === c.status ? (
                  BUSY_LABEL[c.status]
                ) : (
                  <>
                    <span aria-hidden>{c.icon}</span>
                    {c.label}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
