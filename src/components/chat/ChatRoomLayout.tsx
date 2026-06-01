'use client';

import { useEffect, type ReactNode } from 'react';

type ChatRoomLayoutProps = {
  header: ReactNode;
  banners?: ReactNode;
  children: ReactNode;
  composer: ReactNode;
};

/**
 * Full-viewport chat thread shell (WhatsApp / Telegram style).
 * Client-only mount — ConversationPage gates with ChatThreadPlaceholder for SSR parity.
 */
export function ChatRoomLayout({ header, banners, children, composer }: ChatRoomLayoutProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="chat-room chat-room--thread neu-base" data-chat-room="thread">
      <div className="chat-room__frame">
        <div className="chat-room__panel">
          <div className="chat-room__chrome shrink-0">
            {header}
            {banners ? <div className="chat-room__banners">{banners}</div> : null}
          </div>
          <div className="chat-room__scroll">{children}</div>
          {composer}
        </div>
      </div>
    </div>
  );
}
