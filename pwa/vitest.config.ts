import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        pool: 'vmForks',
        maxWorkers: 1,
        testTimeout: 30_000,
        hookTimeout: 30_000,
        coverage: {
            provider: 'v8',
            // Only the files exercised by the existing 12 test files are
            // measured (no `all: true`) — this repo's test suite is small
            // relative to its size, so project-wide coverage would be near
            // zero and not a meaningful gate yet. Threshold set at/just below
            // the current measured baseline on that same scope (62.33%
            // statements / 49.36% branches / 71.42% functions / 66.76%
            // lines) to catch regressions in what IS tested. Ratchet up
            // (and consider `all: true` once coverage is broader) over time.
            thresholds: {
                statements: 55,
                branches: 42,
                functions: 65,
                lines: 60,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
