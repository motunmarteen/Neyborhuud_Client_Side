'use client';

/**
 * Dispatched after HuudCoins balance changes so profile hero stats can refresh.
 */
export const COINS_UPDATED_EVENT = 'neyborhuud:coins-updated';

export function emitCoinsUpdated(detail?: { totalHuudCoins?: number }) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COINS_UPDATED_EVENT, { detail }));
}

/** Local calendar day key for check-in dismiss (Africa/Lagos). */
export function localDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
