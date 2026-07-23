/**
 * Role-aware messaging for marketplace negotiation flows.
 *
 * Every offer interaction (new offer, accept, reject, counter) is modelled as
 * a single `OfferEvent` with two render outputs — one for the buyer and one
 * for the seller — so each party always sees a personalised, perspective-
 * correct message ("You placed an offer..." vs. "You received an offer...").
 *
 * Use `getOfferSystemMessage` for in-thread system pills, `getOfferToast` for
 * toast notifications, and `parseLegacyOfferMessage` to re-render legacy
 * emoji-prefixed messages already persisted on the backend.
 *
 * NOTE: All copy is intentionally emoji-free. Pill colour is conveyed via
 * `getOfferPillClass` instead.
 */

import { formatNaira } from "./currency";

export type OfferAction = "new" | "accept" | "reject" | "counter";
export type OfferRole = "buyer" | "seller";

export interface OfferEvent {
  action: OfferAction;
  /** Amount associated with the action (offer, counter, or settled amount). Integer kobo — see lib/currency.ts. */
  amount: number;
  /** The party that initiated the action. */
  actorRole: OfferRole;
}

/** amount is integer kobo (as returned by the API) — see lib/currency.ts. */
export function formatNGN(amount: number | null | undefined): string {
  return formatNaira(amount);
}

/**
 * Long-form, perspective-correct system message rendered in a chat thread.
 */
export function getOfferSystemMessage(
  event: OfferEvent,
  viewerRole: OfferRole,
): string {
  const amt = formatNGN(event.amount);
  const isViewerActor = event.actorRole === viewerRole;

  switch (event.action) {
    case "new":
      // Convention: only buyers initiate "new" offers.
      return isViewerActor
        ? `You placed an offer of ${amt} and are awaiting the seller's response.`
        : `You received an offer of ${amt} from a buyer. You can accept, reject, or counter.`;

    case "accept":
      if (event.actorRole === "seller") {
        return isViewerActor
          ? `You accepted the buyer's offer. Prepare to complete the transaction.`
          : `Your offer has been accepted. You can proceed with the next steps.`;
      }
      // Buyer accepted the seller's counter
      return isViewerActor
        ? `You accepted the seller's counteroffer. You can proceed with the next steps.`
        : `Your counteroffer has been accepted. Prepare to complete the transaction.`;

    case "reject":
      if (event.actorRole === "seller") {
        return isViewerActor
          ? `You declined the buyer's offer.`
          : `Your offer was declined by the seller.`;
      }
      return isViewerActor
        ? `You declined the seller's counteroffer.`
        : `Your counteroffer was declined by the buyer.`;

    case "counter":
      return isViewerActor
        ? `You sent a counteroffer of ${amt}.`
        : `You received a counteroffer of ${amt}. You can accept, reject, or counter.`;
  }
}

/**
 * Short, perspective-correct toast text for the same events.
 */
export function getOfferToast(
  event: OfferEvent,
  viewerRole: OfferRole,
): string {
  const amt = formatNGN(event.amount);
  const isViewerActor = event.actorRole === viewerRole;

  switch (event.action) {
    case "new":
      return isViewerActor
        ? `You placed an offer of ${amt}.`
        : `You received an offer of ${amt}.`;
    case "accept":
      return isViewerActor
        ? `You accepted the offer.`
        : `Your offer was accepted.`;
    case "reject":
      return isViewerActor
        ? `You declined the offer.`
        : `Your offer was declined.`;
    case "counter":
      return isViewerActor
        ? `You sent a counteroffer of ${amt}.`
        : `You received a counteroffer of ${amt}.`;
  }
}

/**
 * Pill colour classes for the in-chat system message, derived from the action.
 */
export function getOfferPillClass(action: OfferAction): string {
  switch (action) {
    case "new":
      return "bg-brand-red900/50 text-brand-red";
    case "accept":
      return "bg-status-success/15 text-status-success";
    case "reject":
      return "bg-status-danger/12 text-status-danger";
    case "counter":
      return "bg-purple-900/50 text-white/90";
  }
}

/**
 * Detect a legacy emoji-prefixed offer system message (as currently emitted by
 * the backend) and infer the structured event so we can re-render it
 * perspective-correctly per viewer.
 *
 * Returns `null` for any message that doesn't match the legacy format — the
 * caller should fall back to rendering `msg.content` verbatim.
 */
export function parseLegacyOfferMessage(content: string): OfferEvent | null {
  if (!content) return null;
  const c = content.trim();

  // Match the first ₦ amount in the message (if any)
  const amtMatch = c.match(/₦\s*([\d,]+(?:\.\d+)?)/);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;

  // Order matters — '↩️' must be tested before naked arrow forms
  if (c.startsWith("💰")) {
    return { action: "new", amount, actorRole: "buyer" };
  }
  if (c.startsWith("✅")) {
    return { action: "accept", amount, actorRole: "seller" };
  }
  if (c.startsWith("❌")) {
    return { action: "reject", amount, actorRole: "seller" };
  }
  if (c.startsWith("↩️") || c.startsWith("↩")) {
    return { action: "counter", amount, actorRole: "seller" };
  }

  return null;
}

/**
 * Resolve a viewer's role for a marketplace conversation/offer given the
 * current user id and the seller id.
 */
export function resolveOfferRole(
  currentUserId: string | undefined | null,
  sellerId: string | undefined | null,
): OfferRole | null {
  if (!currentUserId || !sellerId) return null;
  return currentUserId === sellerId ? "seller" : "buyer";
}

/** Status labels without emojis. */
export const OFFER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Declined",
  countered: "Countered",
  expired: "Expired",
  cancelled: "Cancelled",
};
