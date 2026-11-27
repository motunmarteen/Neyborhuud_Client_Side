'use client';

/**
 * Estate security (owner 2026-11-27): the gate, vigilante or community watch that gets a text when
 * someone near them presses SOS and no family member answers within 30 seconds.
 *
 * A desk only gets alerts after (1) the desk agrees from the link we text it, and (2) a Level 5
 * neighbour from the same area, or the NeyborHuud team, approves it. Both rules live on the server.
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useStarted } from '@/hooks/useStarted';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import { glassField, glassLabel } from '@/lib/glass-form-styles';
import { getErrorMessage } from '@/lib/error-handler';
import {
  DESK_KIND_OPTIONS,
  sosHelpService,
  type DeskKind,
  type DeskList,
  type DeskStatus,
  type SecurityDesk,
} from '@/services/sosHelp.service';

const CARD = 'rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]';
const RADII = [
  { m: 500, label: '500 m' },
  { m: 1000, label: '1 km' },
  { m: 2000, label: '2 km' },
  { m: 3000, label: '3 km' },
];
const STATUS: Record<DeskStatus, { label: string; cls: string }> = {
  pending_consent: { label: 'Waiting for the desk to agree', cls: 'bg-amber-soft text-navy' },
  pending_approval: { label: 'Waiting for approval', cls: 'bg-amber-soft text-navy' },
  active: { label: 'Gets SOS alerts', cls: 'bg-green-soft text-brand-green-dark' },
  rejected: { label: 'Not approved', cls: 'bg-red-soft text-brand-red' },
  stopped: { label: 'Desk stopped alerts', cls: 'bg-background text-muted' },
  removed: { label: 'Removed', cls: 'bg-background text-muted' },
};

function DeskRow({ d, children }: { d: SecurityDesk; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 border-b border-line/60 py-3 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-navy">{d.name}</p>
          <p className="text-[13px] text-muted">
            {[d.kindLabel, d.lga, `covers ${d.coverRadiusMeters >= 1000 ? `${d.coverRadiusMeters / 1000} km` : `${d.coverRadiusMeters} m`}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <a href={`tel:${d.phone}`} className="shrink-0 text-[14px] font-bold tabular-nums text-brand-green-dark">
          {d.phone}
        </a>
      </div>
      <span className={`self-start rounded-full px-2.5 py-0.5 text-[12px] font-bold ${STATUS[d.status].cls}`}>{STATUS[d.status].label}</span>
      {children}
    </li>
  );
}

export default function SecurityDesksPage() {
  const started = useStarted();
  const { user } = useClientAuthUser();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['security-desks'],
    queryFn: async () => (await sosHelpService.listDesks()).data as DeskList,
    enabled: started && !!user,
  });

  const [name, setName] = useState('');
  const [kind, setKind] = useState<DeskKind>('estate_security');
  const [phone, setPhone] = useState('');
  const [radius, setRadius] = useState(1000);
  const [spot, setSpot] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ['security-desks'] });

  const locate = () => {
    if (!('geolocation' in navigator)) return void toast.error('This phone can’t share its location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setSpot({ lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        toast.error('Allow location, then stand at the desk and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot) return void toast.error('Set where the desk is first.');
    setSaving(true);
    try {
      const res = await sosHelpService.addDesk({ name: name.trim(), kind, phone, lat: spot.lat, lng: spot.lng, coverRadiusMeters: radius });
      toast.success(res.data?.smsSent ? 'Added. We texted the desk a link to agree.' : 'Added. We couldn’t text the desk yet; we’ll keep it waiting.');
      setName('');
      setPhone('');
      setSpot(null);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const review = async (id: string, ok: boolean) => {
    setReviewing(id);
    try {
      await (ok ? sosHelpService.approveDesk(id) : sosHelpService.rejectDesk(id));
      toast.success(ok ? 'Approved' : 'Rejected');
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReviewing(null);
    }
  };

  const remove = async (id: string) => {
    try {
      await sosHelpService.removeDesk(id);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!started || !user) {
    return (
      <AppBrowseLayout>
        <div className={`${CARD} h-48 animate-pulse motion-reduce:animate-none`} aria-hidden />
      </AppBrowseLayout>
    );
  }

  const data = q.data;

  return (
    <AppBrowseLayout>
      <section className={CARD}>
        <h1 className="font-heading text-lg font-extrabold text-navy">The people closest to an emergency</h1>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          When someone near a desk presses SOS and no family member answers within 30 seconds, we text that desk their first name and
          location. Your estate gate or vigilante is often closer and faster than anyone else.
        </p>
      </section>

      {q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : null}

      {data?.waiting.length ? (
        <section className={CARD} aria-label="Waiting for your approval">
          <h2 className="font-heading text-base font-extrabold text-navy">Waiting for your approval</h2>
          <p className="mt-0.5 text-[13px] text-muted">Approve only desks you know are real. The desk has already agreed by text.</p>
          <ul>
            {data.waiting.map((d) => (
              <DeskRow key={d.id} d={d}>
                <div className="flex gap-2">
                  <Button size="sm" loading={reviewing === d.id} onClick={() => void review(d.id, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" disabled={reviewing === d.id} onClick={() => void review(d.id, false)}>
                    Reject
                  </Button>
                </div>
              </DeskRow>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={CARD} aria-label="Desks in your area">
        <h2 className="font-heading text-base font-extrabold text-navy">
          {data?.homeArea ? `Desks in ${data.homeArea.lga}` : 'Desks in your area'}
        </h2>
        {q.isLoading ? (
          <div className="mt-3 h-16 animate-pulse rounded-2xl bg-background motion-reduce:animate-none" aria-hidden />
        ) : data?.area.length ? (
          <ul>
            {data.area.map((d) => (
              <DeskRow key={d.id} d={d} />
            ))}
          </ul>
        ) : (
          <div className="mt-2">
            <EmptyState
              icon="🛡️"
              title="No desk listed yet"
              description={data?.homeArea ? 'Be the first: add your estate gate or vigilante below.' : 'Set your area in Settings, then add your estate gate or vigilante.'}
            />
          </div>
        )}
      </section>

      <form onSubmit={add} className={`${CARD} flex flex-col gap-4`} noValidate>
        <h2 className="font-heading text-base font-extrabold text-navy">Add a desk</h2>
        <div>
          <label htmlFor="desk-name" className={glassLabel}>Name</label>
          <input id="desk-name" className={glassField} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Unity Estate main gate" />
        </div>
        <div>
          <p className={glassLabel}>Kind</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kind">
            {DESK_KIND_OPTIONS.map((k) => (
              <FilterChip key={k.value} active={kind === k.value} onClick={() => setKind(k.value)}>
                {k.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="desk-phone" className={glassLabel}>Their phone number</label>
          <input id="desk-phone" type="tel" inputMode="tel" autoComplete="off" className={glassField} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" />
          <p className="mt-1 text-[13px] text-muted">The number someone answers day and night, like the gate phone.</p>
        </div>
        <div>
          <p className={glassLabel}>Where the desk is</p>
          {spot ? (
            <p className="flex items-center justify-between rounded-2xl bg-green-soft px-3 py-2.5 text-[14px] font-bold text-brand-green-dark">
              <span>✓ Location set</span>
              <button type="button" onClick={locate} className="text-[13px] underline">Set again</button>
            </p>
          ) : (
            <Button type="button" variant="secondary" fullWidth loading={locating} onClick={locate}>
              Use where I am now
            </Button>
          )}
          <p className="mt-1 text-[13px] text-muted">Stand at the gate or office, then tap. We never show this spot on the map.</p>
        </div>
        <div>
          <p className={glassLabel}>Alert them for SOS within</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Distance">
            {RADII.map((r) => (
              <FilterChip key={r.m} active={radius === r.m} onClick={() => setRadius(r.m)}>
                {r.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <p className="rounded-2xl bg-background p-3 text-[13px] leading-relaxed text-muted">
          We&apos;ll text the number a link. The desk must agree before it gets any alert, and a Level 5 neighbour from your area
          approves it. The desk can stop alerts any time.
        </p>
        <Button type="submit" fullWidth loading={saving} disabled={name.trim().length < 3 || phone.replace(/\D/g, '').length < 10 || !spot}>
          Add desk
        </Button>
      </form>

      {data?.mine.length ? (
        <section className={CARD} aria-label="Desks you added">
          <h2 className="font-heading text-base font-extrabold text-navy">Desks you added</h2>
          <ul>
            {data.mine.map((d) => (
              <DeskRow key={d.id} d={d}>
                {d.status === 'pending_consent' || d.status === 'pending_approval' || d.status === 'rejected' || d.status === 'stopped' ? (
                  <button type="button" onClick={() => void remove(d.id)} className="self-start text-[13px] font-bold text-brand-red">
                    Remove
                  </button>
                ) : null}
              </DeskRow>
            ))}
          </ul>
        </section>
      ) : null}
    </AppBrowseLayout>
  );
}
