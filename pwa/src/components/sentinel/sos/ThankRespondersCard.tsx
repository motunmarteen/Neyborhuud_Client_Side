'use client';

/**
 * After a real SOS ends: "Who helped you?" The person ticks the guardians who really came
 * or helped; each gets 30 HuudCredit, ⭐ 50 Impact and the SOS Responder badge (once).
 * Only people who tapped "I'm responding" are listed. Open for 7 days after the SOS ends.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-handler';

type Responder = { userId: string; name: string; username?: string; avatarUrl?: string; thanked: boolean };
type Data = { canThank: boolean; responders: Responder[] };

export function ThankRespondersCard({ sosId }: { sosId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get<Data>(`/gamification/sos/${sosId}/responders`);
      setData(((res as { data?: Data })?.data ?? null) as Data | null);
    } catch {
      setData(null);
    }
  };
  useEffect(() => {
    void load();
  }, [sosId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data || !data.responders.length) return null;
  const open = data.responders.filter((r) => !r.thanked);

  const thank = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post<{ paid: string[]; skipped: { userId: string; why: string }[] }>(`/gamification/sos/${sosId}/thank`, { helperIds: [...picked] });
      const paid = (res as { data?: { paid: string[] } })?.data?.paid ?? [];
      toast.success(paid.length ? `Thank you sent to ${paid.length} ${paid.length === 1 ? 'helper' : 'helpers'} 💚` : 'Thank you sent.');
      setPicked(new Set());
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl neu-card mb-4 p-4">
      <h2 className="mb-1 text-sm font-semibold">Who helped you?</h2>
      <p className="mb-3 text-xs text-white/60">
        Tick the people who really came or helped. Each gets 30 HuudCredit and the 🚨 SOS Responder badge. Only you can do this.
      </p>
      <ul className="mb-3 flex flex-col gap-2">
        {data.responders.map((r) => (
          <li key={r.userId}>
            <label className="flex min-h-11 items-center gap-3 rounded-lg bg-white/5 px-3 text-sm">
              <input
                type="checkbox"
                disabled={r.thanked || !data.canThank}
                checked={r.thanked || picked.has(r.userId)}
                onChange={(e) => {
                  const next = new Set(picked);
                  if (e.target.checked) next.add(r.userId);
                  else next.delete(r.userId);
                  setPicked(next);
                }}
                className="h-5 w-5 accent-[#00B82E]"
              />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.thanked ? <span className="text-xs text-primary">Thanked ✓</span> : null}
            </label>
          </li>
        ))}
      </ul>
      {data.canThank && open.length ? (
        <button
          type="button"
          disabled={!picked.size || busy}
          onClick={() => void thank()}
          className="min-h-11 w-full rounded-full bg-primary text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Thank them'}
        </button>
      ) : !data.canThank && open.length ? (
        <p className="text-xs text-white/50">Thank-yous are open for 7 days after a real SOS ends (not for drills).</p>
      ) : null}
    </div>
  );
}
