'use client';

/**
 * SellerBadge
 *
 * Shows a seller's trust tier on a listing so buyers can judge risk at a glance:
 *   - "New Seller"     — verified but few/no neighbour vouches (capped listings)
 *   - "Vouched Seller" — 3+ neighbours have staked their reputation on them
 *
 * With `showProgress`, an unvouched seller also sees how many more vouches
 * unlock the trusted tier — motivating the vouch loop. Fails silent (renders
 * nothing) while loading or if the status can't be fetched, so it never breaks
 * a card.
 */

import { useSellerStatus } from '@/hooks/useMarketplace';

export function SellerBadge({
  sellerId,
  showProgress = false,
  className = '',
}: {
  sellerId: string | null | undefined;
  /** Show "Get N more vouches…" progress for unvouched sellers. */
  showProgress?: boolean;
  className?: string;
}) {
  const { data: status } = useSellerStatus(sellerId);
  if (!status) return null;

  const vouched = status.tier === 'vouched';

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          vouched
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        {vouched ? '🤝' : '🌱'} {status.badge}
        {status.vouchCount > 0 && (
          <span className="opacity-70">· {status.vouchCount}</span>
        )}
      </span>

      {showProgress && !vouched && status.vouchesNeeded > 0 && (
        <span className="text-[10px] font-medium text-gray-400">
          {status.vouchesNeeded} more vouch{status.vouchesNeeded === 1 ? '' : 'es'} to unlock full store
        </span>
      )}
    </span>
  );
}
