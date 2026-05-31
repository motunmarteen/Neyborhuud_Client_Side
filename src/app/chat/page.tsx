'use client';

import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { FriendshipChatInbox } from '@/components/friendship/FriendshipChatInbox';

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav />
      <main className="flex-1 pb-24">
        <FriendshipChatInbox />
      </main>
      <BottomNav />
    </div>
  );
}
