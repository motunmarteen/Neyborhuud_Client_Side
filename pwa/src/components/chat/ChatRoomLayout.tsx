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
    <div className="flex flex-col !h-[100dvh] !min-h-[100dvh] overflow-hidden !bg-white">
      <div className="shrink-0">
        {header}
        {banners ? <div className="border-b border-gray-100">{banners}</div> : null}
      </div>
      <div className="flex-1 overflow-y-auto scroll-smooth !bg-white">
        <div className="mx-auto w-full max-w-[600px] px-1 pb-4">
          {children}
        </div>
      </div>
      {composer}
    </div>
  );
}
