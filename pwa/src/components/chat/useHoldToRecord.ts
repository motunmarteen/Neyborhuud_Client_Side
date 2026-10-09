'use client';

/**
 * Hold-to-talk voice notes (WhatsApp-style):
 *   press and hold the mic → recording starts
 *   release                → the note is sent
 *   slide left            → cancelled
 * A quick tap (released before HOLD_DELAY_MS) is reported via onTap so the
 * caller can open the tap-to-record sheet instead.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { toast } from '@/lib/toast';

export const HOLD_DELAY_MS = 250;
export const MIN_NOTE_MS = 700;
export const MAX_NOTE_MS = 60_000;
export const CANCEL_SLIDE_PX = 110;

export type HoldRecordState = 'idle' | 'starting' | 'recording';

type Options = {
  onRecorded: (file: File, durationMs: number) => void;
  onTap: () => void;
  disabled?: boolean;
};

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''].find(
    (m) => !m || MediaRecorder.isTypeSupported(m),
  ) ?? '';
}

export function useHoldToRecord({ onRecorded, onTap, disabled }: Options) {
  const [state, setState] = useState<HoldRecordState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [slideX, setSlideX] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressRef = useRef<{ x: number; down: boolean } | null>(null);
  // What to do with the recording once MediaRecorder.onstop fires.
  const outcomeRef = useRef<'send' | 'cancel'>('cancel');
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => { onRecordedRef.current = onRecorded; }, [onRecorded]);

  const cleanup = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    tickRef.current = null;
    holdTimerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setState('idle');
    setElapsedMs(0);
    setSlideX(0);
  }, []);

  useEffect(() => () => {
    outcomeRef.current = 'cancel';
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    cleanup();
  }, [cleanup]);

  const finish = useCallback((outcome: 'send' | 'cancel') => {
    outcomeRef.current = outcome;
    const mr = recorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.stop(); // onstop does the rest
    } else {
      cleanup();
    }
  }, [cleanup]);

  const begin = useCallback(async () => {
    setState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Finger already lifted while the permission prompt / mic spin-up ran.
      if (!pressRef.current?.down) {
        stream.getTracks().forEach((t) => t.stop());
        setState('idle');
        return;
      }
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = mr;
      chunksRef.current = [];
      outcomeRef.current = 'cancel';
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const type = mr.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const send = outcomeRef.current === 'send';
        cleanup();
        if (!send) return;
        if (durationMs < MIN_NOTE_MS || blob.size === 0) {
          toast.message('Hold to record, release to send');
          return;
        }
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm';
        onRecordedRef.current(
          new File([blob], `voice-note-${Date.now()}.${ext}`, { type }),
          durationMs,
        );
      };
      mr.start(200);
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setState('recording');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(15);
      tickRef.current = setInterval(() => {
        const ms = Date.now() - startedAtRef.current;
        setElapsedMs(ms);
        if (ms >= MAX_NOTE_MS) finish('send');
      }, 200);
    } catch (err) {
      setState('idle');
      const msg = err instanceof Error ? err.message : '';
      toast.error(/denied|permission|notallowed/i.test(msg)
        ? 'Microphone permission denied. Allow microphone access to send voice notes.'
        : 'Could not start recording');
    }
  }, [cleanup, finish]);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    if (disabled || state !== 'idle') return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    pressRef.current = { x: e.clientX, down: true };
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      void begin();
    }, HOLD_DELAY_MS);
  }, [begin, disabled, state]);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    if (!press?.down || state !== 'recording') return;
    const dx = Math.min(0, e.clientX - press.x);
    setSlideX(dx);
    if (-dx >= CANCEL_SLIDE_PX) {
      pressRef.current = { ...press, down: false };
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.([10, 40, 10]);
      finish('cancel');
    }
  }, [finish, state]);

  const release = useCallback((cancelled: boolean) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press?.down) return;
    if (holdTimerRef.current) {
      // Released before the hold kicked in → treat as a tap.
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      if (!cancelled) onTap();
      return;
    }
    finish(cancelled ? 'cancel' : 'send');
  }, [finish, onTap]);

  return {
    state,
    elapsedMs,
    slideX,
    cancelProgress: Math.min(1, -slideX / CANCEL_SLIDE_PX),
    cancel: () => finish('cancel'),
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => release(false),
      onPointerCancel: () => release(true),
      onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    },
  };
}
