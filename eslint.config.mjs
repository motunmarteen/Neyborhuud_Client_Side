import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade no-explicit-any to warning instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      // Downgrade unused vars to warning
      '@typescript-eslint/no-unused-vars': 'warn',
      // Downgrade React hooks warnings
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // Downgrade Next.js image warnings
      '@next/next/no-img-element': 'warn',
      // Allow any other rules to be warnings
      'react/no-unescaped-entities': 'warn',
    },
  },
]);

export default eslintConfig;
