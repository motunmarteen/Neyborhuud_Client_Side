'use client';

import { useState, useEffect } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const FLAG: Record<string, string> = {
  USD: '🇺🇸',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  JPY: '🇯🇵',
  CNY: '🇨🇳',
};

export function NewsFxStrip() {
  const { rates, loading } = useExchangeRates();
  const [visible, setVisible] = useState(true);

  // Subtle fade when rates first load
  useEffect(() => {
    if (!loading && rates.length > 0) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading, rates.length]);

  return (
    <div className="news-fx-strip" aria-label="Live exchange rates vs Naira">
      <div className="news-fx-strip__label">
        <span className="material-symbols-outlined news-fx-strip__label-icon">currency_exchange</span>
        <span>Live FX</span>
      </div>

      <div className="news-fx-strip__rates">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="news-fx-strip__rate news-fx-strip__rate--skeleton" />
            ))
          : rates.map((r) => (
              <div
                key={r.currency}
                className={`news-fx-strip__rate${visible ? ' news-fx-strip__rate--visible' : ''}`}
              >
                <span className="news-fx-strip__flag">{FLAG[r.currency] ?? '🌐'}</span>
                <span className="news-fx-strip__currency">1 {r.symbol}</span>
                <span className="news-fx-strip__eq">=</span>
                <span className="news-fx-strip__value">
                  ₦{r.rate.toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
