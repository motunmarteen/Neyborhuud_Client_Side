import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HOLD_DELAY_MS, CANCEL_SLIDE_PX, useHoldToRecord } from './useHoldToRecord';

vi.mock('@/lib/toast', () => ({ toast: { message: vi.fn(), error: vi.fn() } }));

class FakeRecorder {
  static isTypeSupported = () => true;
  state: 'inactive' | 'recording' = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['abc'], { type: 'audio/webm' }) });
    this.onstop?.();
  }
}

const stopTrack = vi.fn();

function Harness({ onRecorded, onTap }: { onRecorded: (f: File, ms: number) => void; onTap: () => void }) {
  const v = useHoldToRecord({ onRecorded, onTap });
  return (
    <div>
      <button type="button" aria-label="mic" {...v.handlers} />
      <span data-testid="state">{v.state}</span>
    </div>
  );
}

async function press(btn: HTMLElement, x = 300) {
  fireEvent.pointerDown(btn, { clientX: x, pointerId: 1 });
  await act(async () => {
    vi.advanceTimersByTime(HOLD_DELAY_MS + 10);
  });
  // let getUserMedia resolve
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useHoldToRecord', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) },
    });
    HTMLElement.prototype.setPointerCapture = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    stopTrack.mockReset();
  });

  it('a quick tap opens the recorder sheet and records nothing', async () => {
    const onRecorded = vi.fn();
    const onTap = vi.fn();
    render(<Harness onRecorded={onRecorded} onTap={onTap} />);
    const btn = screen.getByLabelText('mic');
    fireEvent.pointerDown(btn, { clientX: 300, pointerId: 1 });
    fireEvent.pointerUp(btn, { clientX: 300, pointerId: 1 });
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it('hold then release sends the voice note', async () => {
    const onRecorded = vi.fn();
    render(<Harness onRecorded={onRecorded} onTap={vi.fn()} />);
    const btn = screen.getByLabelText('mic');
    await press(btn);
    expect(screen.getByTestId('state').textContent).toBe('recording');
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.pointerUp(btn, { clientX: 300, pointerId: 1 });
    expect(onRecorded).toHaveBeenCalledTimes(1);
    const [file, ms] = onRecorded.mock.calls[0];
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('audio/webm');
    expect(ms).toBeGreaterThanOrEqual(2000);
    expect(stopTrack).toHaveBeenCalled(); // microphone released
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });

  it('sliding left cancels without sending', async () => {
    const onRecorded = vi.fn();
    render(<Harness onRecorded={onRecorded} onTap={vi.fn()} />);
    const btn = screen.getByLabelText('mic');
    await press(btn, 300);
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.pointerMove(btn, { clientX: 300 - CANCEL_SLIDE_PX - 5, pointerId: 1 });
    fireEvent.pointerUp(btn, { clientX: 300 - CANCEL_SLIDE_PX - 5, pointerId: 1 });
    expect(onRecorded).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalled();
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });

  it('a very short hold is discarded', async () => {
    const onRecorded = vi.fn();
    render(<Harness onRecorded={onRecorded} onTap={vi.fn()} />);
    const btn = screen.getByLabelText('mic');
    await press(btn);
    fireEvent.pointerUp(btn, { clientX: 300, pointerId: 1 });
    expect(onRecorded).not.toHaveBeenCalled();
  });
});
