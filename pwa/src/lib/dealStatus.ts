import type { DealStatus } from "@/services/marketplace.service";

/** Shared status → label/color/icon mapping for deal badges (cards + My Deals). */
export const DEAL_STATUS_META: Record<
  DealStatus,
  { label: string; pill: string; icon: string }
> = {
  offer_pending: { label: "OFFER PENDING", pill: "bg-status-pending", icon: "schedule" },
  offer_countered: { label: "COUNTERED", pill: "bg-status-pending", icon: "sync_alt" },
  committed: { label: "DEAL STARTED", pill: "bg-brand-blue", icon: "handshake" },
  payment_sent: { label: "PAYMENT SENT", pill: "bg-status-warning", icon: "payments" },
  completed: { label: "COMPLETED", pill: "bg-primary", icon: "task_alt" },
  expired: { label: "EXPIRED", pill: "bg-status-neutral", icon: "block" },
};
