'use client';

/**
 * Sponsored missions (Phase 7, G-16): real-world tasks a local business pays for, always
 * labelled "Sponsored". You prove you did it with the code the sponsor gives you there.
 * Missions never ask for reviews or ratings.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-handler';
import { useCompleteMission, useMissions, type Mission } from '@/hooks/usePhase7';

function MissionRow({ m }: { m: Mission }) {
  const [code, setCode] = useState('');
  const complete = useCompleteMission();
  const inputId = `mission-${m.id}`;
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-soft text-lg">
          {m.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#A86F0A]">Sponsored · {m.sponsor}</span>
          <span className="text-sm font-bold text-navy">{m.title}</span>
          {m.description ? <span className="text-xs font-semibold text-muted">{m.description}</span> : null}
          <span className="text-xs font-semibold text-muted">
            {m.area ? `${m.area.lga} · ` : ''}until {new Date(m.endsAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })} · {m.placesLeft} places left
          </span>
        </div>
        <span className="shrink-0 text-sm font-black text-[#A86F0A]">{m.done ? 'Done' : `+${m.reward}`}</span>
      </div>
      {!m.done && m.placesLeft > 0 ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            complete.mutate(
              { missionId: m.id, code: code.trim() },
              {
                onSuccess: (r) => toast.success(`Mission done! +${r.reward} HuudCredit`),
                onError: (err) => toast.error(getErrorMessage(err)),
              },
            );
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Code from {m.sponsor}
          </label>
          <input
            id={inputId}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoCapitalize="characters"
            placeholder="Code from the sponsor"
            className="min-h-11 min-w-0 flex-1 rounded-full border border-line px-4 text-sm font-bold tracking-widest text-navy outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={code.trim().length < 4 || complete.isPending}
            className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            Done it
          </button>
        </form>
      ) : null}
    </li>
  );
}

export function MissionsCard() {
  const { data } = useMissions();
  if (!data?.length) return null;
  return (
    <section aria-labelledby="missions-heading" className="flex flex-col gap-2">
      <h2 id="missions-heading" className="px-1 font-heading text-lg font-extrabold text-navy">
        Sponsored missions
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        {data.map((m) => (
          <MissionRow key={m.id} m={m} />
        ))}
      </ul>
      <p className="px-1 text-xs font-semibold text-muted">
        Local businesses pay for these. Go in person and ask them for the code. They never ask you for reviews or ratings.
      </p>
    </section>
  );
}
