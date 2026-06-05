/** Politely announce a message to screen readers (toasts, confirmations). */
export function announce(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sr:announce', { detail: message }));
}

/** Assertively announce an urgent message to screen readers (SOS, emergency alerts). */
export function announceAlert(message: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sr:alert', { detail: message }));
}
