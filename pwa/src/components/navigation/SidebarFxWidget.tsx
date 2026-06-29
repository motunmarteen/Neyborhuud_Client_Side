'use client';

import { useState, useEffect } from 'react';
import { useExchangeRates, ExchangeRate } from '@/hooks/useExchangeRates';

export function SidebarFxWidget() {
  const { currentRate, loading } = useExchangeRates(3000);
  const [displayRate, setDisplayRate] = useState<ExchangeRate | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!currentRate) return;
    if (!displayRate) {
      setDisplayRate(currentRate);
      return;
    }

    // When currentRate changes, trigger fade out/in
    setVisible(false);
    const timeout = setTimeout(() => {
      setDisplayRate(currentRate);
      setVisible(true);
    }, 220);

    return () => clearTimeout(timeout);
  }, [currentRate, displayRate]);

  return (
    <li className="left-sidebar__nav-item">
      <div className="left-sidebar__link cursor-default">
        <span className="left-sidebar__link-icon" aria-hidden>
          <span className="material-symbols-outlined">currency_exchange</span>
        </span>
        <span className="left-sidebar__link-text min-w-0 flex-1">
          <span className="left-sidebar__link-label block">Exchange Rates</span>
          {loading ? (
            <span className="left-sidebar__link-sub block animate-pulse">Loading rates...</span>
          ) : displayRate ? (
            <span className="left-sidebar__link-sub left-sidebar__link-sub--rotate block truncate" aria-live="polite">
              <span className={`left-sidebar__link-sub-rotate__text${visible ? ' is-visible' : ''}`}>
                1 {displayRate.currency} = ₦{displayRate.rate.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          ) : (
            <span className="left-sidebar__link-sub block truncate" />
          )}
        </span>
      </div>
    </li>
  );
}
