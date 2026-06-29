import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * In dev, skip next/font Google fetch when fonts.googleapis.com is blocked
 * (offline, firewall, slow DNS) — avoids warnings and compile stalls.
 */
const jakartaProd = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: true,
});

export const jakarta =
  process.env.NODE_ENV === "development"
    ? { variable: "font-jakarta-dev" }
    : jakartaProd;
