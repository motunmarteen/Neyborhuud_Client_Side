'use client';

/**
 * DealStatusCard — renders a plain marketplace deal-status update posted to
 * chat (a `type: 'system'` message whose `meta.dealAction` is set), together
 * with the action button the current viewer can take at this stage.
 *
 * NeyborHuud never holds money. These buttons drive manual attestations:
 *   - Buyer taps "I've Paid"        → POST confirm-payment (records they sent it)
 *   - Seller taps "Confirm Receipt" → POST confirm-receipt (completes the deal)
 *
 * The card is role-aware: it only shows an action to the party whose turn it is.
 * It optimistically disables after a tap; the real state advances when the
 * server posts the next status message into the chat.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/api';
import { marketplaceService } from '@/services/marketplace.service';
import { chatService } from '@/services/chat.service';

type DealAction = NonNullable<NonNullable<ChatMessage['meta']>['dealAction']>;

const ACTION_STYLE: Record<
  DealAction,
  { icon: string; label: string; bg: string; text: string }
> = {
  started: { icon: '🤝', label: 'Deal Started', bg: 'bg-blue-50', text: 'text-blue-700' },
  paid: { icon: '💳', label: 'Payment Sent', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { icon: '✅', label: 'Deal Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { icon: '↩️', label: 'Deal Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function DealStatusCard({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId?: string;
}) {
  const meta = msg.meta ?? {};
  const action = (meta.dealAction ?? 'started') as DealAction;
  const orderId = meta.orderId;
  const buyerId = meta.buyerId ? String(meta.buyerId) : undefined;
  const sellerId = meta.sellerId ? String(meta.sellerId) : undefined;

  const isBuyer = !!currentUserId && currentUserId === buyerId;
  const isSeller = !!currentUserId && currentUserId === sellerId;

  const [busy, setBusy] = useState<null | 'pay' | 'confirm'>(null);
  const [done, setDone] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Buyer needs the seller's account to pay directly. Fetch it once the deal
  // is live and the viewer is the buyer.
  const [payout, setPayout] = useState<
    { bankName: string; accountNumber: string; accountName: string } | null | 'none'
  >(null);
  const buyerNeedsAccount = isBuyer && (action === 'started' || action === 'paid');

  useEffect(() => {
    if (!buyerNeedsAccount || !orderId || payout !== null) return;
    let cancelled = false;
    marketplaceService
      .getOrderPayoutDetails(orderId)
      .then((res) => {
        if (cancelled) return;
        const data = (res as any)?.data ?? res;
        setPayout(data?.hasPayoutDetails ? data.payoutDetails : 'none');
      })
      .catch(() => {
        if (!cancelled) setPayout('none');
      });
    return () => {
      cancelled = true;
    };
  }, [buyerNeedsAccount, orderId, payout]);

  const style = ACTION_STYLE[action] ?? ACTION_STYLE.started;

  const run = async (kind: 'pay' | 'confirm', fn: () => Promise<unknown>, success: string) => {
    if (!orderId || busy) return;
    setBusy(kind);
    try {
      await fn();
      toast.success(success);
      setDone(true); // optimistic — server will post the next status message
    } catch (e) {
      const message =
        (e as { message?: string })?.message || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setBusy(null);
    }
  };

  // Buyer marks paid WITH a proof screenshot: upload the image, then attest.
  const submitPayment = (proofUrl: string) =>
    run(
      'pay',
      () => marketplaceService.confirmPayment(orderId!, proofUrl),
      "Marked as paid. The seller will confirm receipt.",
    );

  // "I've Paid" opens the proof picker. If the buyer skips a file, we still
  // let them attest without proof (proof is encouraged, not mandatory).
  const onPaidClick = () => {
    if (busy || !orderId) return;
    proofInputRef.current?.click();
  };

  const onProofChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !orderId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image of your payment receipt.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Proof image must be under 5MB.');
      return;
    }

    setBusy('pay');
    try {
      const res = await chatService.uploadChatMedia(file);
      const proofUrl = res.data?.url ?? res.data?.mediaUrl ?? '';
      await marketplaceService.confirmPayment(orderId, proofUrl);
      toast.success('Payment proof sent. The seller will confirm receipt.');
      setDone(true);
    } catch (err) {
      const message =
        (err as { message?: string })?.message || 'Could not upload proof. Please try again.';
      toast.error(message);
    } finally {
      setBusy(null);
    }
  };

  // Attest payment without attaching a proof image.
  const onPaidNoProof = () => void submitPayment('');

  const onConfirm = () =>
    run(
      'confirm',
      () => marketplaceService.confirmReceipt(orderId!),
      'Receipt confirmed — deal completed!',
    );

  // Which action (if any) does THIS viewer get at THIS stage?
  const showPay = action === 'started' && isBuyer && !done;
  const showConfirm = action === 'paid' && isSeller && !done;
  const hasActions = showPay || showConfirm;

  return (
    <div className={`overflow-hidden rounded-2xl ${style.bg} max-w-[300px] sm:max-w-sm`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${style.text}`}>
        <span className="text-base">{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          NeyborHuud Deal · {style.label}
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        <p className="text-sm text-gray-700 leading-snug">{msg.content}</p>

        {typeof meta.amount === 'number' && (
          <p className={`mt-1 text-xs font-bold ${style.text}`}>
            ₦{meta.amount.toLocaleString()}
          </p>
        )}

        {/* Seller's account for the buyer to pay directly (buyer view only). */}
        {buyerNeedsAccount && payout && payout !== 'none' && (
          <div className="mt-2 rounded-xl border border-black/[0.06] bg-white/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Pay the seller directly
            </p>
            <p className="mt-0.5 text-sm font-bold text-gray-900">
              {payout.bankName} · {payout.accountNumber}
            </p>
            <p className="text-xs text-gray-600">{payout.accountName}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(payout.accountNumber);
                toast.success('Account number copied');
              }}
              className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Copy account number
            </button>
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 p-2">
              <p className="text-[11px] font-semibold text-amber-800 leading-snug">
                ⚠️ Transfer only to this account, and confirm the account name
                matches before sending. NeyborHuud never holds your money and
                cannot recover a payment sent elsewhere. Only tap “I’ve Paid”
                after the transfer succeeds.
              </p>
            </div>
          </div>
        )}
        {buyerNeedsAccount && payout === 'none' && (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-medium text-amber-700">
            The seller hasn't added payment details yet. Ask them to set it in Settings before you pay.
          </p>
        )}

        {meta.proofUrl && action === 'paid' && (
          <a
            href={String(meta.proofUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-semibold text-amber-700 hover:underline"
          >
            View payment proof →
          </a>
        )}

        {hasActions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {showPay && (
              <>
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onProofChosen}
                  aria-label="Attach payment proof"
                />
                <button
                  type="button"
                  onClick={onPaidClick}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'pay' ? 'Sending…' : "I've Paid · add proof"}
                </button>
                <button
                  type="button"
                  onClick={onPaidNoProof}
                  disabled={busy !== null}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Paid, no proof
                </button>
              </>
            )}
            {showConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy === 'confirm' ? 'Confirming…' : 'Confirm Receipt'}
              </button>
            )}
          </div>
        )}

        {action === 'completed' && typeof meta.reward === 'number' && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            +{meta.reward} HuudCoins each · trust boosted
          </p>
        )}
      </div>
    </div>
  );
}
