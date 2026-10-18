'use client';

/**
 * Admin › Community (Phase 7): pick Huud of the Week, add community projects (with sponsor
 * matching), create sponsored missions (the code shows once), watch the HuudCredit economy,
 * and take back rewards for something that turned out false.
 */

import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-handler';
import {
  useAdminCreateMission,
  useAdminCreateProject,
  useAdminEconomy,
  useAdminEndMission,
  useAdminHuudWeek,
  useAdminMissions,
  useAdminProjectStatus,
  useAdminProjects,
  useAdminReverse,
  useSetHuudWeek,
} from '@/hooks/usePhase7';

const INPUT = 'min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-emerald-400';
const BTN = 'min-h-11 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white disabled:opacity-50';
const BTN_GHOST = 'min-h-10 rounded-xl border border-white/20 px-3 text-xs font-bold text-white disabled:opacity-50';

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div>
        <h2 className="text-base font-black text-white">{title}</h2>
        {note ? <p className="text-xs text-white/60">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-bold text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}

function HuudWeekAdmin() {
  const { data } = useAdminHuudWeek();
  const set = useSetHuudWeek();
  const [which, setWhich] = useState<'this' | 'next'>('next');
  const [themeId, setThemeId] = useState('');
  const [goal, setGoal] = useState('');
  if (!data) return <Card title="Huud of the Week">Loading…</Card>;
  return (
    <Card title="Huud of the Week" note="Themes rotate on their own. Pick one here to choose it yourself. Only built-in themes, so nothing needs checking.">
      <p className="text-sm text-white">
        This week: <b>{data.current.emoji} {data.current.title}</b> (goal {data.current.goal}) · Next week: <b>{data.next.emoji} {data.next.title}</b> (goal {data.next.goal})
      </p>
      <form
        className="grid gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          set.mutate(
            { themeId: themeId || data.themes[0].id, which, goal: goal ? Number(goal) : undefined },
            { onSuccess: () => toast.success('Huud of the Week set'), onError: (err) => toast.error(getErrorMessage(err)) },
          );
        }}
      >
        <Field label="Week" id="hw-which">
          <select id="hw-which" className={INPUT} value={which} onChange={(e) => setWhich(e.target.value as 'this' | 'next')}>
            <option value="this">This week</option>
            <option value="next">Next week</option>
          </select>
        </Field>
        <Field label="Theme" id="hw-theme">
          <select id="hw-theme" className={INPUT} value={themeId} onChange={(e) => setThemeId(e.target.value)}>
            {data.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Goal per area (optional)" id="hw-goal">
          <input id="hw-goal" className={INPUT} inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value.replace(/\D/g, ''))} placeholder="Theme default" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className={BTN} disabled={set.isPending}>
            Set theme
          </button>
        </div>
      </form>
    </Card>
  );
}

