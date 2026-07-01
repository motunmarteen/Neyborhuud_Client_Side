'use client';

/**
 * EscrowCard — renders a Social Witness Escrow milestone posted by the Escrow
 * Bot (a `type: 'system'` message whose `meta.escrowBot` is true), together with
 * the action buttons the current viewer can take at this stage.
 *
 * NeyborHuud never holds money. These buttons drive attestations:
 *   - Buyer taps "I've Paid"       → POST confirm-payment (records they sent it)
 *   - Seller taps "Confirm Receipt"→ POST confirm-receipt (completes the deal)
 *   - Either taps "Dispute"        → POST dispute (routes to a Neybor Baale)
 *
 * The card is role-aware: it only shows an action to the party whose turn it is.
 * It optimistically disables after a tap; the real state advances when the bot
 * posts the next milestone message into the chat.
 */

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types/api';
import { marketplaceService } from '@/services/marketplace.service';
import { chatService } from '@/services/chat.service';

type EscrowEvent = NonNullable<NonNullable<ChatMessage['meta']>['escrowEvent']>;

const EVENT_STYLE: Record<
  EscrowEvent,
  { icon: string; label: string; bg: string; text: string }
> = {
  committed: { icon: '🤝', label: 'Deal Started', bg: 'bg-blue-50', text: 'text-blue-700' },
  buyer_paid: { icon: '💳', label: 'Payment Sent', bg: 'bg-amber-50', text: 'text-amber-700' },
  completed: { icon: '✅', label: 'Deal Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  disputed: { icon: '⚠️', label: 'Under Review', bg: 'bg-red-50', text: 'text-red-700' },
  cancelled: { icon: '↩️', label: 'Deal Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
};

export function EscrowCard({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId?: string;
}) {
  const meta = msg.meta ?? {};
  const event = (meta.escrowEvent ?? 'committed') as EscrowEvent;
  const orderId = meta.orderId ?? meta.transactionId;
  const buyerId = meta.buyerId ? String(meta.buyerId) : undefined;
  const sellerId = meta.sellerId ? String(meta.sellerId) : undefined;

  const isBuyer = !!currentUserId && currentUserId === buyerId;
  const isSeller = !!currentUserId && currentUserId === sellerId;

  const [busy, setBusy] = useState<null | 'pay' | 'confirm' | 'dispute'>(null);
  const [done, setDone] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const style = EVENT_STYLE[event] ?? EVENT_STYLE.committed;

  const run = async (
    kind: 'pay' | 'confirm' | 'dispute',
    fn: () => Promise<unknown>,
    success: string,
  ) => {
    if (!orderId || busy) return;
    setBusy(kind);
    try {
      await fn();
      toast.success(success);
      setDone(true); // optimistic — bot will post the next milestone
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
  const onPaidNoProof = () =>
    void submitPayment('');

  const onConfirm = () =>
    run(
      'confirm',
      () => marketplaceService.confirmReceipt(orderId!),
      'Receipt confirmed — deal completed!',
    );

  const onDispute = () => {
    if (!orderId) return;
    const reason =
      typeof window !== 'undefined'
        ? window.prompt('Briefly describe the problem for the referee:')?.trim()
        : '';
    if (!reason) return;
    void run('dispute', () => marketplaceService.disputeOrder(orderId, reason), 'Dispute opened — a Neybor Baale will review it.');
  };

  // Which action (if any) does THIS viewer get at THIS milestone?
  const showPay = event === 'committed' && isBuyer && !done;
  const showConfirm = event === 'buyer_paid' && isSeller && !done;
  // Dispute is available to either party while the deal is live (not finished).
  const showDispute =
    (event === 'committed' || event === 'buyer_paid') &&
    (isBuyer || isSeller) &&
    !done;

  const hasActions = showPay || showConfirm || showDispute;

  return (
    <div className={`overflow-hidden rounded-2xl ${style.bg} max-w-[300px] sm:max-w-sm`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${style.text}`}>
        <span className="text-base">{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          NeyborHuud Escrow · {style.label}
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        <p className="text-sm text-gray-700 leading-snug">{msg.content}</p>

        {typeof meta.amount === 'number' && (
          <p className={`mt-1 text-xs font-bold ${style.text}`}>
            ₦{meta.amount.toLocaleString()}
          </p>
        )}

        {meta.proofUrl && event === 'buyer_paid' && (
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
            {showDispute && (
              <button
                type="button"
                onClick={onDispute}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {busy === 'dispute' ? 'Opening…' : 'Dispute'}
              </button>
            )}
          </div>
        )}

        {event === 'completed' && typeof meta.reward === 'number' && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            +{meta.reward} HuudCoins each · trust boosted
          </p>
        )}
      </div>
    </div>
  );
}
