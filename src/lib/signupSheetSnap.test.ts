import { describe, expect, it } from 'vitest';
import { resolveSignupSheetSnap, signupSheetTranslateY } from '@/lib/signupSheetSnap';

describe('resolveSignupSheetSnap', () => {
    const collapseOffset = 200;

    it('stays expanded when collapse offset is zero', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: 120,
                velocityY: 800,
                collapseOffset: 0,
                currentlyCollapsed: false,
            }),
        ).toBe('expanded');
    });

    it('collapses on a strong downward fling', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: 10,
                velocityY: 500,
                collapseOffset,
                currentlyCollapsed: false,
            }),
        ).toBe('collapsed');
    });

    it('expands on a strong upward fling', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: -10,
                velocityY: -500,
                collapseOffset,
                currentlyCollapsed: true,
            }),
        ).toBe('expanded');
    });

    it('collapses when dragged past the midpoint from expanded', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: 120,
                velocityY: 0,
                collapseOffset,
                currentlyCollapsed: false,
            }),
        ).toBe('collapsed');
    });

    it('expands when dragged back near the top from collapsed', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: -150,
                velocityY: 0,
                collapseOffset,
                currentlyCollapsed: true,
            }),
        ).toBe('expanded');
    });

    it('keeps current snap on a small drag', () => {
        expect(
            resolveSignupSheetSnap({
                offsetY: 20,
                velocityY: 0,
                collapseOffset,
                currentlyCollapsed: false,
            }),
        ).toBe('expanded');

        expect(
            resolveSignupSheetSnap({
                offsetY: -20,
                velocityY: 0,
                collapseOffset,
                currentlyCollapsed: true,
            }),
        ).toBe('collapsed');
    });
});

describe('signupSheetTranslateY', () => {
    it('returns collapsed offset only when collapsed', () => {
        expect(signupSheetTranslateY(false, 180)).toBe(0);
        expect(signupSheetTranslateY(true, 180)).toBe(180);
    });
});
