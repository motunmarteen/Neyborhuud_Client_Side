'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const adminNavItems = [
  { href: '/admin',         icon: 'dashboard',      label: 'Dashboard' },
  { href: '/admin/users',   icon: 'manage_accounts', label: 'Users' },
  { href: '/admin/reports', icon: 'flag',            label: 'Reports' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.replace('/feed');
    }
  }, [user, isLoading, router]);

  // Show nothing while checking auth
  if (isLoading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f1e]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f0f1e] text-white">
      {/* Admin sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-[#13132a] lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">admin_panel_settings</span>
          <span className="text-sm font-black uppercase tracking-widest text-white">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNavItems.map((item) => {
            const active = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-emerald-600/20 text-emerald-300'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <Link
            href="/feed"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 items-center gap-3 border-b border-white/10 bg-[#13132a] px-4 lg:hidden">
          <span className="material-symbols-outlined text-emerald-400">admin_panel_settings</span>
          <span className="text-sm font-black uppercase tracking-widest">Admin</span>
          <div className="ml-auto flex gap-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
                  (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href))
                    ? 'bg-emerald-600/20 text-emerald-300'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
