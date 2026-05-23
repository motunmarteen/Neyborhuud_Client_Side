import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
        vi.restoreAllMocks();
    });

    it('renders draggable sheet when open', async () => {
        const view = render(
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
            expect(
                within(view.container).getByRole('dialog', { name: 'Welcome' }),
            ).toHaveAttribute('aria-expanded', 'true');
        });

        expect(within(view.container).getByText('Welcome body')).toBeInTheDocument();
        expect(
            within(view.container).getByRole('button', { name: 'Collapse sheet' }),
        ).toBeInTheDocument();
    });

    it('collapses and expands via the handle', async () => {
        const view = render(
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

        const handle = await within(view.container).findByRole('button', { name: 'Collapse sheet' });

        await act(async () => {
            fireEvent.pointerDown(handle, { clientY: 100 });
            fireEvent.pointerUp(handle, { clientY: 100 });
        });

        const sheet = within(view.container).getByRole('dialog', { name: 'Welcome' });
        await waitFor(() => {
            expect(sheet).toHaveAttribute('aria-expanded', 'false');
        });

        expect(within(view.container).getByText('Peek row')).toBeInTheDocument();

        const expandHandle = within(view.container).getByRole('button', { name: 'Expand sheet' });
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

        const view = render(
            <AuthOverlaySheet open ariaLabel="Welcome" stageKey="welcome" onDismiss={onDismiss}>
                <p>Welcome body</p>
            </AuthOverlaySheet>,
        );

        await within(view.container).findByRole('dialog', { name: 'Welcome' });

        const backdrop = within(view.container).getByRole('button', { name: 'Dismiss' });
        fireEvent.click(backdrop);

        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
