/**
 * Currency helpers — every monetary amount returned by the API (Product
 * price, Order amount, MarketplaceOffer amounts, Service pricing, Event
 * ticket price, Job salary, HelpOffer amount, help_request target/received)
 * is an INTEGER number of kobo (1 naira = 100 kobo), never a float.
 *
 * Any amount a user TYPES into a form (listing price, offer amount, counter,
 * salary, ticket price, target amount) is naira — convert with toKobo()
 * before sending it to the API. Any amount READ from the API is kobo —
 * convert with fromKobo() before displaying it, or use formatNaira() to do
 * both the conversion and the display formatting in one call.
 *
 * This does NOT apply to HuudCoin/points values — those are an internal
 * non-monetary ledger, not real money, and are untouched by this module.
 */

const KOBO_PER_NAIRA = 100;

/** Convert a naira amount typed by a user (e.g. 1500.5) to integer kobo. */
export function toKobo(naira: number): number {
  if (!Number.isFinite(naira)) return 0;
  return Math.round(naira * KOBO_PER_NAIRA);
}

/** Convert an integer kobo amount from the API back to naira for display. */
export function fromKobo(kobo: number | null | undefined): number {
  const n = Number(kobo);
  if (!Number.isFinite(n)) return 0;
  return n / KOBO_PER_NAIRA;
}

/**
 * Format an integer kobo amount (as returned by the API) as a naira display
 * string, e.g. 150000 -> "₦1,500". This is the one formatter every component
 * should use for API-sourced amounts.
 */
export function formatNaira(kobo: number | null | undefined): string {
  return `₦${Math.round(fromKobo(kobo)).toLocaleString("en-NG")}`;
}
