import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        // vmForks has a confirmed, still-open upstream bug (regression in
        // 4.1.0-beta.6, present through at least 4.1.9/5.0.0-beta.4—
        // https://github.com/vitest-dev/vitest/issues/10145): combining a
        // resolve.alias (our '@' -> ./src) with mixed vi.mock styles across
        // files sharing a worker causes the URL-based and ID-based module
        // registry keys to diverge, so whichever file's mock factory for a
        // given module registers first silently wins for every file that
        // runs after it in the same worker — confirmed here directly: two
        // files mocking '@/lib/nativeGeolocation' differently passed in
        // isolation but broke each other when run together, in either
        // order. 'forks' uses a real separate OS process per test file
        // instead of reusing one process with VM-context swaps, which
        // sidesteps the bug entirely (verified: full suite green, no
        // meaningful duration change vs vmForks).
        pool: 'forks',
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
