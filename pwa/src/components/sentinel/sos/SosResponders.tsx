'use client';

/**
 * "Who's coming" for the person in danger (owner 2026-11-27). The server already told this
 * phone when a guardian answered (safety:guardian_acknowledged / sos_drill_acknowledged /
 * guardian_called_112) but nothing listened, so the person never knew help was on the way.
 * Refreshes on those events and every 15 s as a fallback for a dropped connection.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import socketService from '@/lib/socket';
import { sosHelpService, type SosHelpView } from '@/services/sosHelp.service';

const EVENTS = ['safety:guardian_acknowledged', 'safety:sos_drill_acknowledged', 'safety:guardian_called_112'] as const;

function time(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function SosResponders({
  sosEventId,
  isDrill = false,
  silent = false,
  className = '',
}: {
  sosEventId: string;
  isDrill?: boolean;
  silent?: boolean;
  className?: string;
}) {
  const [responders, setResponders] = useState<SosHelpView['responders'] | null>(null);
  const known = useRef<Record<string, string>>({});
  const first = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await sosHelpService.getHelp(sosEventId);
      const list = res.data?.responders ?? [];
      // Tell the person as soon as someone new answers (not on the first load).
      for (const r of list) {
        const state = r.called112At ? '112' : r.respondingAt ? 'coming' : '';
        if (!state) continue;
        if (!first.current && known.current[r.guardianId] !== state && !silent) {
          const who = r.name.split(' ')[0] || 'A guardian';
          toast.success(state === '112' ? `${who} called 112 for you` : `${who} is responding${isDrill ? ' (practice)' : ''}`, {
            duration: 8000,
          });
        }
        known.current[r.guardianId] = state;
      }
      first.current = false;
      setResponders(list);
    } catch {
      /* keep the last list */
    }
  }, [sosEventId, isDrill, silent]);

  useEffect(() => {
    first.current = true;
    known.current = {};
    void load();
    const t = window.setInterval(() => void load(), 15_000);
    const onEvent = (p: { sosEventId?: string }) => {
      if (!p?.sosEventId || String(p.sosEventId) === String(sosEventId)) void load();
    };
    const bind = () => {
      const s = socketService.getSocket();
      EVENTS.forEach((e) => s?.off(e, onEvent).on(e, onEvent));
    };
    bind();
    const socket = socketService.getSocket();
    socket?.on('connect', bind);
    return () => {
      window.clearInterval(t);
      const s = socketService.getSocket();
      EVENTS.forEach((e) => s?.off(e, onEvent));
      socket?.off('connect', bind);
    };
  }, [sosEventId, load]);

  const coming = (responders ?? []).filter((r) => r.respondingAt || r.called112At);

  // Silent SOS: keep it quiet and plain, nothing that looks like an alarm.
  if (silent) {
    return coming.length ? (
      <p className={`px-6 py-3 text-[13px] text-gray-500 ${className}`}>
        {coming.length} {coming.length === 1 ? 'person has' : 'people have'} seen it.
      </p>
    ) : null;
  }

  return (
    <section className={`rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)] ${className}`} aria-live="polite">
      <h3 className="font-heading text-base font-extrabold text-navy">Who&apos;s coming</h3>
      {responders === null ? (
        <p className="mt-1 text-[14px] text-muted">Checking…</p>
      ) : coming.length === 0 ? (
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          No one has answered yet. We keep ringing your guardians every 30 seconds{isDrill ? ' (practice)' : ''}.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {coming.map((r) => (
            <li key={r.guardianId} className="flex items-center justify-between gap-3 rounded-2xl bg-green-50 px-3 py-2.5">
              <span className="text-[15px] font-bold text-navy">{r.name}</span>
              <span className="text-right text-[13px] font-semibold text-brand-green-dark">
                {r.called112At ? `Called 112 · ${time(r.called112At)}` : `Responding · ${time(r.respondingAt)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
