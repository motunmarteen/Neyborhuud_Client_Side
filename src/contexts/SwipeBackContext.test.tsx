import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  SwipeBackProvider,
  useSwipeBackOverride,
  useSwipeBackDisabled,
  useSwipeBackTrigger,
} from '@/contexts/SwipeBackContext';

const mockBack = vi.fn();
const mockPush = vi.fn();
let mockPathname = '/settings';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  usePathname: () => mockPathname,
}));

function TestHarness({
  onOverride,
  overrideEnabled = true,
  disabled = false,
}: {
  onOverride?: () => void;
  overrideEnabled?: boolean;
  disabled?: boolean;
}) {
  useSwipeBackOverride(onOverride ?? (() => undefined), Boolean(onOverride && overrideEnabled));
  useSwipeBackDisabled(disabled, 'test-disabled');
  const trigger = useSwipeBackTrigger();
  return (
    <div data-testid="screen">
      <p>Swipe test screen</p>
      <button type="button" onClick={trigger}>
        Programmatic back
      </button>
    </div>
  );
}

function firePointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  opts: {
    clientX: number;
    clientY: number;
    pointerId?: number;
    target?: EventTarget;
  },
) {
  const target = (opts.target ?? document.body) as Element;
  const init = {
    clientX: opts.clientX,
    clientY: opts.clientY,
    pointerId: opts.pointerId ?? 1,
    pointerType: 'touch',
    button: 0,
    bubbles: true,
  };
  if (type === 'pointerdown') fireEvent.pointerDown(target, init);
  if (type === 'pointermove') fireEvent.pointerMove(window, init);
  if (type === 'pointerup') fireEvent.pointerUp(window, init);
}

function swipeRight(fromX: number, toX: number, fromY = 200, toY = 200, target?: EventTarget) {
  firePointer('pointerdown', { clientX: fromX, clientY: fromY, target });
  firePointer('pointermove', { clientX: toX, clientY: toY, target });
  firePointer('pointerup', { clientX: toX, clientY: toY, target });
}

describe('SwipeBackProvider integration', () => {
  beforeEach(() => {
    mockPathname = '/settings';
    mockBack.mockReset();
    mockPush.mockReset();
    vi.stubGlobal('history', { length: 2 });
    document.documentElement.style.setProperty('--safe-left', '0px');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty('--safe-left');
  });

  it('registers window listeners on non-root routes', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { passive: true });
    });
    addSpy.mockRestore();
  });

  it('navigates back after a valid edge swipe', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(8, 120);
    });

    expect(mockBack).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('respects safe-area inset when detecting edge swipes', async () => {
    document.documentElement.style.setProperty('--safe-left', '20px');

    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    act(() => {
      swipeRight(50, 150);
    });
    expect(mockBack).not.toHaveBeenCalled();

    act(() => {
      swipeRight(40, 150);
    });
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('does not navigate for swipes starting outside the edge zone', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(80, 180);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not navigate for short swipes', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(10, 40);
    });

    expect(mockBack).not.toHaveBeenCalled();
  });

  it('does not navigate for mostly vertical swipes', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      firePointer('pointerdown', { clientX: 8, clientY: 100 });
      firePointer('pointermove', { clientX: 90, clientY: 260 });
      firePointer('pointerup', { clientX: 90, clientY: 260 });
    });

    expect(mockBack).not.toHaveBeenCalled();
  });

  it('ignores swipes starting on interactive elements', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    const button = screen.getByRole('button', { name: 'Programmatic back' });

    act(() => {
      swipeRight(8, 120, 200, 200, button);
    });

    expect(mockBack).not.toHaveBeenCalled();
  });

  it('uses the latest override handler when registered', async () => {
    const override = vi.fn();

    render(
      <SwipeBackProvider>
        <TestHarness onOverride={override} />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(6, 110);
    });

    expect(override).toHaveBeenCalledOnce();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('supports programmatic triggerBack', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Programmatic back' }).click();
    });

    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('does not attach gesture listeners on root routes', async () => {
    mockPathname = '/feed';
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(5, 120);
    });

    expect(addSpy).not.toHaveBeenCalledWith('pointerdown', expect.any(Function), { passive: true });
    expect(mockBack).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it('blocks navigation when disabled', async () => {
    render(
      <SwipeBackProvider>
        <TestHarness disabled />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(4, 130);
    });

    expect(mockBack).not.toHaveBeenCalled();
  });

  it('falls back to push when history cannot pop', async () => {
    vi.stubGlobal('history', { length: 1 });

    render(
      <SwipeBackProvider>
        <TestHarness />
      </SwipeBackProvider>,
    );

    await act(async () => {
      swipeRight(12, 140);
    });

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/feed');
  });
});
