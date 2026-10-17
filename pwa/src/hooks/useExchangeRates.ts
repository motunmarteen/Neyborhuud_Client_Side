'use client';

import { useState, useEffect } from 'react';

export interface ExchangeRate {
  currency: string;
  symbol: string;
  rate: number;
}

const CURRENCIES: Omit<ExchangeRate, 'rate'>[] = [
  { currency: 'USD', symbol: '$' },
  { currency: 'GBP', symbol: '£' },
  { currency: 'EUR', symbol: '€' },
  { currency: 'JPY', symbol: '¥' },
  { currency: 'CNY', symbol: '元' },
];

// No made-up fallback rates: when every source fails, nothing is shown rather than old
// numbers dressed up as today's (owner rule: real figures only).

export function useExchangeRates(cycleMs = 3000) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  /** When the shown rates were fetched (null until then). */
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      const sources = [
        `https://api.exchangerate-api.com/v4/latest/USD?t=${Date.now()}`,
        `https://open.er-api.com/v6/latest/USD?t=${Date.now()}`,
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json`,
      ];

      for (const url of sources) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const data = await res.json();
          const r: Record<string, number> = data.rates ?? data.usd ?? {};
          const ngnPerUSD = r['NGN'] ?? r['ngn'] ?? 0;
          if (!ngnPerUSD) continue;

          const parsed = CURRENCIES.map((c) => {
            const foreignPerUSD = r[c.currency] ?? r[c.currency.toLowerCase()] ?? 0;
            const rate = foreignPerUSD
              ? Math.round((ngnPerUSD / foreignPerUSD) * 100) / 100
              : 0;
            return { ...c, rate };
          });

          const live = parsed.filter((p) => p.rate > 0);
          if (live.length) {
            setRates(live);
            setUpdatedAt(new Date());
            setLoading(false);
            return;
          }
        } catch {
          // try next source
        }
      }

      // Keep the last real rates if a refresh fails; show none if there never were any.
      setLoading(false);
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (rates.length === 0) return;
    const interval = setInterval(
      () => setRateIndex((prev) => (prev + 1) % rates.length),
      cycleMs,
    );
    return () => clearInterval(interval);
  }, [rates, cycleMs]);

  return {
    rates,
    currentRate: rates[rateIndex],
    loading,
    updatedAt,
  };
}
