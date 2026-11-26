import type { DealStatus } from "@/services/marketplace.service";

/** Shared status → label/color/icon mapping for deal badges (cards + My Deals). */
export const DEAL_STATUS_META: Record<
  DealStatus,
  { label: string; pill: string; icon: string }
> = {
  offer_pending: { label: "Offer waiting", pill: "bg-status-pending", icon: "schedule" },
  offer_countered: { label: "Counter offer", pill: "bg-status-pending", icon: "sync_alt" },
  committed: { label: "Deal agreed", pill: "bg-brand-blue", icon: "handshake" },
  payment_sent: { label: "Paid", pill: "bg-status-warning", icon: "payments" },
  completed: { label: "Done", pill: "bg-primary", icon: "task_alt" },
  expired: { label: "Expired", pill: "bg-status-neutral", icon: "block" },
};
