'use client';

/**
 * /chat — WhatsApp-Grade Unified Messaging Inbox
 *
 * Built with the NeyborHuud Design Kit & AppBrowseLayout template.
 * Displays all 1:1, Group, and Community conversations with real-time updates.
 */

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, MessageSquarePlus, Users } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { ChatsStream } from '@/components/friendship/ChatsStream';
import { useAuth } from '@/hooks/useAuth';

function ChatInboxContent() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Header Title & Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-black text-[#1D2433]">Chats</h1>
              <p className="text-xs font-medium text-[#5B6478]">
                Direct messages, estate groups & community channels
              </p>
            </div>
            <Link
              href="/friendship?tab=near_me"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00B82E] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#0E8A3E] active:scale-95 transition-all"
            >
              <MessageSquarePlus size={15} />
              <span>New Chat</span>
            </Link>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3B1]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations, neighbors or groups..."
              className="w-full rounded-2xl border border-[#DDE3EC] bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1D2433] placeholder:text-[#9AA3B1] focus:border-[#00B82E] focus:outline-none focus:ring-2 focus:ring-[#00B82E]/20"
            />
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-[#DDE3EC] bg-white shadow-sm">
        <ChatsStream currentUserId={user?.id} search={search} />
      </div>
    </AppBrowseLayout>
  );
}

export default function ChatInboxPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#EEF2F7] animate-pulse" />}>
      <ChatInboxContent />
    </Suspense>
  );
}
