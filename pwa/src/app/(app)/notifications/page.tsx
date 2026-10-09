'use client';

import React, { useState, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { toast } from 'sonner';
import { Notification } from '@/types/api';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Trash2,
  Check,
  Shield,
  ShoppingBag,
  Bell,
  MessageCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';

type NotificationCategory = 'all' | 'alerts' | 'trade' | 'system';

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsPageInner />
    </Suspense>
  );
}

function NotificationsPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<NotificationCategory>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(1, 50),
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

  const rawNotifications: Notification[] =
    (data?.data as any)?.notifications ?? (data?.data as any)?.data ?? [];

  // Categorize
  const filteredByCategory = rawNotifications.filter((n) => {
    if (category === 'alerts') {
      return (
        n.type.includes('sos') ||
        n.type.includes('emergency') ||
        n.type.includes('alert') ||
        n.type.includes('security')
      );
    }
    if (category === 'trade') {
      return (
        n.type.includes('offer') ||
        n.type.includes('order') ||
        n.type.includes('job') ||
        n.type.includes('service')
      );
    }
    if (category === 'system') {
      return n.type === 'system' || n.type.includes('milestone') || n.type.includes('connection');
    }
    return true;
  });

  const displayNotifications = showUnreadOnly
    ? filteredByCategory.filter((n) => !n.isRead)
    : filteredByCategory;

  const totalUnread = rawNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F6F8F6] text-[#111827] flex flex-col select-none">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-black/[0.08]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-xl hover:bg-black/[0.04] transition-colors text-[#4B5563] hover:text-[#111827]"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xs sm:text-[13px] font-black tracking-tight text-[#111827]">Notifications</h1>
        </div>

        <div className="flex items-center gap-1.5">
          <Eli5Tooltip
            term="Notifications"
            explanation="Neighborhood safety notices, order updates from the market, and local community alerts."
          />
        </div>
      </header>

      {/* 2. SEGMENTED PILL SELECTOR */}
      <div className="px-4 py-2.5 bg-white border-b border-black/[0.08]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'all', label: 'All', badge: totalUnread },
              { id: 'alerts', label: 'Alerts', badge: 0 },
              { id: 'trade', label: 'Transactions', badge: 0 },
              { id: 'system', label: 'System', badge: 0 },
            ] as const
          ).map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  active
                    ? 'bg-emerald-50 text-[#008A20] border border-emerald-200/60 shadow-xs'
                    : 'bg-white text-[#4B5563] hover:text-[#111827] hover:bg-black/[0.04] border border-black/[0.08]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#008A20] text-white text-[9px] font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. NOTIFICATION CARDS LIST */}
      <main className="flex-1 p-3 sm:p-4 max-w-xl w-full mx-auto space-y-2.5 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-xs text-[#6B7280]">Loading notifications…</span>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-white border border-black/[0.08] shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-black/[0.03] border border-black/[0.06] flex items-center justify-center mb-3 text-[#9CA3AF]">
              <Inbox size={22} />
            </div>
            <h3 className="text-xs sm:text-[13px] font-black text-[#111827]">All caught up</h3>
            <p className="text-xs text-[#6B7280] max-w-xs mt-1">
              {showUnreadOnly
                ? 'You have no unread notifications right now.'
                : 'New alerts and trade messages will appear here.'}
            </p>
          </div>
        ) : (
          displayNotifications.map((n) => {
            const id = n.id ?? (n as any)._id;
            const isUnread = !n.isRead;
            const isSafety =
              n.type.includes('sos') ||
              n.type.includes('emergency') ||
              n.type.includes('alert');

            return (
              <div
                key={id}
                className={`group relative rounded-2xl p-3.5 sm:p-4 transition-all bg-white border shadow-xs ${
                  isUnread
                    ? 'border-emerald-300/80 ring-1 ring-emerald-500/20'
                    : 'border-black/[0.08] opacity-90'
                }`}
              >
                {/* Header row: timestamp + unread indicator */}
                <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pb-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#008A20]" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => id && markRead.mutate(id)}
                    className="opacity-40 group-hover:opacity-100 hover:text-red-500 p-1 transition-all"
                    aria-label="Dismiss notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Badge Tag & Title */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        isSafety
                          ? 'bg-red-50 text-red-700 border border-red-200/60'
                          : isUnread
                            ? 'bg-emerald-50 text-[#008A20] border border-emerald-200/60'
                            : 'bg-black/[0.04] text-[#4B5563] border border-black/[0.06]'
                      }`}
                    >
                      {isSafety ? 'ALERT' : isUnread ? 'NEW' : 'INFO'}
                    </span>
                    <h4 className="text-xs sm:text-[13px] font-black text-[#111827] tracking-tight">{n.title}</h4>
                  </div>

                  {n.message && (
                    <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
                      {n.message}
                    </p>
                  )}
                </div>

                {/* Call to Action Button */}
                {n.actionUrl && (
                  <div className="pt-2.5 flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnread && id) markRead.mutate(id);
                        router.push(n.actionUrl!);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-[#00D431] hover:text-black text-[#111827] font-extrabold text-xs transition-all border border-black/[0.08] active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* 4. BOTTOM FIXED FOOTER BAR */}
      <footer className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-black/[0.08] px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between text-xs">
          {/* Show Unread Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                showUnreadOnly ? 'bg-[#008A20]' : 'bg-black/20'
              }`}
              aria-label="Toggle show unread only"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  showUnreadOnly ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="font-semibold text-[#4B5563]">Show unread</span>
          </div>

          {/* Mark All Read */}
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || totalUnread === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-[#008A20] hover:text-emerald-700 disabled:opacity-40 transition-colors"
          >
            <Check size={14} className="stroke-[3]" />
            <span>Mark all as read</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
