'use client';

/**
 * Lost & Found item (tracker F-13d). What you see depends on who you are:
 * - the person who posted: their private detail next to each claim, Accept / Reject,
 *   the handover once a claim is accepted, Close post (refunds any pledge)
 * - anyone else: "It's mine" (found item) or "I have it / I saw it" (lost item),
 *   then the state of their claim; once returned, neighbours can flag a suspicious return
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { PostCard } from '@/components/feed/PostCard';
import { contentService } from '@/services/content.service';
import { nhToast } from '@/lib/toast';
import { apiMessage } from '@/lib/pollsApi';
import {
  acceptClaim,
  closeLostFound,
  createClaim,
  flagReturn,
  listClaims,
  myView,
  rejectClaim,
  type LfMyView,
  type LfPosterClaim,
} from '@/lib/lostFoundApi';
import type { Post } from '@/types/api';

const STATUS_TEXT: Record<string, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral' | 'blue' }> = {
  pending: { label: 'Waiting for an answer', tone: 'amber' },
  accepted: { label: 'Accepted — arrange the handover', tone: 'green' },
  rejected: { label: 'Not accepted', tone: 'red' },
  returned: { label: 'Returned ✓', tone: 'green' },
  cancelled: { label: 'Closed', tone: 'neutral' },
};

export default function LostFoundItemPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [view, setView] = useState<LfMyView | null>(null);
  const [claims, setClaims] = useState<{ yourSecretDetail: string | null; claims: LfPosterClaim[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([contentService.getPost(postId), myView(postId)]);
      setPost(p.content as unknown as Post);
      setView(v);
      setClaims(v.isPoster ? await listClaims(postId) : null);
      setError(null);
    } catch (e) {
      setError(apiMessage(e, 'This post could not be loaded.'));
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs an action; resolves true only if it worked (so sheets stay open on errors). */
  const act = async (key: string, fn: () => Promise<unknown>, done: string): Promise<boolean> => {
    setBusy(key);
    try {
      await fn();
      nhToast.success(done);
      await load();
      return true;
    } catch (e) {
      nhToast.error('That did not work', apiMessage(e, 'Try again.'));
      return false;
    } finally {
      setBusy(null);
    }
  };

  if (error) {
    return (
      <AppBrowseLayout>
        <Card className="text-center">
          <p className="text-2xl" aria-hidden>🔎</p>
          <p className="mt-1 font-bold text-navy">{error}</p>
          <Button className="mt-3" variant="secondary" onClick={() => router.back()}>Go back</Button>
        </Card>
      </AppBrowseLayout>
    );
  }

  if (!view || !post) {
    return (
      <AppBrowseLayout>
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-semibold text-muted" role="status">
          <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden /> Loading…
        </div>
      </AppBrowseLayout>
    );
  }

  const { item } = view;
  const open = item.status === 'open' || item.status === 'matched';
  const claimLabel = item.kind === 'found' ? "It's mine" : 'I have it / I saw it';
  const noop = () => {};

  return (
    <AppBrowseLayout>
      <div className="flex flex-col gap-4 pb-6">
        <PostCard post={post} onLike={noop} onComment={() => router.push(`/feed?postId=${postId}`)} onShare={noop} onSave={noop} />

        {/* ── The person who posted ── */}
        {view.isPoster ? (
          <>
            {view.activeClaim ? (
              <Card>
                <p className="font-bold text-navy">{view.activeClaim.status === 'returned' ? 'Returned ✓' : 'Handover in progress'}</p>
                <p className="mt-1 text-sm text-muted">
                  {view.activeClaim.status === 'returned' ? 'See the reward and thank a helper.' : 'Meet in a busy, public place. The code finishes the return.'}
                </p>
                <Link href={`/lost-found/claims/${view.activeClaim.id}`} className="mt-3 block">
                  <Button fullWidth>{view.activeClaim.status === 'returned' ? 'See the return' : 'Open the handover'}</Button>
                </Link>
              </Card>
            ) : null}

            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="font-heading text-lg font-extrabold text-navy">Claims</p>
                {view.pendingClaims ? <Chip tone="amber">{view.pendingClaims} waiting</Chip> : null}
              </div>
              {claims?.yourSecretDetail ? (
                <p className="mt-2 flex items-start gap-2 rounded-2xl bg-background px-3 py-2 text-sm text-navy">
                  <Lock size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                  <span>
                    <b>Your private detail:</b> {claims.yourSecretDetail}
                  </span>
                </p>
              ) : null}
              {!claims?.claims.length ? (
                <p className="mt-3 text-sm text-muted">No claims yet. We go tell you when someone answers.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {claims.claims.map((c) => (
                    <li key={c._id} className="rounded-2xl border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Chip tone={STATUS_TEXT[c.status]?.tone ?? 'neutral'}>{STATUS_TEXT[c.status]?.label ?? c.status}</Chip>
                        <span className="text-xs text-faint">{new Date(c.createdAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      </div>
                      <p className="mt-2 text-[15px] text-navy">&ldquo;{c.message}&rdquo;</p>
                      {c.status === 'pending' ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button variant="secondary" size="sm" loading={busy === `r${c._id}`} onClick={() => act(`r${c._id}`, () => rejectClaim(c._id), 'Claim rejected')}>
                            Doesn&apos;t match
                          </Button>
                          <Button size="sm" loading={busy === `a${c._id}`} onClick={() => act(`a${c._id}`, () => acceptClaim(c._id), 'Accepted. Arrange the handover.')}>
                            It matches
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted">Only accept if the description matches your private detail. Never send money to claim or return an item.</p>
            </Card>

            {open ? (
              <Button variant="ghost" fullWidth loading={busy === 'close'} onClick={() => act('close', () => closeLostFound(postId), item.pledgeStatus === 'held' ? 'Closed. Your pledge is back.' : 'Closed')}>
                {item.kind === 'lost' ? 'I found it myself — close this post' : 'Close this post'}
              </Button>
            ) : null}
          </>
        ) : (
          /* ── Everyone else ── */
          <>
            {view.myClaim ? (
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-navy">Your claim</p>
                  <Chip tone={STATUS_TEXT[view.myClaim.status]?.tone ?? 'neutral'}>{STATUS_TEXT[view.myClaim.status]?.label ?? view.myClaim.status}</Chip>
                </div>
                <p className="mt-2 text-sm text-muted">&ldquo;{view.myClaim.message}&rdquo;</p>
                {view.myClaim.status === 'accepted' || view.myClaim.status === 'returned' ? (
                  <Link href={`/lost-found/claims/${view.myClaim.id}`} className="mt-3 block">
                    <Button fullWidth>{view.myClaim.status === 'returned' ? 'See the return' : 'Open the handover'}</Button>
                  </Link>
                ) : null}
              </Card>
            ) : open ? (
              <Button fullWidth size="lg" onClick={() => setClaimOpen(true)}>
                {claimLabel}
              </Button>
            ) : (
              <Card className="text-center text-sm font-semibold text-muted">
                {item.status === 'returned' ? 'This item has been returned. 🙏🏾' : 'This post is closed.'}
              </Card>
            )}

            {view.returned?.canFlag ? (
              <button type="button" onClick={() => setFlagOpen(true)} className="self-center text-sm font-bold text-muted underline">
                Something looks wrong with this return?
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Claim sheet */}
      <AppBottomSheet
        open={claimOpen}
        onClose={() => setClaimOpen(false)}
        title={claimLabel}
        description={
          item.kind === 'found'
            ? 'Describe something only the owner would know. The finder checks it privately.'
            : 'Say what you have or what you saw, and where. The owner checks it privately.'
        }
        footer={
          <Button
            fullWidth
            loading={busy === 'claim'}
            disabled={text.trim().length < 5}
            onClick={() =>
              act('claim', () => createClaim(postId, text.trim()), 'Sent. We go tell you when they answer.').then((ok) => {
                if (!ok) return;
                setText('');
                setClaimOpen(false);
              })
            }
          >
            Send
          </Button>
        }
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          rows={4}
          placeholder={item.kind === 'found' ? 'e.g. The lock screen is my daughter in a yellow dress' : 'e.g. I saw it on the keke seat at Ojuelegba this morning'}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
        <p className="mt-2 pb-2 text-xs text-muted">Never pay anyone to get an item back. Meet in a busy, public place.</p>
      </AppBottomSheet>

      {/* Flag sheet */}
      <AppBottomSheet
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        title="Flag this return"
        description="Tell us why it looks wrong. A moderator checks it before any reward is paid."
        footer={
          <Button
            variant="danger"
            fullWidth
            loading={busy === 'flag'}
            disabled={!view.returned || text.trim().length < 5}
            onClick={() =>
              act('flag', () => flagReturn(view.returned!.claimId, text.trim()), 'Thanks. We go look into it.').then((ok) => {
                if (!ok) return;
                setText('');
                setFlagOpen(false);
              })
            }
          >
            Flag it
          </Button>
        }
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="e.g. The two of them are the same person"
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-navy outline-none placeholder:text-faint focus:border-primary"
        />
      </AppBottomSheet>
    </AppBrowseLayout>
  );
}
