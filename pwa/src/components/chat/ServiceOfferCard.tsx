'use client';

/**
 * ServiceOfferCard — renders a service booking negotiation event posted into
 * the deal chat (a `type: 'system'` message carrying `meta.bookingAction`)
 * with role-aware action buttons. Mirrors OfferCard, but the thing being
 * haggled is a date/time instead of a price.
 *
 *   Provider (on a new/pending request): Accept · Reject · Propose a different time
 *   Client   (after provider proposes):  Accept time · Propose again · Withdraw
 *
 * Accepting flows the booking into an order on the SAME payment chain as
 * marketplace (the backend posts the next status update as a DealStatusCard
 * in this same thread). The card disables optimistically after an action;
 * the real state advances when the next system message arrives.
 */

import { toast } from 'sonner';
import type { ChatMessage } from '@/types/api';
import { servicesService } from '@/services/services.service';
import { useChatCardAction } from '@/hooks/useChatCardAction';

type BookingAction =
  | 'new'
  | 'accept'
  | 'reject'
  | 'propose'
  | 'withdrawn'
  | 'expired'
  | 'closed';

const STYLE: Record<BookingAction, { icon: string; label: string; bg: string; text: string }> = {
  new: { icon: '📅', label: 'Booking Request', bg: 'bg-blue-50', text: 'text-blue-700' },
  propose: { icon: '↔️', label: 'New Time Proposed', bg: 'bg-amber-50', text: 'text-amber-700' },
  accept: { icon: '✅', label: 'Booking Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  reject: { icon: '❌', label: 'Booking Declined', bg: 'bg-gray-100', text: 'text-gray-600' },
  withdrawn: { icon: '🚫', label: 'Request Withdrawn', bg: 'bg-gray-100', text: 'text-gray-600' },
  expired: { icon: '⌛', label: 'Request Expired', bg: 'bg-gray-100', text: 'text-gray-600' },
  closed: { icon: '📪', label: 'Request Closed', bg: 'bg-gray-100', text: 'text-gray-600' },
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ServiceOfferCard({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId?: string;
}) {
  const meta = msg.meta ?? {};
  const action = (meta.bookingAction ?? 'new') as BookingAction;
  const bookingOfferId = meta.bookingOfferId ? String(meta.bookingOfferId) : undefined;
  const clientId = meta.clientId ? String(meta.clientId) : undefined;
  const providerId = meta.providerId ? String(meta.providerId) : undefined;
  const actorRole = meta.actorRole; // 'client' | 'provider' — who performed THIS event
  const pendingDateTime =
    (meta.counterProposedDateTime as string | null | undefined) ??
    (meta.pendingDateTime as string | null | undefined) ??
    (meta.proposedDateTime as string | undefined);
  const note = typeof meta.note === 'string' ? meta.note.trim() : '';

  const { busy, done, disabled, run } = useChatCardAction(!!bookingOfferId);
  const style = STYLE[action] ?? STYLE.new;

  /** Returns a proposed date/time as an ISO string, or null if the user cancelled/entered garbage. */
  const askDateTime = (): string | null => {
    if (typeof window === 'undefined') return null;
    const defaultVal = pendingDateTime ? new Date(pendingDateTime).toISOString().slice(0, 16) : '';
    const raw = window
      .prompt('Propose a date & time (YYYY-MM-DD HH:MM):', defaultVal.replace('T', ' '))
      ?.trim();
    if (!raw) return null;
    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
      toast.error('Enter a valid future date and time.');
      return null;
    }
    return d.toISOString();
  };

  const onAccept = () =>
    run(
      'accept',
      () => servicesService.respondToBooking(bookingOfferId!, 'accept'),
      'Booking accepted — creating the order…',
    );
  const onReject = () =>
    run('reject', () => servicesService.respondToBooking(bookingOfferId!, 'reject'), 'Booking declined.');
  const onPropose = () => {
    const iso = askDateTime();
    if (iso == null) return;
    void run(
      'propose',
      () => servicesService.respondToBooking(bookingOfferId!, 'propose', iso),
      `Proposed ${formatDateTime(iso)}.`,
    );
  };
  const onWithdraw = () =>
    run('withdraw', () => servicesService.withdrawBooking(bookingOfferId!), 'Request withdrawn.');

  // Role of the current viewer relative to this booking.
  // Prefer an explicit ID match. Fall back to inferring from actorRole only
  // for messages missing clientId/providerId: whoever performed the event is
  // NOT the one who responds next.
  const hasIds = !!(clientId && providerId && currentUserId);
  const viewerIsProvider = hasIds
    ? currentUserId === providerId
    : actorRole === 'client';
  const viewerIsClient = hasIds
    ? currentUserId === clientId
    : actorRole === 'provider';

  const isLive = (action === 'new' || action === 'propose') && !done;

  // Provider responds to a client's new request or their own prior proposal being countered.
  const showProviderActions = isLive && action === 'new' && viewerIsProvider;
  // Client responds to the provider's proposed time.
  const showClientActions = isLive && action === 'propose' && viewerIsClient;

  return (
    <div className={`overflow-hidden rounded-2xl ${style.bg} max-w-[300px] sm:max-w-sm`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${style.text}`}>
        <span className="text-base">{style.icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
          Service Booking · {style.label}
        </span>
      </div>

      <div className="px-3 pb-3 pt-1">
        <p className="text-sm text-gray-700 leading-snug">{msg.content}</p>
        {pendingDateTime && (
          <p className={`mt-1 text-base font-extrabold ${style.text}`}>
            {formatDateTime(pendingDateTime)}
          </p>
        )}
        {note && action === 'new' && (
          <p className="mt-2 rounded-lg bg-white/60 px-2.5 py-2 text-xs italic text-gray-600">
            &ldquo;{note}&rdquo;
          </p>
        )}

        {(showProviderActions || showClientActions) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {showProviderActions && (
              <>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === 'accept' ? 'Accepting…' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={onPropose}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'propose' ? '…' : 'Propose different time'}
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {busy === 'reject' ? '…' : 'Reject'}
                </button>
              </>
            )}
            {showClientActions && (
              <>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy === 'accept' ? 'Accepting…' : 'Accept time'}
                </button>
                <button
                  type="button"
                  onClick={onPropose}
                  disabled={disabled}
                  className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'propose' ? '…' : 'Propose again'}
                </button>
                <button
                  type="button"
                  onClick={onWithdraw}
                  disabled={disabled}
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
            Time agreed — starting the order. Watch this chat for the next step.
          </p>
        )}
      </div>
    </div>
  );
}
