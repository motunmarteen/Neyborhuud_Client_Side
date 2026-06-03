'use client';

/**
 * VoiceRecorder
 * States: idle → recording → preview → (caller handles send)
 *
 * Uses MediaRecorder + getUserMedia. Max 60 seconds.
 * On "Send", calls onDone with { type: 'audio', content, mediaFile }.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import type { ActionResult } from './ChatActionMenu';

type RecorderState = 'idle' | 'recording' | 'preview';

interface Props {
  onDone: (result: ActionResult) => void;
  onClose: () => void;
}

// Pre-computed heights to avoid calling Math.random() during render
const WAVEFORM_HEIGHTS = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));

// Simple pulsing bar waveform (CSS-only, no AudioContext needed)
function Waveform() {
  return (
    <div className="flex items-end justify-center gap-0.5 h-8">
      {WAVEFORM_HEIGHTS.map((height, i) => (
        <div
          key={i}
          style={{ animationDelay: `${(i * 60) % 400}ms`, height: `${height}%` }}
          className="w-1 rounded-full bg-brand-red animate-bounce"
        />
      ))}
    </div>
  );
}

// Format seconds as M:SS
function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceRecorder({ onDone, onClose }: Props) {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick a supported MIME type
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', ''].find(
        (m) => !m || MediaRecorder.isTypeSupported(m),
      ) ?? '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorder.current = mr;
      chunks.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState('preview');
        stopStream();
      };

      mr.start(200); // collect every 200 ms
      setState('recording');
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s >= 59) {
            stopRecording();
            return 59;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      toast.error(msg.includes('Permission') || msg.includes('denied')
        ? 'Microphone permission denied. Please allow access in your browser settings.'
        : `Could not start recording: ${msg}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const discard = () => {
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
    setAudioBlob(null);
    setElapsed(0);
    setState('idle');
  };

  const handleSend = () => {
    if (!audioBlob) return;
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([audioBlob], `voice-note-${Date.now()}.${ext}`, { type: audioBlob.type });
    onDone({
      type: 'audio',
      content: `🎤 Voice note (${fmt(elapsed)})`,
      mediaFile: file,
      mediaUrl: audioUrl ?? undefined, // local blob URL for immediate playback while uploading
    });
  };

  return (
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel="Record voice note"
      zIndexClass="z-[200]"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="bg-black/60"
      panelClassName="w-full max-w-sm rounded-t-2xl bg-brand-black p-6 shadow-2xl sm:rounded-2xl"
      closeOnBackdrop={state !== 'recording'}
      handleClassName="pt-2 pb-0"
    >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <p className="font-semibold text-[var(--neu-text-muted)]">
            {state === 'idle' ? '🎤 Record Voice Note' : state === 'recording' ? '🔴 Recording…' : '🎤 Preview'}
          </p>
          {state !== 'recording' && (
            <button onClick={onClose} className="text-[var(--neu-text-muted)] hover:text-[var(--neu-text-muted)] text-xl leading-none">×</button>
          )}
        </div>

        {/* Idle */}
        {state === 'idle' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-[var(--neu-text-muted)] text-center">Tap the mic to start recording. Max 60 seconds.</p>
            <button
              onClick={startRecording}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-4xl shadow-lg hover:bg-brand-red active:scale-95 transition-all"
            >
              🎤
            </button>
          </div>
        )}

        {/* Recording */}
        {state === 'recording' && (
          <div className="flex flex-col items-center gap-5 py-2">
            {/* Waveform bars */}
            <div className="flex items-end justify-center gap-0.5 h-10 w-full">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    animationDelay: `${(i * 83) % 600}ms`,
                    height: `${25 + ((i * 37) % 75)}%`,
                  }}
                  className="w-1 flex-shrink-0 rounded-full bg-brand-red animate-pulse"
                />
              ))}
            </div>

            <p className="text-2xl font-mono font-bold text-white tabular-nums">{fmt(elapsed)}</p>
            <p className="text-xs text-[var(--neu-text-muted)]">Max 1 min · tap to stop</p>

            <button
              onClick={stopRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-700 shadow-lg hover:bg-red-600 active:scale-95 transition-all"
            >
              <span className="block h-6 w-6 rounded bg-white" />
            </button>
          </div>
        )}

        {/* Preview */}
        {state === 'preview' && audioUrl && (
          <div className="flex flex-col gap-4">
            <audio controls src={audioUrl} className="w-full rounded-xl" />
            <p className="text-center text-sm text-[var(--neu-text-muted)]">Duration: {fmt(elapsed)}</p>

            <div className="flex gap-3">
              <button
                onClick={discard}
                className="flex-1 rounded-xl bg-brand-black py-3 text-sm font-medium text-[var(--neu-text-muted)] hover:bg-brand-surface transition-colors"
              >
                Delete
              </button>
              <button
                onClick={handleSend}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-brand-blue transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}
    </BottomSheetOverlay>
  );
}
