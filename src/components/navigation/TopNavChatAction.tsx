'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppNavIcon } from '@/components/navigation/AppNavIcon';

export const CHAT_INBOX_HREF = '/friendship?tab=dms';
export function TopNavChatAction() {
  const pathname = usePathname();
  const isOnChat = pathname === '/chat' || pathname === '/friendship';

  return (
    <Link
      href={CHAT_INBOX_HREF}
      className="app-topnav__action"
      aria-label="Chat"
      aria-current={isOnChat ? 'page' : undefined}
    >
      <AppNavIcon name="messages" active={isOnChat} />
    </Link>
  );
}
