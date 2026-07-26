'use client';

/**
 * CallOverlay — full-screen UI for the active/incoming/outgoing call.
 * Reads everything from CallProvider via useCall(); renders nothing when idle.
 *
 * Design intent: rather than a small centered avatar on a flat background
 * (the common pattern), the caller's photo fills the entire screen — shown
 * crisp and full-bleed for audio calls, with a softly blurred, darkened copy
 * of the same photo as an ambient backdrop behind the live video feed for
 * video calls, so the screen never goes "empty" the way a plain black
 * background does before the remote video starts flowing. Controls sit on a
 * frosted-glass bar so they stay legible over any photo. A slide-up panel
 * lets either side send a quick text message without leaving the call, and
 * "Call again" appears for a few seconds after hangup so redialing a dropped
 * or missed call is one tap, not a trip back into the conversation.
 *
 * Minimizing: swiping the full-screen call down (or tapping the minimize
 * button) shrinks it to a small draggable bubble that floats over the rest
 * of the app — the call and its media keep running unchanged in
 * CallProvider throughout, only this component's local "how is it
 * displayed" state changes. This is what lets someone keep messaging (or
 * browsing anything else) while a call stays connected in the background,
 * the same way a native phone call doesn't force you to stare at it.
 */

import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import Image from 'next/image';
import { useCall } from './CallProvider';
import { chatService } from '@/services/chat.service';
import { toast } from 'sonner';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const BUBBLE_SIZE = 64;
const BUBBLE_MARGIN = 12;

/** Small floating draggable bubble shown while the call is minimized. */
function CallBubble({
  avatarUrl,
  initials,
  elapsedLabel,
  isVideo,
  localStream,
  onExpand,
  onHangup,
}: {
  avatarUrl: string | null;
  initials: string;
  elapsedLabel: string;
  isVideo: boolean;
  localStream: MediaStream | null;
  onExpand: () => void;
  onHangup: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = localStream;
  }, [localStream]);

  // Default position: bottom-right, above the frosted-glass bar zone.
  useEffect(() => {
    if (pos || typeof window === 'undefined') return;
    setPos({
      x: window.innerWidth - BUBBLE_SIZE - BUBBLE_MARGIN,
      y: window.innerHeight - BUBBLE_SIZE - 140,
    });
  }, [pos]);

  const clampToViewport = (x: number, y: number) => {
    const maxX = window.innerWidth - BUBBLE_SIZE - BUBBLE_MARGIN;
    const maxY = window.innerHeight - BUBBLE_SIZE - BUBBLE_MARGIN;
    return {
      x: Math.min(Math.max(x, BUBBLE_MARGIN), Math.max(maxX, BUBBLE_MARGIN)),
      y: Math.min(Math.max(y, BUBBLE_MARGIN), Math.max(maxY, BUBBLE_MARGIN)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    if (!pos) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y, moved: false };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    setPos(clampToViewport(d.originX + dx, d.originY + dy));
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    // A drag that barely moved is treated as a tap — re-expand to full screen.
    if (d && !d.moved) onExpand();
    // Snap to whichever edge (left/right) the bubble ended up closer to,
    // like WhatsApp/Messenger's chat heads.
    if (pos && typeof window !== 'undefined') {
      const goRight = pos.x + BUBBLE_SIZE / 2 > window.innerWidth / 2;
      setPos((p) => (p ? { ...p, x: goRight ? window.innerWidth - BUBBLE_SIZE - BUBBLE_MARGIN : BUBBLE_MARGIN } : p));
    }
  };

  if (!pos) return null;

  return (
    <div
      className="fixed z-[310] flex h-16 w-16 touch-none items-center justify-center rounded-full shadow-2xl ring-2 ring-white/30 transition-[left,top] duration-200 ease-out"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="button"
      tabIndex={0}
      aria-label="Return to call"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExpand(); }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-[#0a1a0f]">
        {isVideo && localStream ? (
          <video ref={videoRef} autoPlay playsInline muted className="local-call-preview h-full w-full object-cover" />
        ) : avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/70 via-primary/40 to-[#0a1a0f] text-lg font-black text-white/90">
            {initials || '👤'}
          </div>
        )}
      </div>
      <span className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
        {elapsedLabel}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onHangup(); }}
        aria-label="End call"
        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white shadow-md"
      >
        <span className="material-symbols-outlined text-[0.85rem]" aria-hidden="true">call_end</span>
      </button>
    </div>
  );
}

