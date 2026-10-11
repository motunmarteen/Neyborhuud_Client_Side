'use client';

/**
 * Lost & Found handover (tracker F-13d).
 * - Owner: shows the 4-digit code; only show it with the item in your hand.
 * - Finder: types the code to finish the return.
 * - After the return: the finder sees the reward (held 72 hours, then paid) or why there
 *   is none; the owner can thank one neighbour whose tip helped (+10 HuudCredit).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { nhToast } from '@/lib/toast';
import { apiMessage } from '@/lib/pollsApi';
import { confirmReturn, getClaim, getCode, thankHelper, type LfClaim } from '@/lib/lostFoundApi';

type Person = { id: string; username: string; name: string };

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

export default function HandoverPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<LfClaim | null>(null);
  const [item, setItem] = useState<{ kind: string; itemName: string; place: string; status: string } | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [entry, setEntry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [helperQuery, setHelperQuery] = useState('');
  const [people, setPeople] = useState<Person[]>([]);

  const load = useCallback(async () => {
    try {
      const out = await getClaim(claimId);
      setClaim(out.claim);
      setItem(out.item);
      if (out.claim.role === 'owner' && out.claim.status === 'accepted') setCode((await getCode(claimId)).code);
      setError(null);
    } catch (e) {
      setError(apiMessage(e, 'This handover could not be loaded.'));
    }
  }, [claimId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Find a neighbour to thank (owner, after the return).
  useEffect(() => {
    const q = helperQuery.trim();
    if (q.length < 2) {
      setPeople([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.get<any>('/search', { params: { q, type: 'users', limit: 5 } });
        const list = ((res as any)?.data?.users?.data ?? []) as any[];
        setPeople(list.map((u) => ({ id: String(u._id ?? u.id), username: u.username, name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username })));
      } catch {
        setPeople([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [helperQuery]);

  const submitCode = async () => {
    setBusy(true);
    try {
      const out = await confirmReturn(claimId, entry);
      const total = (out.reward.amount ?? 0) + (out.reward.pledgeAmount ?? 0);
      const days = Math.max(1, Math.round((out.reward.releaseInHours ?? 72) / 24));
      nhToast.thanks(
        out.reward.status === 'held' && total > 0
          ? { emoji: '🙏🏾', title: 'Returned! Thank you', sub: `Your ${total} HuudCredit lands in your wallet in ${days} days.` }
          : { emoji: '🙏🏾', title: 'Returned! Thank you' },
      );
      setEntry('');
      await load();
    } catch (e) {
      nhToast.error('Not confirmed', apiMessage(e, 'Check the code and try again.'));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const newCode = async () => {
    setBusy(true);
    try {
      setCode((await getCode(claimId, true)).code);
    } catch (e) {
      nhToast.error('Could not make a new code', apiMessage(e, 'Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const thank = async (p: Person) => {
    setBusy(true);
    try {
      await thankHelper(claimId, p.id);
      nhToast.thanks({ emoji: '👏🏾', title: `Thank-you sent to ${p.name}`, sub: 'They get 10 HuudCredit for their help.' });
      setHelperQuery('');
      await load();
    } catch (e) {
      nhToast.error('Not sent', apiMessage(e, 'Try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <AppBrowseLayout>
        <Card className="text-center">
          <p className="font-bold text-navy">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => router.back()}>Go back</Button>
        </Card>
      </AppBrowseLayout>
    );
  }
  if (!claim) {
    return (
      <AppBrowseLayout>
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-muted" role="status">
          <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> Loading…
        </div>
      </AppBrowseLayout>
    );
  }

  const reward = claim.reward;
  const total = (reward?.amount ?? 0) + (reward?.pledgeAmount ?? 0);

  return (
    <AppBrowseLayout>
      <div className="flex flex-col gap-4 pb-6">
        <Card>
          <p className="text-[11px] font-black uppercase tracking-wider text-faint">Handover</p>
          <p className="mt-1 font-heading text-xl font-extrabold text-navy">{item?.itemName ?? 'Item'}</p>
          {item?.place ? <p className="text-sm text-muted">{item.kind === 'found' ? 'Found at' : 'Last seen'} {item.place}</p> : null}
          <Link href={`/lost-found/${claim.postId}`} className="mt-2 inline-block text-sm font-extrabold text-brand-green-dark hover:underline">See the post</Link>
        </Card>

        {claim.status === 'pending' ? (
          <Card className="text-center text-sm font-semibold text-muted">Waiting for the person who posted to check the description.</Card>
        ) : null}
        {claim.status === 'rejected' || claim.status === 'cancelled' ? (
          <Card className="text-center text-sm font-semibold text-muted">This claim is closed.</Card>
        ) : null}

        {/* Owner: the code */}
        {claim.status === 'accepted' && claim.role === 'owner' ? (
          <Card className="text-center">
            <p className="font-bold text-navy">Your handover code</p>
            <p className="mt-1 text-sm text-muted">Show it only when the item is in your hand. The finder types it to finish.</p>
            <p className="my-4 font-heading text-5xl font-black tracking-[0.3em] text-navy" aria-label={code ? `Code ${code.split('').join(' ')}` : 'Loading code'}>
              {code ?? '····'}
            </p>
            <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={15} />} loading={busy} onClick={newCode}>
              New code
            </Button>
            {claim.codeExpiresAt ? <p className="mt-1 text-xs text-faint">Works until {when(claim.codeExpiresAt)}</p> : null}
          </Card>
        ) : null}

        {/* Finder: enter the code */}
        {claim.status === 'accepted' && claim.role === 'finder' ? (
          <Card>
            <p className="font-bold text-navy">Finish the return</p>
            <p className="mt-1 text-sm text-muted">When you hand it over, ask the owner for the 4-digit code on their phone.</p>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="4-digit code"
              placeholder="0000"
              className="mt-4 h-16 w-full rounded-2xl border border-line bg-white text-center font-heading text-3xl font-black tracking-[0.4em] text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            <p className="mt-1.5 text-xs text-muted">{claim.codeAttemptsLeft} {claim.codeAttemptsLeft === 1 ? 'try' : 'tries'} left</p>
            <Button className="mt-3" fullWidth loading={busy} disabled={entry.length !== 4 || claim.codeAttemptsLeft === 0} onClick={submitCode}>
              Confirm return
            </Button>
          </Card>
        ) : null}

        {claim.status === 'accepted' ? (
          <Card className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-green-dark" aria-hidden />
            <p className="text-sm text-navy">Meet in a busy, public place (estate gate, police post, a busy shop). Never pay anyone to get an item back.</p>
          </Card>
        ) : null}

        {/* After the return */}
        {claim.status === 'returned' ? (
          <Card>
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-lg font-extrabold text-navy">Returned ✓</p>
              {claim.returnedAt ? <span className="text-xs text-faint">{when(claim.returnedAt)}</span> : null}
            </div>

            {claim.role === 'finder' && reward ? (
              <div className="mt-3 rounded-2xl bg-background p-3">
                {reward.status === 'held' ? (
                  <p className="text-sm text-navy">
                    🪙 <b>{total} HuudCredit</b> is on its way{reward.releaseAt ? ` (${when(reward.releaseAt)})` : ''}, with your <b>Honest Neighbour</b> badge. It waits 3 days so neighbours can check the return.
                  </p>
                ) : reward.status === 'paid' ? (
                  <p className="text-sm text-navy">🪙 <b>{total} HuudCredit</b> paid. You&apos;re an <b>Honest Neighbour</b> 🔎</p>
                ) : reward.status === 'review' ? (
                  <p className="text-sm text-navy">A neighbour asked us to check this return. Your reward waits until a moderator looks at it.</p>
                ) : reward.status === 'blocked' ? (
                  <div className="text-sm text-navy">
                    <p>Thank you for returning it. This return doesn&apos;t earn a reward because:</p>
                    <ul className="mt-1 list-disc pl-5 text-muted">
                      {reward.blockedReasons.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </div>
                ) : reward.status === 'reversed' ? (
                  <p className="text-sm text-navy">This reward was cancelled after a check.</p>
                ) : null}
              </div>
            ) : null}

            {claim.role === 'owner' ? (
              claim.helperRewarded ? (
                <p className="mt-3 text-sm text-muted">You thanked a helper. 🙏🏾</p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-sm font-bold text-navy">Did a neighbour&apos;s tip help? Thank them (+10 HuudCredit)</p>
                  <input
                    value={helperQuery}
                    onChange={(e) => setHelperQuery(e.target.value)}
                    placeholder="Search their name or @username"
                    aria-label="Search the neighbour to thank"
                    className="min-h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary"
                  />
                  {people.map((p) => (
                    <button key={p.id} type="button" disabled={busy} onClick={() => thank(p)} className="flex min-h-12 items-center justify-between rounded-2xl border border-line px-4 text-left hover:bg-[#F6F8FB]">
                      <span className="font-bold text-navy">{p.name} <span className="font-normal text-muted">@{p.username}</span></span>
                      <Chip tone="green">Thank</Chip>
                    </button>
                  ))}
                </div>
              )
            ) : null}
          </Card>
        ) : null}
      </div>
    </AppBrowseLayout>
  );
}
