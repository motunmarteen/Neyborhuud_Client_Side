import { describe, it, expect } from 'vitest';
import { TYPE_BADGE, EMERGENCY_ACTION_CLS, SIDEBAR_ACCENTS } from '@/lib/brand-styles';

describe('brand-styles', () => {
    it('maps content types to brand token classes only', () => {
        for (const badge of Object.values(TYPE_BADGE)) {
            expect(badge.cls).not.toMatch(/red-500|blue-500|purple-|emerald-|amber-/);
        }
    });

    it('maps emergency actions to brand tokens', () => {
        expect(EMERGENCY_ACTION_CLS.dispute).toContain('brand-red');
        expect(EMERGENCY_ACTION_CLS.acknowledge).toContain('brand-blue');
    });

    it('rotates sidebar accents from brand CSS vars', () => {
        expect(SIDEBAR_ACCENTS.length).toBeGreaterThan(0);
        expect(SIDEBAR_ACCENTS.every((a) => a.startsWith('var(--'))).toBe(true);
    });
});