/** Full-bleed portrait or a generated initials tile — used both as the crisp foreground and (blurred) as the ambient backdrop. */
function PeerPortrait({
  avatarUrl,
  initials,
  className,
}: {
  avatarUrl: string | null;
  initials: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        fill
        sizes="100vw"
        priority
        className={`object-cover ${className ?? ''}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/70 via-primary/40 to-[#0a1a0f] text-[min(28vw,10rem)] font-black text-white/90 ${className ?? ''}`}
    >
      {initials || '👤'}
    </div>
  );
}

export function CallOverlay() {
  const {
    phase,
    call,
    lastCall,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    acceptCall,
    rejectCall,
    hangup,
    toggleMic,
    toggleCamera,
    redial,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatSentFlash, setChatSentFlash] = useState<string | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Swipe-down-to-minimize tracking on the full-screen call surface.
  const swipeRef = useRef<{ startY: number; dy: number } | null>(null);
  const [swipeDy, setSwipeDy] = useState(0);
  const SWIPE_DISMISS_PX = 120;

  const onSwipeDown = (e: ReactPointerEvent) => {
    // Ignore drags that start on an interactive control (buttons, the chat
    // input, etc.) so tapping "End call" doesn't get misread as a swipe.
    const target = e.target as HTMLElement;
    if (target.closest('button, input, form')) return;
    swipeRef.current = { startY: e.clientY, dy: 0 };
  };
  const onSwipeMove = (e: ReactPointerEvent) => {
    const s = swipeRef.current;
    if (!s) return;
    const dy = e.clientY - s.startY;
    if (dy < 0) return; // only allow downward drag
    s.dy = dy;
    setSwipeDy(dy);
  };
  const onSwipeEnd = () => {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (s && s.dy > SWIPE_DISMISS_PX) {
      setMinimized(true);
    }
    setSwipeDy(0);
  };

  // Bind streams to media elements. Because the media elements are ALWAYS
  // mounted (toggled with CSS, never conditionally rendered), the refs are
  // stable and the stream always attaches — this is what fixes the "remote
  // video never shows" bug where the <video> was unmounted when the effect ran.
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    if (!remoteStream) return;

    // Autoplay can be blocked until a user gesture. For the callee this is
    // covered by the accept tap, but for the CALLER remoteStream arrives
    // asynchronously off a socket event (onAccepted), not inside a click
    // handler — play() can be silently rejected there with no visible
    // symptom other than "the call looks connected but nothing is heard."
    // If it's rejected, retry once on the next real tap on the call screen.
    const tryPlay = () => {
      remoteVideoRef.current?.play?.().catch(() => {});
      remoteAudioRef.current?.play?.().catch(() => {});
    };
    tryPlay();

    const retryOnGesture = () => {
      tryPlay();
      window.removeEventListener('pointerdown', retryOnGesture);
    };
    window.addEventListener('pointerdown', retryOnGesture, { once: true });
    return () => window.removeEventListener('pointerdown', retryOnGesture);
  }, [remoteStream]);

  // Route audio to speaker vs. earpiece where the platform allows it
  // (setSinkId is Chromium/Android-only — Safari/iOS silently no-ops, which
  // is fine, it just means the toggle has no effect there rather than erroring).
  useEffect(() => {
    const el = remoteAudioRef.current as (HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }) | null;
    if (!el?.setSinkId) return;
    el.setSinkId(speakerOn ? 'default' : 'communications').catch(() => {});
  }, [speakerOn]);

  // Call timer — runs while active.
  useEffect(() => {
    if (phase !== 'active') {
      setElapsed(0);
      return;
    }
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  // Reset transient UI state whenever we leave the "ended" screen.
  useEffect(() => {
    if (phase === 'idle') {
      setChatOpen(false);
      setChatDraft('');
      setChatSentFlash(null);
      setMinimized(false);
    }
  }, [phase]);

  // A freshly incoming call should always show full-screen, even if a
  // previous call had been minimized — you shouldn't have to go hunt for a
  // new incoming call inside a tiny bubble.
  useEffect(() => {
    if (phase === 'incoming') setMinimized(false);
  }, [phase]);

  const showEndedRedial = phase === 'idle' && !!lastCall;
  if ((phase === 'idle' || !call) && !showEndedRedial) return null;

  const activeSubject = call ?? lastCall!;
  const isVideo = activeSubject.type === 'video';

  // Minimizing only makes sense once a call is actually under way — an
  // incoming ring or the post-hangup "ended"/redial screen always show
  // full-screen regardless of the minimized flag.
  const canMinimize = phase === 'outgoing' || phase === 'ringing' || phase === 'connecting' || phase === 'active';
  if (minimized && canMinimize && call) {
    return (
      <CallBubble
        avatarUrl={activeSubject.peerAvatar}
        initials={activeSubject.peerName.replace(/^@/, '').slice(0, 2).toUpperCase()}
        elapsedLabel={phase === 'active' ? formatDuration(elapsed) : phase === 'ringing' ? 'Ringing…' : phase === 'connecting' ? 'Connecting…' : 'Calling…'}
        isVideo={isVideo}
        localStream={localStream}
        onExpand={() => setMinimized(false)}
        onHangup={hangup}
      />
    );
  }
  const statusText =
    phase === 'incoming'
      ? `Incoming ${activeSubject.type} call`
      : phase === 'outgoing'
        ? 'Calling…'
        : phase === 'ringing'
          ? 'Ringing…'
          : phase === 'connecting'
            ? 'Connecting…'
            : phase === 'active'
              ? formatDuration(elapsed)
              : 'Call ended';

  const initials = activeSubject.peerName
    .replace(/^@/, '')
    .slice(0, 2)
    .toUpperCase();

  // Show remote video only once it's flowing AND this is a video call.
  const showRemoteVideo = isVideo && phase === 'active' && !!remoteStream;

  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    const text = chatDraft.trim();
    if (!text || !activeSubject.conversationId || chatSending) return;
    setChatSending(true);
    try {
      await chatService.sendMessage({ conversationId: activeSubject.conversationId, content: text });
      setChatDraft('');
      setChatSentFlash(text);
      window.setTimeout(() => setChatSentFlash(null), 2200);
      chatInputRef.current?.focus();
    } catch {
      toast.error('Message not sent — you’re still connected on the call.');
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col overflow-hidden bg-black text-white"
      style={{
        transform: swipeDy ? `translateY(${swipeDy}px)` : undefined,
        opacity: swipeDy ? Math.max(1 - swipeDy / (SWIPE_DISMISS_PX * 2.5), 0.4) : undefined,
        transition: swipeDy ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
      }}
      onPointerDown={canMinimize ? onSwipeDown : undefined}
      onPointerMove={canMinimize ? onSwipeMove : undefined}
      onPointerUp={canMinimize ? onSwipeEnd : undefined}
      onPointerCancel={canMinimize ? onSwipeEnd : undefined}
    >
      {/* Minimize handle — a pull-bar affordance plus an explicit button,
          since a hidden swipe gesture alone is easy to miss; tapping either
          shrinks the call to a draggable bubble without ending it. */}
      {canMinimize && (
        <button
          type="button"
          onClick={() => setMinimized(true)}
          aria-label="Minimize call"
          className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 px-6 py-2"
        >
          <span className="h-1 w-10 rounded-full bg-white/40" />
        </button>
      )}

      {/* Ambient backdrop: the peer's own photo, blurred and darkened, so the
          screen is never a flat void while media negotiates or for audio calls. */}
      <div className="absolute inset-0 scale-110">
        <PeerPortrait avatarUrl={activeSubject.peerAvatar} initials={initials} className="blur-2xl brightness-[0.35] saturate-150" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/80" />

      {/* Remote audio — ALWAYS mounted so audio (and audio of video calls)
          plays regardless of UI phase. */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Remote video — ALWAYS mounted; hidden with CSS until it's flowing.
          Conditionally rendering this was the cause of the one-way/black
          remote video: the element didn't exist when the stream bound to it. */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 h-full w-full bg-black object-cover ${
          showRemoteVideo ? '' : 'hidden'
        }`}
      />

      {/* Crisp foreground portrait — audio calls always, video calls until the
          remote feed is actually flowing. Deliberately large and full-bleed
          rather than a small centered circle, so the person you're calling
          is the whole screen, not a detail on it. */}
      {!showRemoteVideo && (
        <div className="absolute inset-0">
          <PeerPortrait avatarUrl={activeSubject.peerAvatar} initials={initials} />
          {/* Soften the top/bottom edges so header text and controls stay legible over any photo. */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />
        </div>
      )}

      {/* Local preview (picture-in-picture) — mounted whenever we have a local
          video track; CSS-hidden if not a video call. */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`local-call-preview absolute right-4 top-16 z-10 h-40 w-28 rounded-2xl border-2 border-white/25 bg-black object-cover shadow-2xl ${
          isVideo && localStream ? '' : 'hidden'
        }`}
      />

      {/* Header: name + status */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 px-6 pt-14 text-center">
        <h2 className="text-[1.7rem] font-black tracking-tight drop-shadow-lg">{activeSubject.peerName}</h2>
        <p className="flex items-center gap-2 text-sm font-semibold text-white/85 drop-shadow">
          {(phase === 'outgoing' || phase === 'ringing' || phase === 'connecting') && (
            <span className="material-symbols-outlined animate-pulse text-[1.1rem]" aria-hidden="true">
              {phase === 'connecting' ? 'sync' : 'call'}
            </span>
          )}
          {statusText}
        </p>
      </div>

      <div className="flex-1" />

      {/* In-call chat: a slide-up panel over the frosted control bar, not a
          separate screen — sending a quick "2 mins away" shouldn't mean
          leaving the call. */}
      {chatOpen && phase !== 'incoming' && (
        <div className="relative z-20 mx-4 mb-3 rounded-2xl border border-white/15 bg-black/55 p-3 backdrop-blur-xl">
          {chatSentFlash ? (
            <p className="px-1 py-1.5 text-sm text-white/80">
              <span className="material-symbols-outlined mr-1 align-middle text-[1rem] text-primary" aria-hidden="true">
                check_circle
              </span>
              Sent: “{chatSentFlash}”
            </p>
          ) : (
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Send a message without hanging up…"
                maxLength={500}
                className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:bg-white/15"
              />
              <button
                type="submit"
                disabled={!chatDraft.trim() || chatSending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform active:scale-95 disabled:opacity-40"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[1.15rem]" aria-hidden="true">
                  {chatSending ? 'hourglass_top' : 'send'}
                </span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12">
        {phase === 'incoming' ? (
          <div className="flex w-full max-w-xs items-center justify-between">
            {/* Decline */}
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2"
              aria-label="Decline call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-xl ring-4 ring-brand-red/20 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">call_end</span>
              </span>
              <span className="text-xs font-semibold">Decline</span>
            </button>
            {/* Accept */}
            <button
              onClick={() => void acceptCall()}
              className="flex flex-col items-center gap-2"
              aria-label="Accept call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-xl ring-4 ring-primary/25 transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">
                  {isVideo ? 'videocam' : 'call'}
                </span>
              </span>
              <span className="text-xs font-semibold">Accept</span>
            </button>
          </div>
        ) : showEndedRedial ? (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => void redial()}
              className="flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[1.2rem]" aria-hidden="true">
                {isVideo ? 'videocam' : 'call'}
              </span>
              Call {activeSubject.peerName.replace(/^@/, '')} again
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/40 px-5 py-4 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-4">
              {/* Mute */}
              <button
                onClick={toggleMic}
                className="flex flex-col items-center gap-1.5"
                aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                    micEnabled ? 'bg-white/12 text-white' : 'bg-white text-[#0a1a0f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">
                    {micEnabled ? 'mic' : 'mic_off'}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-white/70">
                  {micEnabled ? 'Mute' : 'Unmute'}
                </span>
              </button>

              {/* Speaker toggle */}
              <button
                onClick={() => setSpeakerOn((s) => !s)}
                className="flex flex-col items-center gap-1.5"
                aria-label={speakerOn ? 'Switch to earpiece' : 'Switch to speaker'}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                    speakerOn ? 'bg-white text-[#0a1a0f]' : 'bg-white/12 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">
                    {speakerOn ? 'volume_up' : 'hearing'}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-white/70">Speaker</span>
              </button>

              {/* Camera toggle (video calls only) */}
              {isVideo && (
                <button
                  onClick={toggleCamera}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                      cameraEnabled ? 'bg-white/12 text-white' : 'bg-white text-[#0a1a0f]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">
                      {cameraEnabled ? 'videocam' : 'videocam_off'}
                    </span>
                  </span>
                  <span className="text-[10px] font-medium text-white/70">
                    {cameraEnabled ? 'Camera' : 'Off'}
                  </span>
                </button>
              )}

              {/* In-call message */}
              {activeSubject.conversationId && (
                <button
                  onClick={() => {
                    setChatOpen((v) => !v);
                    setChatSentFlash(null);
                  }}
                  className="flex flex-col items-center gap-1.5"
                  aria-label={chatOpen ? 'Close message panel' : 'Send a message'}
                >
                  <span
                    className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                      chatOpen ? 'bg-white text-[#0a1a0f]' : 'bg-white/12 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">chat</span>
                  </span>
                  <span className="text-[10px] font-medium text-white/70">Message</span>
                </button>
              )}

              {/* Hang up */}
              <button
                onClick={hangup}
                className="flex flex-col items-center gap-1.5"
                aria-label="End call"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">call_end</span>
                </span>
                <span className="text-[10px] font-medium text-white/70">End</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
