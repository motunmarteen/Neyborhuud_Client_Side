'use client';

/**
 * OfferCard — renders a marketplace haggle/offer event posted into the deal chat
 * (a `type: 'system'` message carrying `meta.offerAction`) with role-aware
 * action buttons.
 *
 *   Seller (on a new/pending offer): Accept · Reject · Counter
 *   Buyer  (after seller counters):  Accept counter · Counter back · Withdraw
 *
 * Accepting flows the deal into an order (the backend posts the next status
 * update as a DealStatusCard in the SAME thread). The card disables
 * optimistically after an action; the real state advances when the next
 * system message arrives.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/api';
import { marketplaceService } from '@/services/marketplace.service';

type OfferAction = 'new' | 'accept' | 'reject' | 'counter' | 'withdrawn';

const STYLE: Record<OfferAction, { icon: string; label: string; bg: string; text: string }> = {
  new: { icon: '💰', label: 'New Offer', bg: 'bg-blue-50', text: 'text-blue-700' },
  counter: { icon: '↔️', label: 'Counter Offer', bg: 'bg-amber-50', text: 'text-amber-700' },
  accept: { icon: '✅', label: 'Offer Accepted', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  reject: { icon: '❌', label: 'Offer Declined', bg: 'bg-gray-100', text: 'text-gray-600' },
  withdrawn: { icon: '🚫', label: 'Offer Withdrawn', bg: 'bg-gray-100', text: 'text-gray-600' },
};

function naira(n: number | undefined) {
  return typeof n === 'number' ? `₦${n.toLocaleString()}` : '';
}

export function OfferCard({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId?: string;
}) {
  const meta = msg.meta ?? {};
  const action = (meta.offerAction ?? 'new') as OfferAction;
  const offerId = meta.offerId ? String(meta.offerId) : undefined;
  const buyerId = meta.buyerId ? String(meta.buyerId) : undefined;
  const sellerId = meta.sellerId ? String(meta.sellerId) : undefined;
  const actorRole = meta.actorRole; // 'buyer' | 'seller' — who performed THIS event
  const amount = (meta.counterAmount as number) ?? meta.offerAmount;

  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const style = STYLE[action] ?? STYLE.new;

  const run = async (kind: string, fn: () => Promise<unknown>, success: string) => {
    if (!offerId || busy) return;
    setBusy(kind);
    try {
      await fn();
      toast.success(success);
      setDone(true);
    } catch (e) {
      toast.error((e as { message?: string })?.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const askCounter = (): number | null => {
    if (typeof window === 'undefined') return null;
    const raw = window.prompt('Enter your counter amount (₦):', String(amount ?? ''))?.trim();
    if (!raw) return null;
    const val = Number(raw.replace(/[^0-9.]/g, ''));
    if (!val || val <= 0) {
      toast.error('Enter a valid amount.');
      return null;
    }
    return val;
  };

  const onAccept = () =>
    run('accept', () => marketplaceService.acceptOffer(offerId!), 'Offer accepted — creating the deal…');
  const onReject = () =>
    run('reject', () => marketplaceService.rejectOffer(offerId!), 'Offer declined.');
  const onCounter = () => {
    const val = askCounter();
    if (val == null) return;
    void run('counter', () => marketplaceService.respondToOffer(offerId!, 'counter', val), `Countered with ${naira(val)}.`);
  };
  const onWithdraw = () =>
    run('withdraw', () => marketplaceService.withdrawOffer(offerId!), 'Offer withdrawn.');

  // Role of the current viewer relative to this deal.
  // Prefer an explicit ID match (robust). Fall back to inferring from actorRole
  // only for older messages that predate buyerId/sellerId in the metadata:
  // whoever performed the event is NOT the one who responds next.
  const hasIds = !!(buyerId && sellerId && currentUserId);
  const viewerIsSeller = hasIds
    ? currentUserId === sellerId
    : actorRole === 'buyer';
  const viewerIsBuyer = hasIds
    ? currentUserId === buyerId
    : actorRole === 'seller';

  const isLive = (action === 'new' || action === 'counter') && !done;

  // Seller responds to a buyer's new/counter offer.
  const showSellerActions = isLive && action === 'new' && viewerIsSeller;
  // Buyer responds to the seller's counter.
  const showBuyerActions = isLive && action === 'counter' && viewerIsBuyer;

  return (
    <div className={`overflow-hidden rounded-2xl ${style.bg} max-w-[300px] sm:max-w-sm`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${style.text}`}>
        <span className="text-base">{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          Marketplace · {style.label}
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        <p className="text-sm text-gray-700 leading-snug">{msg.content}</p>
        {amount !== undefined && (
          <p className={`mt-1 text-base font-extrabold ${style.text}`}>{naira(amount)}</p>
        )}

        {(showSellerActions || showBuyerActions) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {showSellerActions && (
              <>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === 'accept' ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={onCounter}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'counter' ? '…' : 'Counter'}
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {busy === 'reject' ? '…' : 'Reject'}
                </button>
              </>
            )}
            {showBuyerActions && (
              <>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === 'accept' ? 'Accepting…' : 'Accept counter'}
                </button>
                <button
                  type="button"
                  onClick={onCounter}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'counter' ? '…' : 'Counter back'}
                </button>
                <button
                  type="button"
                  onClick={onWithdraw}
                  disabled={busy !== null}
                  className="inline-flex items-center rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {busy === 'withdraw' ? '…' : 'Withdraw'}
                </button>
              </>
            )}
          </div>
        )}

        {action === 'accept' && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            Deal agreed — starting the order. Watch this chat for the next step.
          </p>
        )}
      </div>
    </div>
  );
}
