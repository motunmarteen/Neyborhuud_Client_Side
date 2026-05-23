import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { AuthOverlaySheet } from '@/components/auth/AuthOverlaySheet';

function mockSheetLayoutRects() {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
    ) {
        const isPeekZone = this.classList?.contains('auth-signup-bottom-sheet__peek-zone');
        const height = isPeekZone ? 96 : 360;
        return {
            width: 390,
            height,
            top: 480,
            left: 0,
            right: 390,
            bottom: 480 + height,
            x: 0,
            y: 480,
            toJSON: () => ({}),
        } as DOMRect;
    });
}

function portalRoot() {
    return within(document.body);
}

describe('AuthOverlaySheet', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                disconnect() {}
            },
        );
        mockSheetLayoutRects();
    });

    afterEach(() => {
        cleanup();
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('renders draggable sheet when open', async () => {
        render(
            <AuthOverlaySheet
                open
                ariaLabel="Welcome"
                stageKey="welcome"
                onDismiss={() => {}}
                peek={<p>Peek row</p>}
            >
                <p>Welcome body</p>
            </AuthOverlaySheet>,
        );

        await waitFor(() => {
            expect(portalRoot().getByRole('dialog', { name: 'Welcome' })).toHaveAttribute(
                'aria-expanded',
                'true',
            );
        });

        expect(portalRoot().getByText('Welcome body')).toBeInTheDocument();
        expect(portalRoot().getByRole('button', { name: 'Collapse sheet' })).toBeInTheDocument();
    });

    it('collapses and expands via the handle', async () => {
        render(
            <AuthOverlaySheet
                open
                ariaLabel="Welcome"
                stageKey="welcome"
                onDismiss={() => {}}
                peek={<p>Peek row</p>}
            >
                <p>Welcome body</p>
            </AuthOverlaySheet>,
        );

        const handle = await portalRoot().findByRole('button', { name: 'Collapse sheet' });

        await act(async () => {
            fireEvent.pointerDown(handle, { clientY: 100 });
            fireEvent.pointerUp(handle, { clientY: 100 });
        });

        const sheet = portalRoot().getByRole('dialog', { name: 'Welcome' });
        await waitFor(() => {
            expect(sheet).toHaveAttribute('aria-expanded', 'false');
        });

        expect(portalRoot().getByText('Peek row')).toBeInTheDocument();

        const expandHandle = portalRoot().getByRole('button', { name: 'Expand sheet' });
        await act(async () => {
            fireEvent.pointerDown(expandHandle, { clientY: 200 });
            fireEvent.pointerUp(expandHandle, { clientY: 200 });
        });

        await waitFor(() => {
            expect(sheet).toHaveAttribute('aria-expanded', 'true');
        });
    });

    it('calls onDismiss when backdrop is tapped while expanded', async () => {
        const onDismiss = vi.fn();

        render(
            <AuthOverlaySheet open ariaLabel="Welcome" stageKey="welcome" onDismiss={onDismiss}>
                <p>Welcome body</p>
            </AuthOverlaySheet>,
        );

        await portalRoot().findByRole('dialog', { name: 'Welcome' });

        const backdrop = portalRoot().getByRole('button', { name: 'Dismiss' });
        fireEvent.click(backdrop);

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
