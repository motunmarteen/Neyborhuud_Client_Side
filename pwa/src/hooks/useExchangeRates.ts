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

const FALLBACK_RATES: ExchangeRate[] = [
  { currency: 'USD', symbol: '$', rate: 1352.24 },
  { currency: 'GBP', symbol: '£', rate: 1834.16 },
  { currency: 'EUR', symbol: '€', rate: 1594.37 },
  { currency: 'JPY', symbol: '¥', rate: 8.47 },
  { currency: 'CNY', symbol: '元', rate: 197.53 },
];

export function useExchangeRates(cycleMs = 3000) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [rateIndex, setRateIndex] = useState(0);
  const [loading, setLoading] = useState(true);

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

          if (parsed.some((p) => p.rate > 0)) {
            setRates(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // try next source
        }
      }

      setRates(FALLBACK_RATES);
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
  };
}
