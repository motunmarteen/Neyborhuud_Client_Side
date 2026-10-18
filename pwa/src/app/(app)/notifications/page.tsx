'use client';

/**
 * Notifications (🔔 in the top bar). Phase 4 restyle, 2026-10-18: one list of plain rows (icon,
 * title, message, "5m"), tap a row to open it (it is marked read), chips to narrow the list,
 * "Unread" and "Mark all read" at the top. The bottom bar stays visible.
 * Replaces a page with US dates to the second, ALERT/NEW/INFO tags, a bin icon that only marked
 * items read, and a footer over the bottom bar.
 */

import { Suspense, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { notificationsService } from '@/services/notifications.service';
import type { Notification } from '@/types/api';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { FilterChip } from '@/components/ui/Chip';
import { useTranslation } from '@/lib/i18n';
import { formatTimeAgo } from '@/utils/timeAgo';

type Category = 'all' | 'safety' | 'trade' | 'app';

const isSafety = (type: string) => /sos|emergency|alert|security|incident/.test(type);
const isTrade = (type: string) => /offer|order|job|service|deal|product|market/.test(type);
const isApp = (type: string) => type === 'system' || /milestone|connection|reward|credit|badge/.test(type);

function iconFor(type: string): { icon: string; bg: string } {
  if (isSafety(type)) return { icon: '🚨', bg: 'bg-red-soft' };
  if (isTrade(type)) return { icon: '🛍️', bg: 'bg-amber-soft' };
  if (/message|chat|comment|reply|mention/.test(type)) return { icon: '💬', bg: 'bg-[#E8F0FB]' };
  if (/follow|connection|friend/.test(type)) return { icon: '👋🏾', bg: 'bg-green-soft' };
  if (/reward|credit|badge|milestone/.test(type)) return { icon: '🪙', bg: 'bg-amber-soft' };
  return { icon: '🔔', bg: 'bg-green-soft' };
}

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationsInner />
    </Suspense>
  );
}

function NotificationsInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<Category>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getNotifications(1, 50),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
  };
  const markRead = useMutation({ mutationFn: (id: string) => notificationsService.markAsRead(id), onSuccess: refresh });
  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      refresh();
      toast.success(t('notif.allReadDone'));
    },
  });

  const body = data?.data as { notifications?: Notification[]; data?: Notification[] } | undefined;
  const all: Notification[] = body?.notifications ?? body?.data ?? [];
  const inCategory = all.filter((n) => {
    const type = String(n.type ?? '');
    if (category === 'safety') return isSafety(type);
    if (category === 'trade') return isTrade(type);
    if (category === 'app') return isApp(type);
    return true;
  });
  const shown = unreadOnly ? inCategory.filter((n) => !n.isRead) : inCategory;
  const unread = all.filter((n) => !n.isRead).length;

  const open = (n: Notification) => {
    const id = n.id ?? (n as { _id?: string })._id;
    if (!n.isRead && id) markRead.mutate(id);
    if (n.actionUrl && n.actionUrl.startsWith('/')) router.push(n.actionUrl);
  };

  const chips: { id: Category; label: string }[] = [
    { id: 'all', label: t('notif.c.all') },
    { id: 'safety', label: t('notif.c.safety') },
    { id: 'trade', label: t('notif.c.trade') },
    { id: 'app', label: t('notif.c.app') },
  ];

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="flex flex-col gap-2">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
            {chips.map((c) => (
              <FilterChip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} count={c.id === 'all' ? unread : undefined}>
                {c.label}
              </FilterChip>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              role="switch"
              aria-checked={unreadOnly}
              onClick={() => setUnreadOnly((v) => !v)}
              className="tap-target inline-flex min-h-9 items-center gap-2 text-xs font-extrabold text-navy"
            >
              <span aria-hidden className={`relative h-5 w-9 rounded-full transition-colors ${unreadOnly ? 'bg-primary' : 'bg-[#CBD2DC]'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${unreadOnly ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
              {t('notif.unreadOnly')}
            </button>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unread === 0}
              className="tap-target min-h-9 text-xs font-extrabold text-brand-green-dark disabled:opacity-40"
            >
              {t('notif.markAll')}
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <BrowseEmptyState
          icon="notifications"
          title={t('notif.emptyTitle')}
          description={unreadOnly ? t('notif.emptyUnread') : t('notif.emptyBody')}
          filledIcon
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
          {shown.map((n, i) => {
            const id = n.id ?? (n as { _id?: string })._id ?? `n-${i}`;
            const look = iconFor(String(n.type ?? ''));
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#F6F8FB] ${n.isRead ? '' : 'bg-green-soft/40'}`}
                >
                  <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg ${look.bg}`}>
                    {look.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline gap-2">
                      <span className={`min-w-0 flex-1 truncate text-sm text-navy ${n.isRead ? 'font-bold' : 'font-black'}`}>{n.title}</span>
                      <span className="shrink-0 text-[11px] font-bold text-muted">{formatTimeAgo(n.createdAt)}</span>
                    </span>
                    {n.message ? <span className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-muted">{n.message}</span> : null}
                  </span>
                  {!n.isRead ? (
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={t('notif.new')} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppBrowseLayout>
  );
}
