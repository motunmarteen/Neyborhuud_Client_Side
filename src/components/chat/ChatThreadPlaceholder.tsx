/** Static shell for SSR / first paint — must match ChatRoomLayout DOM shape. */
export function ChatThreadPlaceholder() {
  return (
    <div className="chat-room chat-room--thread neu-base" data-chat-room="thread" aria-busy="true">
      <div className="chat-room__frame">
        <div className="chat-room__panel">
          <div className="chat-room__chrome shrink-0">
            <div className="chat-room__header">
              <div className="chat-room__header-inner">
                <div className="chat-room__back mod-inset animate-pulse opacity-60" />
                <div className="flex flex-1 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-white/10 animate-pulse" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
                    <div className="h-3 w-20 rounded-full bg-white/10 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="chat-room__scroll">
            <div className="chat-room__messages chat-room__messages--doodle" />
          </div>
          <div className="chat-room__composer" aria-hidden>
            <div className="chat-room__composer-row opacity-60">
              <div className="h-11 w-11 shrink-0 rounded-full bg-white/10 animate-pulse" />
              <div className="mod-inset h-11 flex-1 animate-pulse rounded-2xl" />
              <div className="h-11 w-11 shrink-0 rounded-full bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
