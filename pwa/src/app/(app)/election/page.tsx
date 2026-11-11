'use client';

/**
 * Election hub (owner 2026-11-11, docs/ELECTION-MODE-PLAN.md, step E1): countdown, your polling
 * unit (private, typed from your voter's card), what to bring and know, and official links.
 * Results come only from INEC (IReV); NeyborHuud never takes sides or announces results.
 * Reports, "I've voted, I'm safe", the rumour check and the safety map arrive in steps E2–E4.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useStarted } from '@/hooks/useStarted';
import { useTranslation } from '@/lib/i18n';
import {
  daysUntil,
  FALLBACK_HUB,
  forgetPollingUnit,
  getElectionHub,
  nextOf,
  savePollingUnit,
  tidyPuCode,
  type ElectionHub,
  type PollingUnit,
} from '@/lib/election';

const field =
  'h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] font-semibold text-navy outline-none placeholder:font-medium placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25';

const KNOW = ['pvc', 'unit', 'bvas', 'secret', 'sell', 'results', 'safe'] as const;
const SOON = ['report', 'safe', 'rumour', 'map'] as const;

function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
}

export default function ElectionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const started = useStarted();
  const [hub, setHub] = useState<ElectionHub>(FALLBACK_HUB);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getElectionHub()
      .then((h) => setHub({ ...FALLBACK_HUB, ...h }))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [user?.id]);

  const next = started ? nextOf(hub.elections) : null;
  const days = next ? daysUntil(next.date) : null;
  const link = (id: 'inec' | 'locator' | 'irev') => hub.links.find((l) => l.id === id)?.url ?? FALLBACK_HUB.links.find((l) => l.id === id)!.url;

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="flex flex-col gap-4 pb-8">
        {/* Countdown */}
        <Card className="ring-1 ring-green-soft">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden>🗳️</span>
            <div className="min-w-0">
              <h1 className="font-heading text-[19px] font-black text-navy">{t('el.title')}</h1>
              {next ? (
                <p className="text-[13px] font-semibold text-muted">
                  {t(`el.kind.${next.kind}`)} · {formatDate(next.date)}
                </p>
              ) : started ? (
                <p className="text-[13px] font-semibold text-muted">{t('el.allPast')}</p>
              ) : null}
            </div>
          </div>
          {days !== null ? (
            <p className="mt-3 font-heading text-[28px] font-black leading-none text-brand-green-dark">
              {days === 0 ? t('el.today') : t(days === 1 ? 'el.days_one' : 'el.days_other', { n: days })}
            </p>
          ) : null}
          {next && hub.elections.length > 1 ? (
            <ul className="mt-3 flex flex-col gap-1 text-[13px] text-navy">
              {hub.elections.map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span className="font-bold">{t(`el.kind.${e.kind}`)}</span>
                  <span className="text-muted">{formatDate(e.date)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-background px-3 py-2 text-[12px] font-semibold text-navy">
            <ShieldCheck size={15} className="mt-px shrink-0 text-brand-green-dark" aria-hidden /> {t('el.neutral')}
          </p>
        </Card>

        {/* My polling unit */}
        <PollingUnitCard
          signedIn={started && !!user}
          loaded={started && loaded}
          unit={hub.myPollingUnit}
          locatorUrl={link('locator')}
          onSignIn={() => router.push(`/huud?login=1&next=${encodeURIComponent('/election')}`)}
          onChange={(u) => setHub((h) => ({ ...h, myPollingUnit: u }))}
        />

        {/* What to bring and know */}
        <section aria-labelledby="know-title">
          <h2 id="know-title" className="mb-2 px-1 text-[13px] font-extrabold text-navy">{t('el.knowTitle')}</h2>
          <Card padding="none" className="divide-y divide-line">
            {KNOW.map((k) => (
              <div key={k} className="flex items-start gap-3 px-4 py-3">
                <span className="text-xl" aria-hidden>{t(`el.know.${k}.icon`)}</span>
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-navy">{t(`el.know.${k}.title`)}</p>
                  <p className="text-[13px] text-muted">{t(`el.know.${k}.body`)}</p>
                </div>
              </div>
            ))}
          </Card>
          <p className="mt-2 px-1 text-[12px] text-muted">{t('el.checkInec')}</p>
        </section>

        {/* Results: only INEC */}
        <Card className="bg-[#EEF3FF]">
          <p className="text-[15px] font-extrabold text-navy">📊 {t('el.resultsTitle')}</p>
          <p className="mt-1 text-[13px] text-navy">{t('el.resultsBody')}</p>
          <a href={link('irev')} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-navy px-4 text-sm font-extrabold text-white">
            {t('el.openIrev')} <ExternalLink size={14} aria-hidden />
          </a>
        </Card>

        {/* Official links and fact-checkers */}
        <section aria-labelledby="links-title">
          <h2 id="links-title" className="mb-2 px-1 text-[13px] font-extrabold text-navy">{t('el.linksTitle')}</h2>
          <Card padding="none" className="divide-y divide-line">
            {(['inec', 'locator', 'irev'] as const).map((id) => (
              <a key={id} href={link(id)} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-[#F6F8FB]">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold text-navy">{t(`el.link.${id}`)}</span>
                  <span className="block truncate text-xs text-muted">{link(id).replace(/^https:\/\//, '')}</span>
                </span>
                <ExternalLink size={15} className="shrink-0 text-faint" aria-hidden />
              </a>
            ))}
          </Card>
          <p className="mb-2 mt-4 px-1 text-[13px] font-extrabold text-navy">{t('el.factTitle')}</p>
          <div className="flex flex-wrap gap-2">
            {hub.factCheckers.map((f) => (
              <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-sm font-bold text-navy ring-1 ring-line">
                {f.name} <ExternalLink size={13} className="text-faint" aria-hidden />
              </a>
            ))}
          </div>
        </section>

        {/* Coming before election day */}
        <section aria-labelledby="soon-title">
          <h2 id="soon-title" className="mb-2 px-1 text-[13px] font-extrabold text-navy">{t('el.soonTitle')}</h2>
          <Card padding="none" className="divide-y divide-line">
            {SOON.map((k) => (
              <div key={k} className="flex items-center gap-3 px-4 py-3 opacity-80">
                <span className="text-xl" aria-hidden>{t(`el.soon.${k}.icon`)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold text-navy">{t(`el.soon.${k}.title`)}</p>
                  <p className="text-[12px] text-muted">{t(`el.soon.${k}.body`)}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </AppBrowseLayout>
  );
}

function PollingUnitCard({
  signedIn,
  loaded,
  unit,
  locatorUrl,
  onSignIn,
  onChange,
}: {
  signedIn: boolean;
  loaded: boolean;
  unit: PollingUnit | null;
  locatorUrl: string;
  onSignIn: () => void;
  onChange: (u: PollingUnit | null) => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const u = await savePollingUnit(code, name);
      onChange(u);
      setEditing(false);
      toast.success(t('el.pu.saved'));
    } catch (e) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t('el.pu.failed'));
    } finally {
      setBusy(false);
    }
  };

  const forget = async () => {
    setBusy(true);
    try {
      await forgetPollingUnit();
      onChange(null);
      setCode('');
      setName('');
    } catch {
      toast.error(t('el.pu.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-black text-navy">📍 {t('el.pu.title')}</h2>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted">
          <Lock size={12} aria-hidden /> {t('el.pu.private')}
        </span>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-4" role="status">
          <Loader2 size={18} className="motion-safe:animate-spin text-muted" aria-hidden />
        </div>
      ) : !signedIn ? (
        <>
          <p className="mt-1 text-[13px] text-muted">{t('el.pu.signInBody')}</p>
          <button type="button" onClick={onSignIn} className="mt-3 min-h-11 rounded-full bg-primary px-4 text-sm font-extrabold text-white">
            {t('el.pu.signIn')}
          </button>
        </>
      ) : unit && !editing ? (
        <>
          <p className="mt-2 font-heading text-[22px] font-black tracking-wide text-navy">{unit.code}</p>
          {unit.name ? <p className="text-[14px] font-semibold text-navy">{unit.name}</p> : null}
          {unit.state ? <p className="text-[12px] text-muted">{t('el.pu.state', { state: unit.state })}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCode(unit.code);
                setName(unit.name ?? '');
                setEditing(true);
              }}
              className="min-h-10 rounded-full bg-white px-4 text-sm font-extrabold text-navy ring-1 ring-line"
            >
              {t('el.pu.change')}
            </button>
            <button type="button" disabled={busy} onClick={() => void forget()} className="min-h-10 rounded-full px-4 text-sm font-extrabold text-brand-red disabled:opacity-50">
              {t('el.pu.remove')}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="mt-2 flex flex-col gap-2"
        >
          <p className="text-[13px] text-muted">{t('el.pu.intro')}</p>
          <label className="flex flex-col gap-1">
            <span className="px-1 text-xs font-extrabold text-navy">{t('el.pu.code')}</span>
            <input value={code} onChange={(e) => setCode(tidyPuCode(e.target.value))} inputMode="numeric" placeholder="24-01-05-003" autoComplete="off" className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="px-1 text-xs font-extrabold text-navy">{t('el.pu.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={t('el.pu.namePh')} className={field} />
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy || code.replace(/\D/g, '').length < 4} className="min-h-11 rounded-full bg-primary px-5 text-sm font-extrabold text-white disabled:opacity-50">
              {busy ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> : t('el.pu.save')}
            </button>
            {editing ? (
              <button type="button" onClick={() => setEditing(false)} className="min-h-11 rounded-full px-4 text-sm font-extrabold text-navy">
                {t('el.pu.cancel')}
              </button>
            ) : null}
          </div>
          <a href={locatorUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 self-start text-[13px] font-extrabold text-brand-green-dark">
            {t('el.pu.find')} <ExternalLink size={13} aria-hidden />
          </a>
        </form>
      )}
    </Card>
  );
}
