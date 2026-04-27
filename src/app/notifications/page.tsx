'use client';

import React, { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { toast } from 'sonner';
import { Notification } from '@/types/api';
import { useRouter } from 'next/navigation';

const typeIcon: Record<string, string> = {
  like: 'favorite',
  comment: 'comment',
  mention: 'alternate_email',
  follow: 'person_add',
  message: 'chat',
  event: 'event',
  job: 'work',
  system: 'notifications',
};

function NotificationCard({ notification, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const router = useRouter();
  const icon = typeIcon[notification.type] ?? 'notifications';

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-colors ${
        notification.isRead ? 'opacity-60 hover:opacity-80' : 'bg-blue-500/5 hover:bg-blue-500/10'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        notification.isRead ? 'bg-gray-100' : 'bg-blue-500/10'
      }`}>
        <span className={`material-symbols-outlined text-[20px] ${notification.isRead ? 'text-gray-400' : 'text-blue-500'}`}>
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: 'var(--neu-text)' }}>{notification.title}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>{notification.message}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
          {new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsService.getNotifications(1, 50, filter),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('All notifications marked as read');
    },
  });

  const notifications: Notification[] = (data?.data as any)?.notifications ?? (data?.data as any)?.data ?? [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}>
          <LeftSidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Notifications</h1>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                  style={filter !== f ? { color: 'var(--neu-text-muted)' } : undefined}
                >
                  {f === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--neu-card)', border: '1px solid var(--neu-border)' }}>
              {isLoading ? (
                <div className="p-8 text-center" style={{ color: 'var(--neu-text-muted)' }}>Loading notifications…</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-[48px] text-gray-300">notifications_none</span>
                  <p style={{ color: 'var(--neu-text-muted)' }}>
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--neu-border)' }}>
                  {notifications.map(n => (
                    <NotificationCard key={n.id} notification={n} onRead={id => markRead.mutate(id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <Suspense fallback={<div className="h-16" />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
