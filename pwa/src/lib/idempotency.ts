/**
 * Generate a UUID v4 for client-side idempotency keys (chat clientMessageId,
 * marketplace order idempotencyKey). Uses browser crypto when available,
 * otherwise falls back to an RFC 4122-compliant manual generation — no
 * external dependency needed either way.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
