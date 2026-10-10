'use client';

/**
 * DealStatusCard — renders a marketplace deal-status update posted to chat (a
 * `type: 'system'` message whose `meta.dealAction` is set), together with the
 * action button the current viewer can take at this stage.
 *
 * NeyborHuud never holds money. These buttons drive manual attestations along
 * the order chain:
 *   accepted       → buyer sees bank details + countdown, taps "I've Paid"
 *   paid           → seller taps "Confirm Payment Received"
 *   paid_confirmed → seller taps "Mark as Sent"
 *   shipped        → buyer taps "Confirm Delivery Received" (completes the deal)
 *
 * The card is role-aware: it only shows an action to the party whose turn it
 * is. It optimistically disables after a tap; the real state advances when the
 * server posts the next status message into the chat.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import type { ChatMessage } from '@/types/api';
import { marketplaceService } from '@/services/marketplace.service';
import { chatService } from '@/services/chat.service';
import { formatNaira } from '@/lib/currency';
import { useChatCardAction } from '@/hooks/useChatCardAction';
import { PaymentCountdown } from './PaymentCountdown';

type DealAction = NonNullable<NonNullable<ChatMessage['meta']>['dealAction']>;

const ACTION_STYLE: Record<
  DealAction,
  { icon: string; label: string; bg: string; text: string }
> = {
  started: { icon: '🤝', label: 'Deal Started', bg: 'bg-blue-50', text: 'text-blue-700' },
  accepted: { icon: '🤝', label: 'Deal Agreed', bg: 'bg-blue-50', text: 'text-blue-700' },
  paid: { icon: '💳', label: 'Payment Sent', bg: 'bg-amber-50', text: 'text-amber-700' },
  paid_confirmed: { icon: '🏦', label: 'Payment Confirmed', bg: 'bg-amber-50', text: 'text-amber-700' },
  shipped: { icon: '🚚', label: 'On The Way', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  completed: { icon: '✅', label: 'Deal Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  cancelled: { icon: '↩️', label: 'Deal Cancelled', bg: 'bg-gray-100', text: 'text-gray-600' },
  disputed: { icon: '⚖️', label: 'Huud Community Dispute', bg: 'bg-rose-50', text: 'text-rose-700' },
};

type Payout = { bankName: string; accountNumber: string; accountName: string };

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
  const isService = meta.dealKind === 'service';

  const isBuyer = !!currentUserId && currentUserId === buyerId;
  const isSeller = !!currentUserId && currentUserId === sellerId;

  const { busy, done, disabled, run, markDone, setBusy } = useChatCardAction(!!orderId);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [showShipForm, setShowShipForm] = useState(false);
  const [tracking, setTracking] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Payment not received / unverified');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setIsDisputing(true);
    try {
      await marketplaceService.disputeOrder(orderId, disputeReason, disputeDetails);
      toast.success('Dispute lodged! Routed to Huud Watch / Elders for community review.');
      setShowDisputeModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit dispute');
    } finally {
      setIsDisputing(false);
    }
  };

  // Bank details ride along in the card's meta on "accepted", so the buyer sees
  // where to pay in the same chat turn the deal is agreed. Older "started"
  // cards predate that and still need the fetch.
  const inlinePayout = (meta.payoutDetails ?? null) as Payout | null;
  const [fetched, setFetched] = useState<Payout | null | 'none'>(null);
  const buyerNeedsAccount =
    isBuyer && (action === 'started' || action === 'accepted' || action === 'paid');
  const needsFetch = buyerNeedsAccount && !inlinePayout;

  useEffect(() => {
    if (!needsFetch || !orderId || fetched !== null) return;
    let cancelled = false;
    marketplaceService
      .getOrderPayoutDetails(orderId)
      .then((res) => {
        if (cancelled) return;
        const data = (res as any)?.data ?? res;
        setFetched(data?.hasPayoutDetails ? data.payoutDetails : 'none');
      })
      .catch(() => {
        if (!cancelled) setFetched('none');
      });
    return () => {
      cancelled = true;
    };
  }, [needsFetch, orderId, fetched]);

  const payout: Payout | null | 'none' = inlinePayout ?? fetched;
  const baseStyle = ACTION_STYLE[action] ?? ACTION_STYLE.started;
  // Service bookings don't ship anything — same stage, different words.
  const style = isService && action === 'shipped'
    ? { ...baseStyle, label: 'Job Started' }
    : baseStyle;

  // "I've Paid" opens the proof picker. If the buyer skips a file, we still
  // let them attest without proof (proof is encouraged, not mandatory).
  const onPaidClick = () => {
    if (disabled || !orderId) return;
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

    // Two-step (upload then attest), so this drives the shared busy state
    // directly rather than going through run().
    setBusy('pay');
    try {
      const res = await chatService.uploadChatMedia(file);
      const proofUrl = res.data?.url ?? res.data?.mediaUrl ?? '';
      await marketplaceService.confirmPayment(orderId, proofUrl);
      toast.success('Payment proof sent. The seller will confirm receipt.');
      markDone();
    } catch (err) {
      toast.error(
        (err as { message?: string })?.message || 'Could not upload proof. Please try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const onPaidNoProof = () =>
    run(
      'pay',
      () => marketplaceService.confirmPayment(orderId!, ''),
      'Marked as paid. The seller will confirm receipt.',
    );

  const onConfirmReceipt = () =>
    run(
      'confirm',
      () => marketplaceService.confirmReceipt(orderId!),
      'Payment confirmed — hand over or ship the item next.',
    );

  const onMarkShipped = () =>
    run(
      'ship',
      () =>
        marketplaceService.markShipped(
          orderId!,
          tracking.trim() ? { trackingNumber: tracking.trim() } : undefined,
        ),
      'Marked as sent. The buyer will confirm delivery.',
    );

  const onConfirmDelivery = () =>
    run(
      'delivered',
      () => marketplaceService.confirmDelivery(orderId!),
      'Delivery confirmed — deal completed!',
    );

  // Which action (if any) does THIS viewer get at THIS stage?
  const showPay = (action === 'started' || action === 'accepted') && isBuyer && !done;
  const showConfirmReceipt = action === 'paid' && isSeller && !done;
  const showShip = action === 'paid_confirmed' && isSeller && !done;
  const showConfirmDelivery = action === 'shipped' && isBuyer && !done;
  const canDispute =
    !!orderId &&
    (isBuyer || isSeller) &&
    ['paid', 'paid_confirmed', 'shipped'].includes(action) &&
    !done;
  const hasActions = showPay || showConfirmReceipt || showShip || showConfirmDelivery || canDispute;

  return (
    <div className={`overflow-hidden rounded-2xl ${style.bg} max-w-[300px] sm:max-w-sm`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${style.text}`}>
        <span className="text-base">{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          {isService ? 'Service Booking' : 'NeyborHuud Deal'} · {style.label}
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        {/* Zero-Escrow Transparency Banner */}
        <div className="mb-2 rounded-xl border border-amber-300/80 bg-amber-500/10 p-2 text-[10px] text-amber-950 leading-snug">
          <p className="font-extrabold flex items-center gap-1 text-amber-900">
            <span>🛡️</span> Zero-Escrow Peer-to-Peer
          </p>
          <p className="mt-0.5 text-amber-900/90 text-[10px]">
            NeyborHuud holds no funds (₦0.00). Transactions and payments are strictly between neighbors at their own risk. Contested deals route to local Huud Watch / Elders for community mediation.
          </p>
        </div>

        <p className="text-sm text-gray-700 leading-snug">{msg.content}</p>

        {isService && typeof meta.serviceTitle === 'string' && (
          <p className="mt-1 text-sm font-bold text-gray-900">{meta.serviceTitle}</p>
        )}
        {isService && typeof meta.scheduledAt === 'string' && (
          <p className="text-xs font-medium text-gray-500">
            {new Date(meta.scheduledAt).toLocaleString('en-NG', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}

        {typeof meta.amount === 'number' && (
          <p className={`mt-1 text-xs font-bold ${style.text}`}>
            {formatNaira(meta.amount)}
          </p>
        )}

        {/* Live payment window — buyer only, and only while it's their move. */}
        {action === 'accepted' && showPay && (
          <PaymentCountdown expiresAt={meta.paymentWindowExpiresAt} />
        )}

        {/* Seller's account for the buyer to pay directly (buyer view only). */}
        {buyerNeedsAccount && payout && payout !== 'none' && (
          <div className="mt-2 rounded-xl border border-black/[0.06] bg-white/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Pay the {isService ? 'provider' : 'seller'} directly
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
            The seller hasn&apos;t added payment details yet. Ask them to set it in Settings before you pay.
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

        {!isService && action === 'shipped' && meta.trackingNumber && (
          <p className="mt-2 rounded-xl border border-black/[0.06] bg-white/70 p-2.5">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">
              Tracking
            </span>
            <span className="text-sm font-bold text-gray-900">
              {String(meta.trackingNumber)}
            </span>
          </p>
        )}

        {action === 'cancelled' && meta.cancelReason === 'payment_window_expired' && (
          <p className="mt-2 text-xs font-medium text-gray-600">
            Payment wasn&apos;t confirmed in time. The listing is back on the market.
          </p>
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
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'pay' ? 'Sending…' : "I've Paid · add proof"}
                </button>
                <button
                  type="button"
                  onClick={onPaidNoProof}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Paid, no proof
                </button>
              </>
            )}

            {showConfirmReceipt && (
              <button
                type="button"
                onClick={onConfirmReceipt}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy === 'confirm' ? 'Confirming…' : 'Confirm Payment Received'}
              </button>
            )}

            {showShip && !showShipForm && isService && (
              <button
                type="button"
                onClick={onMarkShipped}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy === 'ship' ? 'Starting…' : 'Mark Job Started'}
              </button>
            )}
            {showShip && !showShipForm && !isService && (
              <button
                type="button"
                onClick={() => setShowShipForm(true)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                Mark as Sent
              </button>
            )}
            {showShip && showShipForm && !isService && (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Tracking number (optional)"
                  maxLength={120}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onMarkShipped}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy === 'ship' ? 'Sending…' : 'Confirm Sent'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowShipForm(false);
                      setTracking('');
                    }}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showConfirmDelivery && (
              <button
                type="button"
                onClick={onConfirmDelivery}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy === 'delivered'
                  ? 'Confirming…'
                  : isService
                    ? 'Confirm Job Completed'
                    : 'Confirm Delivery Received'}
              </button>
            )}

            {canDispute && (
              <button
                type="button"
                onClick={() => setShowDisputeModal(true)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                ⚖️ Dispute / Huud Watch
              </button>
            )}
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <span>⚖️</span> Community Dispute Mediation
              </div>
              <p className="mt-1 text-[11px] text-gray-600 leading-snug">
                NeyborHuud holds no funds. This will lodge your dispute directly with the <strong>Huud Watch Security Roster & Community Elders</strong> to arbitrate and adjust local TrustOS reputation.
              </p>

              <form onSubmit={handleDisputeSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Dispute Reason
                  </label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Payment not received / unverified">Payment not received / unverified</option>
                    <option value="Item not delivered / service not rendered">Item not delivered / service not rendered</option>
                    <option value="Item defective or counterfeit">Item defective or counterfeit</option>
                    <option value="Counterparty unresponsive">Counterparty unreachable / unresponsive</option>
                    <option value="Suspected fraud or scam">Suspected fraud or scam</option>
                    <option value="Other mutual dispute">Other mutual disagreement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Details for Mediators (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={disputeDetails}
                    onChange={(e) => setDisputeDetails(e.target.value)}
                    placeholder="Provide context for the security watch/elders..."
                    className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    disabled={isDisputing}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDisputing}
                    className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isDisputing ? 'Submitting…' : 'Lodge Dispute'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {action === 'completed' && typeof meta.reward === 'number' && (
          <p className="mt-2 text-xs font-semibold text-emerald-700">
            +{meta.reward} HuudCredit each · trust boosted
          </p>
        )}
      </div>
    </div>
  );
}
