/**
 * Canonical URLs for marketing vs. product.
 * Override with env when staging (e.g. preview domains).
 */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://neyborhuud.com";

export const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || "https://app.neyborhuud.com";

export function appPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${APP_ORIGIN}${p}`;
}

export const CONTACT = {
  support: "mailto:support@neyborhuud.com?subject=NeyborHuud%20support",
  partners: "mailto:partners@neyborhuud.com?subject=NeyborHuud%20partnership",
  safety: "mailto:safety@neyborhuud.com?subject=NeyborHuud%20safety%20question",
};
