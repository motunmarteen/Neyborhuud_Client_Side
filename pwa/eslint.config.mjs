import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

// eslint-config-next only enables a handful of jsx-a11y rules (alt-text,
// aria-props, etc) via a config object it registers internally. ESLint's
// flat config forbids registering the same plugin key twice anywhere in the
// array, so instead of adding our own `plugins: { "jsx-a11y": ... }` block
// (which collides), we find Next's own jsx-a11y config object and merge the
// rest of the recommended ruleset into ITS rules, as warnings. This app is
// Nigerian-neighborhood-facing with a wide device/assistive-tech range, so
// keyboard/label/role coverage beyond Next's defaults is worth having, but
// starting as errors would block on ~40 rules across the whole codebase at
// once — tighten individual rules to "error" incrementally later.
const nextVitalsConfigs = Array.isArray(nextVitals) ? nextVitals : [nextVitals];
const jsxA11yConfigBlock = nextVitalsConfigs.find(
  (c) => c && c.plugins && c.plugins["jsx-a11y"],
);
if (!jsxA11yConfigBlock) {
  throw new Error(
    "eslint-config-next no longer registers jsx-a11y the expected way — update eslint.config.mjs",
  );
}
for (const rule of Object.keys(jsxA11y.flatConfigs.recommended.rules)) {
  if (!(rule in jsxA11yConfigBlock.rules)) {
    jsxA11yConfigBlock.rules[rule] = "warn";
  }
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-*/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
    // Native Capacitor project — not part of the TS/React app, has its own
    // build tooling and vendored plugin sources that were never meant to be
    // linted by this config (and don't match its files globs cleanly).
    "android/**",
    "ios/**",
    // Generated PWA files - should not be linted
    "public/sw.js",
    "public/workbox-*.js",
    "public/worker-*.js",
    "public/fallback-*.js",
  ]),
  {
    // Match exactly the glob eslint-config-next uses to register react-hooks/
    // jsx-a11y/etc — .cjs is deliberately excluded (Next's preset doesn't
    // register those plugins for it), so this block must not be broader than
    // that or ESLint errors with "could not find plugin" on any .cjs file
    // (e.g. scripts/kill-dev.cjs) instead of just skipping the rule there.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // Downgrade no-explicit-any to warning instead of error
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade unused vars to warning
      "@typescript-eslint/no-unused-vars": "warn",
      // Downgrade React hooks warnings
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      // Downgrade Next.js image warnings
      "@next/next/no-img-element": "warn",
      // Allow any other rules to be warnings
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
