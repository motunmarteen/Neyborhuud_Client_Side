/**
 * Brand naming — keep these two forms distinct:
 * - BRAND_NAME: prose, metadata, buttons, legal (NeyborHuud)
 * - BRAND_LOGO_WORDMARK: visual logotype only, always lowercase (neyborhuud)
 *
 * Use "Huud" (not neyborhuud) for the user's neighborhood / community area.
 */

/** Official product name in UI copy, App Store, metadata, and legal text. */
export const BRAND_NAME = 'NeyborHuud';

/** Logo lockup text only — landing hero wordmark under the pin (`presentation="lockup"`). */
export const BRAND_LOGO_WORDMARK = 'NeyborHuud';

export const BRAND_SUPPORT_EMAIL = 'support@neyborhuud.com';

export const BRAND_WEB_ORIGIN = 'https://neyborhuud.com';

/** Bump when brand UI changes so installed PWAs drop stale cached bundles once. */
export const BRAND_UI_VERSION = 6;
