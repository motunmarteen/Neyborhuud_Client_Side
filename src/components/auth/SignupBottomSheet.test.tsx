import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SignupBottomSheet } from '@/components/auth/SignupBottomSheet';

describe('SignupBottomSheet', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                disconnect() {}
            },
        );

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 390,
            height: 320,
            top: 500,
            left: 0,
            right: 390,
            bottom: 820,
            x: 0,
            y: 500,
            toJSON: () => ({}),
        } as DOMRect);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders expanded by default with a handle control', async () => {
        const view = render(
            <SignupBottomSheet ariaLabel="Your street" stageKey="location">
                <p>Street details</p>
            </SignupBottomSheet>,
        );

        await waitFor(() => {
            expect(within(view.container).getByRole('dialog', { name: 'Your street' })).toHaveAttribute(
                'aria-expanded',
                'true',
            );
        });

        expect(within(view.container).getByRole('button', { name: 'Collapse sheet' })).toBeInTheDocument();
        expect(screen.getByText('Street details')).toBeInTheDocument();
    });

    it('toggles collapsed state when the handle is tapped', async () => {
        const view = render(
            <SignupBottomSheet ariaLabel="Your street" stageKey="location">
                <p>Street details</p>
            </SignupBottomSheet>,
        );

        await waitFor(() => {
            expect(within(view.container).getByRole('dialog', { name: 'Your street' })).toHaveAttribute(
                'aria-expanded',
                'true',
            );
        });

        const handle = within(view.container).getByRole('button', { name: 'Collapse sheet' });

        await act(async () => {
            fireEvent.pointerDown(handle, { clientY: 100 });
            fireEvent.pointerUp(handle, { clientY: 100 });
        });

        const sheet = within(view.container).getByRole('dialog', { name: 'Your street' });
        await waitFor(() => {
            expect(sheet).toHaveAttribute('aria-expanded', 'false');
        });
        expect(within(view.container).getByRole('button', { name: 'Expand sheet' })).toBeInTheDocument();
        expect(sheet.className).toContain('auth-signup-bottom-sheet--collapsed');

        const expandHandle = within(view.container).getByRole('button', { name: 'Expand sheet' });
        await act(async () => {
            fireEvent.pointerDown(expandHandle, { clientY: 200 });
            fireEvent.pointerUp(expandHandle, { clientY: 200 });
        });

        await waitFor(() => {
            expect(sheet).toHaveAttribute('aria-expanded', 'true');
        });
    });
});
