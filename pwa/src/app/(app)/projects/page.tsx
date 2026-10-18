'use client';

/**
 * Community projects (Phase 7, G-14): neighbours put HuudCredit towards a verified local
 * project (gutter clearing, solar gate lights, first-aid kits). A sponsor may match what
 * neighbours give. If a project is cancelled, everyone gets their HuudCredit back.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { getErrorMessage } from '@/lib/error-handler';
import { usePledge, useProjects, type Project } from '@/hooks/usePhase7';

const AMOUNTS = [20, 50, 100, 200, 500];
const STATUS: Record<Project['status'], string> = { open: 'Open', funded: '🎉 Funded', done: '✅ Done', cancelled: 'Cancelled' };

function ProjectCard({ p, onBack }: { p: Project; onBack: (p: Project) => void }) {
  const pct = Math.round(Math.min(1, p.total / Math.max(1, p.goal)) * 100);
  return (
    <li className="flex flex-col gap-3 rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-soft text-2xl">
          {p.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-black text-navy">{p.title}</h2>
          <p className="text-xs font-bold text-muted">
            {p.lga}, {p.state} · {STATUS[p.status]}
          </p>
        </div>
      </div>
      {p.description ? <p className="text-sm text-navy">{p.description}</p> : null}
      <div className="flex flex-col gap-1.5">
        <div className="h-2.5 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={p.goal} aria-valuenow={Math.min(p.total, p.goal)} aria-label={`${p.title} progress`}>
          <div className="h-full rounded-full bg-brand-green-dark" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm font-bold text-navy">
          🪙 {p.total.toLocaleString('en-NG')} of {p.goal.toLocaleString('en-NG')} · {p.backers} {p.backers === 1 ? 'neighbour' : 'neighbours'}
        </p>
        {p.sponsor ? (
          <p className="text-xs font-semibold text-[#A86F0A]">
            {p.sponsor.name} matches {p.sponsor.ratio === 1 ? 'every HuudCredit' : `×${p.sponsor.ratio}`} up to {p.sponsor.cap.toLocaleString('en-NG')}
            {p.matched ? ` (${p.matched.toLocaleString('en-NG')} so far)` : ''}
          </p>
        ) : null}
        {p.myPledge ? <p className="text-xs font-bold text-brand-green-dark">You put in 🪙 {p.myPledge.toLocaleString('en-NG')}. Thank you!</p> : null}
        {p.doneNote ? <p className="text-xs font-semibold text-muted">{p.doneNote}</p> : null}
      </div>
      {p.status === 'open' ? (
        <button type="button" onClick={() => onBack(p)} className="min-h-12 rounded-full bg-primary text-[15px] font-bold text-white">
          Put in HuudCredit
        </button>
      ) : null}
    </li>
  );
}

export default function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useProjects();
  const [backing, setBacking] = useState<Project | null>(null);
  const [amount, setAmount] = useState(50);
  const pledge = usePledge();
  const mine = data?.projects.filter((p) => data.area && p.lga === data.area.lga && p.state === data.area.state) ?? [];
  const others = data?.projects.filter((p) => !mine.includes(p)) ?? [];

  return (
    <div className="min-h-screen bg-background pb-[calc(var(--app-bottomnav-h)+1.5rem)] pt-[var(--app-topnav-offset)]">
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <div className="rounded-[22px] bg-white p-4 shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          <h1 className="font-heading text-xl font-black text-navy">Community projects</h1>
          <p className="text-sm text-navy">
            Real things your area needs, checked by NeyborHuud. Put in HuudCredit; sponsors can match it. If a project is cancelled, you get it all back.
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-[22px]" />
        ) : isError || !data ? (
          <ErrorState onRetry={() => void refetch()} homeHref={null} />
        ) : !data.projects.length ? (
          <p className="rounded-[22px] bg-white p-4 text-sm text-navy shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
            No projects yet. When your area has one (like solar lights for the gate or clearing the gutter), it will show here.
          </p>
        ) : (
          <>
            {mine.length ? (
              <>
                <h2 className="px-1 font-heading text-lg font-extrabold text-navy">In {data.area?.lga}</h2>
                <ul className="flex flex-col gap-3">
                  {mine.map((p) => (
                    <ProjectCard key={p.id} p={p} onBack={setBacking} />
                  ))}
                </ul>
              </>
            ) : null}
            {others.length ? (
              <>
                <h2 className="px-1 font-heading text-lg font-extrabold text-navy">Across Nigeria</h2>
                <ul className="flex flex-col gap-3">
                  {others.map((p) => (
                    <ProjectCard key={p.id} p={p} onBack={setBacking} />
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </main>

      <AppBottomSheet open={!!backing} onClose={() => setBacking(null)} title={backing ? backing.title : 'Project'}>
        {backing ? (
          <div className="flex flex-col gap-3 pb-2">
            <p className="text-sm font-bold text-navy">How much HuudCredit?</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Amount">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={amount === a}
                  onClick={() => setAmount(a)}
                  className={`min-h-11 rounded-full px-4 text-sm font-bold ${amount === a ? 'bg-navy text-white' : 'border border-line bg-white text-navy'}`}
                >
                  🪙 {a}
                </button>
              ))}
            </div>
            {backing.sponsor ? (
              <p className="text-xs font-semibold text-[#A86F0A]">
                {backing.sponsor.name} adds {Math.round(amount * backing.sponsor.ratio)} more (while the match lasts).
              </p>
            ) : null}
            <button
              type="button"
              disabled={pledge.isPending}
              onClick={() =>
                pledge.mutate(
                  { projectId: backing.id, amount },
                  {
                    onSuccess: () => {
                      toast.success(`Thank you! 🪙 ${amount} towards ${backing.title}`);
                      setBacking(null);
                    },
                    onError: (err) => toast.error(getErrorMessage(err)),
                  },
                )
              }
              className="min-h-12 rounded-full bg-primary text-[15px] font-bold text-white disabled:opacity-50"
            >
              Put in 🪙 {amount}
            </button>
          </div>
        ) : null}
      </AppBottomSheet>
    </div>
  );
}
