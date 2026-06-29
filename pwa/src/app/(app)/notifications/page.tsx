'use client';

import React, { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
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
    const id = notification.id ?? (notification as any)._id;
    if (!notification.isRead && id) onRead(id);
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  let actorName = notification.data?.actor?.firstName || notification.data?.user?.firstName || notification.data?.actor?.name || notification.data?.user?.name;
  
  if (!actorName && notification.message) {
    const firstWord = notification.message.split(' ')[0];
    if (firstWord && !firstWord.match(/^(someone|a)$/i)) {
      actorName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }

  let displayTitle = notification.title;
  if (actorName && displayTitle.match(/^(Someone|A user)/i)) {
    displayTitle = displayTitle.replace(/^(Someone|A user)/i, actorName);
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors duration-150 border-b border-gray-100 group ${
        notification.isRead ? 'opacity-80' : 'bg-brand-blue/5'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
        notification.isRead ? 'bg-slate-100 text-slate-400' : 'bg-brand-blue/10 text-brand-blue'
      }`}>
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'wght' 300" }}>
          {icon}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className={`text-[14px] ${notification.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'} truncate`}>
          {displayTitle}
          {notification.message && (
            <span className="font-normal text-slate-500 ml-1">
              - {notification.message}
            </span>
          )}
        </p>
        <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">schedule</span>
          {new Date(notification.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-brand-blue flex-shrink-0 mt-2 shadow-sm" />
      )}
    </div>
  );
}

const EmptyState = ({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center bg-white">
    <div className={`w-[64px] h-[64px] rounded-full bg-brand-blue/10 flex items-center justify-center mb-4 shrink-0`}>
      <span className={`material-symbols-outlined text-[32px] text-brand-blue`} style={{ fontVariationSettings: "'wght' 300" }}>{icon}</span>
    </div>
    <h3 className="font-bold text-slate-900 text-[16px] mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{subtitle}</p>
  </div>
);

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsPageInner />
    </Suspense>
  );
}

function NotificationsPageInner() {
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

  const rawNotifications: Notification[] = (data?.data as any)?.notifications ?? (data?.data as any)?.data ?? [];
  const notifications = rawNotifications.filter(n => n.type !== 'message');
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppBrowseLayout
      className="!bg-white !px-0 !pt-0 !min-h-[100dvh]"
      header={
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="py-3 flex flex-col gap-3 mx-auto w-[calc(100%-1.5rem)] max-w-[600px]">
            {/* Filter Tabs (Explore Pill Style) */}
            <div className="flex items-center justify-between w-full pt-1 pb-1">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {(['all', 'unread'] as const).map(f => {
                  const isActive = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {f === 'all' ? 'All' : 'Unread'}
                    </button>
                  );
                })}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 shadow-sm"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex-1 bg-white pb-24 mx-auto w-full sm:w-[calc(100%-1.5rem)] max-w-[600px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-blue rounded-full animate-spin" />
            <span className="text-[14px] font-medium text-gray-500">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState 
            icon={filter === 'unread' ? 'mark_email_read' : 'notifications_off'}
            title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
            subtitle={filter === 'unread' ? 'You have no unread notifications at this time.' : 'When you receive notifications, they will appear here.'}
          />
        ) : (
          <div className="flex flex-col sm:border sm:border-gray-100 sm:rounded-2xl sm:overflow-hidden sm:mt-2">
            {notifications.map((n, i) => (
              <NotificationCard key={n.id ?? (n as any)._id ?? i} notification={n} onRead={id => markRead.mutate(id)} />
            ))}
          </div>
        )}
      </div>
    </AppBrowseLayout>
  );
}
