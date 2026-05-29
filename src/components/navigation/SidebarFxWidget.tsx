'use client';

import { useExchangeRates } from '@/hooks/useExchangeRates';

type SidebarFxWidgetProps = {
  variant?: 'default' | 'sky';
};

export function SidebarFxWidget({ variant = 'default' }: SidebarFxWidgetProps) {
  const { currentRate, loading } = useExchangeRates();
  const isSky = variant === 'sky';

  return (
    <section
      className={isSky ? 'left-sidebar__sky-fx' : 'left-sidebar__fx'}
      aria-label="Exchange rates"
    >
      <div className="left-sidebar__fx-lockup">
        <span className="material-symbols-outlined left-sidebar__fx-icon" aria-hidden>
          currency_exchange
        </span>
        <span className="left-sidebar__fx-label">Exchange rates</span>
        {loading ? (
          <div className="left-sidebar__fx-skeleton animate-pulse" aria-hidden />
        ) : currentRate ? (
          <p className="left-sidebar__fx-rate">
            1 {currentRate.currency} = ₦
            {currentRate.rate.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : (
          <p className="left-sidebar__fx-rate left-sidebar__fx-rate--empty" aria-hidden />
        )}
      </div>
    </section>
  );
}