function ProjectsAdmin() {
  const { data } = useAdminProjects();
  const create = useAdminCreateProject();
  const status = useAdminProjectStatus();
  const [f, setF] = useState({ title: '', description: '', emoji: '🏗️', lga: '', state: '', goal: '1000', sponsor: '', ratio: '1', cap: '0' });
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        title: f.title,
        description: f.description,
        emoji: f.emoji,
        lga: f.lga,
        state: f.state,
        goal: Number(f.goal),
        sponsor: f.sponsor.trim() ? { name: f.sponsor.trim(), ratio: Number(f.ratio) || 1, cap: Number(f.cap) || 0 } : null,
      },
      {
        onSuccess: () => {
          toast.success('Project added');
          setF({ ...f, title: '', description: '' });
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };
  return (
    <Card title="Community projects" note="Only add projects you have checked are real. Mark done with a short note of what was built; cancelling refunds everyone.">
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <Field label="Title" id="pj-title">
          <input id="pj-title" required maxLength={80} className={INPUT} value={f.title} onChange={up('title')} placeholder="Solar lights for Ojuelegba gate" />
        </Field>
        <Field label="Emoji" id="pj-emoji">
          <input id="pj-emoji" maxLength={4} className={INPUT} value={f.emoji} onChange={up('emoji')} />
        </Field>
        <Field label="What it is" id="pj-desc">
          <textarea id="pj-desc" maxLength={600} className={`${INPUT} min-h-20 py-2`} value={f.description} onChange={up('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="LGA" id="pj-lga">
            <input id="pj-lga" required className={INPUT} value={f.lga} onChange={up('lga')} placeholder="Alimosho" />
          </Field>
          <Field label="State" id="pj-state">
            <input id="pj-state" required className={INPUT} value={f.state} onChange={up('state')} placeholder="Lagos" />
          </Field>
        </div>
        <Field label="Goal (HuudCredit)" id="pj-goal">
          <input id="pj-goal" required inputMode="numeric" className={INPUT} value={f.goal} onChange={up('goal')} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sponsor (optional)" id="pj-sp">
            <input id="pj-sp" className={INPUT} value={f.sponsor} onChange={up('sponsor')} placeholder="Bisi Stores" />
          </Field>
          <Field label="Match ×" id="pj-ratio">
            <input id="pj-ratio" inputMode="decimal" className={INPUT} value={f.ratio} onChange={up('ratio')} />
          </Field>
          <Field label="Match cap" id="pj-cap">
            <input id="pj-cap" inputMode="numeric" className={INPUT} value={f.cap} onChange={up('cap')} />
          </Field>
        </div>
        <div>
          <button type="submit" className={BTN} disabled={create.isPending}>
            Add project
          </button>
        </div>
      </form>
      <ul className="flex flex-col divide-y divide-white/10">
        {(data ?? []).map((p) => (
          <li key={p._id} className="flex flex-wrap items-center gap-2 py-2 text-sm text-white">
            <span className="min-w-0 flex-1">
              {p.emoji} <b>{p.title}</b> · {p.lga}, {p.state} · {p.raised.toLocaleString()}/{p.goal.toLocaleString()} · {p.backers} backers · <i>{p.status}</i>
            </span>
            {p.status === 'open' || p.status === 'funded' ? (
              <>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={() => {
                    const note = window.prompt('What was built? (shown on the project)') ?? '';
                    status.mutate({ id: p._id, status: 'done', note }, { onError: (err) => toast.error(getErrorMessage(err)) });
                  }}
                >
                  Mark done
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  onClick={() => {
                    if (window.confirm(`Cancel "${p.title}" and refund everyone?`)) {
                      status.mutate({ id: p._id, status: 'cancelled' }, { onError: (err) => toast.error(getErrorMessage(err)) });
                    }
                  }}
                >
                  Cancel + refund
                </button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function MissionsAdmin() {
  const { data } = useAdminMissions();
  const create = useAdminCreateMission();
  const end = useAdminEndMission();
  const [code, setCode] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ title: '', description: '', sponsor: '', emoji: '🎯', reward: '30', lga: '', state: '', startsAt: today, endsAt: today, maxCompletions: '50' });
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Card title="Sponsored missions" note="A business pays for a real-world task. People prove it with a code the sponsor gives them in person. Never reviews, ratings or follows (the server refuses them).">
      {code ? (
        <div className="rounded-xl border border-emerald-400 bg-emerald-500/10 p-4 text-white">
          <p className="text-xs font-bold text-emerald-300">Give this code to the sponsor. It is shown only now.</p>
          <p className="mt-1 font-mono text-3xl font-black tracking-[0.3em]">{code}</p>
          <button type="button" className={`${BTN_GHOST} mt-2`} onClick={() => setCode(null)}>
            I have saved it
          </button>
        </div>
      ) : null}
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              ...f,
              reward: Number(f.reward),
              maxCompletions: Number(f.maxCompletions),
              lga: f.lga.trim() || null,
              state: f.state.trim() || null,
              startsAt: new Date(`${f.startsAt}T00:00:00+01:00`).toISOString(),
              endsAt: new Date(`${f.endsAt}T23:59:59+01:00`).toISOString(),
            },
            {
              onSuccess: (r) => {
                setCode(r.code);
                setF({ ...f, title: '', description: '' });
              },
              onError: (err) => toast.error(getErrorMessage(err)),
            },
          );
        }}
      >
        <Field label="Task" id="ms-title">
          <input id="ms-title" required maxLength={80} className={INPUT} value={f.title} onChange={up('title')} placeholder="Attend the free health check" />
        </Field>
        <Field label="Sponsor" id="ms-sponsor">
          <input id="ms-sponsor" required maxLength={60} className={INPUT} value={f.sponsor} onChange={up('sponsor')} placeholder="Ikeja Community Clinic" />
        </Field>
        <Field label="Details" id="ms-desc">
          <input id="ms-desc" maxLength={400} className={INPUT} value={f.description} onChange={up('description')} placeholder="Town hall, 9am to 2pm" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Emoji" id="ms-emoji">
            <input id="ms-emoji" maxLength={4} className={INPUT} value={f.emoji} onChange={up('emoji')} />
          </Field>
          <Field label="Reward (5–200)" id="ms-reward">
            <input id="ms-reward" required inputMode="numeric" className={INPUT} value={f.reward} onChange={up('reward')} />
          </Field>
          <Field label="Places" id="ms-max">
            <input id="ms-max" required inputMode="numeric" className={INPUT} value={f.maxCompletions} onChange={up('maxCompletions')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="LGA (empty = all Nigeria)" id="ms-lga">
            <input id="ms-lga" className={INPUT} value={f.lga} onChange={up('lga')} />
          </Field>
          <Field label="State" id="ms-state">
            <input id="ms-state" className={INPUT} value={f.state} onChange={up('state')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" id="ms-start">
            <input id="ms-start" type="date" required className={INPUT} value={f.startsAt} onChange={up('startsAt')} />
          </Field>
          <Field label="Ends" id="ms-end">
            <input id="ms-end" type="date" required className={INPUT} value={f.endsAt} onChange={up('endsAt')} />
          </Field>
        </div>
        <div>
          <button type="submit" className={BTN} disabled={create.isPending}>
            Create mission
          </button>
        </div>
      </form>
      <ul className="flex flex-col divide-y divide-white/10">
        {(data ?? []).map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 py-2 text-sm text-white">
            <span className="min-w-0 flex-1">
              {m.emoji} <b>{m.title}</b> · {m.sponsor} · {m.area} · +{m.reward} · {m.completions}/{m.maxCompletions} · <i>{m.status}</i>
            </span>
            {m.status === 'active' ? (
              <button type="button" className={BTN_GHOST} onClick={() => end.mutate(m.id)}>
                End now
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function EconomyAdmin() {
  const { data } = useAdminEconomy();
  if (!data) return <Card title="HuudCredit economy">Loading…</Card>;
  return (
    <Card title="HuudCredit economy" note="Earned vs spent each week (Nigeria weeks). If earning keeps running far ahead of spending, prices or rewards need a look.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm text-white">
          <thead className="text-xs text-white/60">
            <tr>
              <th className="py-2">Week of</th>
              <th>Earned</th>
              <th>Spent</th>
              <th>People earning</th>
              <th>People spending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {data.weeks.map((w) => (
              <tr key={w.week}>
                <td className="py-2">{w.week}</td>
                <td>{w.earned.toLocaleString()}</td>
                <td>{w.spent.toLocaleString()}</td>
                <td>{w.earners}</td>
                <td>{w.spenders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/70">
        HuudCredit held by everyone now: <b>{data.outstanding.toLocaleString()}</b> · Reversals in this period: <b>{data.reversals}</b>
      </p>
    </Card>
  );
}

function ReverseAdmin() {
  const reverse = useAdminReverse();
  const [refId, setRefId] = useState('');
  const [why, setWhy] = useState('');
  return (
    <Card title="Take back rewards" note="For an outcome that turned out false (e.g. a report later found fake). Use the reference like content:<post id>, incident:<id>, event:<id>, job:<id>. Each reward is taken back once. Posts removed by moderators are reversed automatically.">
      <form
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!window.confirm(`Take back everything paid for ${refId}?`)) return;
          reverse.mutate(
            { refId: refId.trim(), why: why.trim() || 'reversed by an admin' },
            {
              onSuccess: (r) => toast.success(`Taken back: ${r.impact} Impact and ${r.coins} HuudCredit`),
              onError: (err) => toast.error(getErrorMessage(err)),
            },
          );
        }}
      >
        <Field label="Reference" id="rv-ref">
          <input id="rv-ref" required className={INPUT} value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="content:65f0…" />
        </Field>
        <Field label="Why (shown in their history)" id="rv-why">
          <input id="rv-why" maxLength={120} className={INPUT} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="the report was false" />
        </Field>
        <div className="flex items-end">
          <button type="submit" className={BTN} disabled={reverse.isPending}>
            Take back
          </button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminCommunityPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-5">
      <h1 className="text-xl font-black text-white">Community</h1>
      <HuudWeekAdmin />
      <ProjectsAdmin />
      <MissionsAdmin />
      <EconomyAdmin />
      <ReverseAdmin />
    </div>
  );
}
