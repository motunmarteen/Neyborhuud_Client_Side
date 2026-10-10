'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Shield,
  CreditCard,
  ArrowRightLeft,
  Lock,
  Receipt,
  Award,
  Bell,
  Gift,
  Globe,
  Settings,
  Moon,
  Sun,
  LogOut,
  Wallet,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import { toast } from 'sonner';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useAppTheme();
  const { data: stats } = useMyGamificationStats();
  const [copiedId, setCopiedId] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);

  if (!isOpen) return null;

  const residentId = user?.id ? user.id.slice(-8).toUpperCase() : '46492001';
  const username = user?.username || 'MotunMarteen';
  const displayName = `${user?.firstName || 'Motun'} ${user?.lastName || 'Marteen'}`.trim() || username;
  const huudCoins = stats?.totalHuudCoins ?? 150;
  const trustScore = stats?.trustScore ?? 88;

  const handleCopyId = () => {
    navigator.clipboard.writeText(residentId);
    setCopiedId(true);
    toast.success('Resident ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Surface */}
      <div className="relative z-10 w-full max-w-sm h-full bg-white text-[#111814] flex flex-col shadow-2xl overflow-y-auto overscroll-contain border-l border-black/[0.08] animate-in slide-in-from-right duration-250 select-none">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-white/95 backdrop-blur-md border-b border-black/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-[#374151] hover:text-[#111827] transition-colors"
            aria-label="Back"
          >
            <ChevronLeft size={18} />
            <span className="text-xs font-black text-[#111827]">Resident Profile</span>
          </button>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]">NeyborHuud</span>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* User Profile Info Card */}
          <Link
            href={`/profile/${username}`}
            onClick={onClose}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-xs hover:border-[#008A20]/50 transition-all group no-underline"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#008A20] flex items-center justify-center text-base font-black border border-emerald-300/40">
                {user?.firstName?.[0] || 'M'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00D431] ring-2 ring-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#111827] truncate group-hover:text-[#008A20] transition-colors">
                  {displayName}
                </span>
                <Shield size={13} className="text-[#008A20] shrink-0" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-semibold text-[#6B7280]">
                <span>@{username}</span>
                <span>•</span>
                <span>ID: {residentId}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyId();
                  }}
                  className="p-0.5 hover:text-[#008A20] transition-colors"
                  aria-label="Copy Resident ID"
                >
                  {copiedId ? <Check size={11} className="text-[#008A20]" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <ChevronRight size={16} className="text-[#9CA3AF] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          {/* Level & Reputation Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/15 text-amber-600">
                  <Award size={15} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-black/50 block">Tier Status</span>
                  <span className="font-bold text-amber-600">BRONZE IV</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-black/60">
                13.6K XP to SILVER I
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-[#00D431] transition-all duration-500"
                style={{ width: `${Math.min(trustScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Balance & Wallet Card */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[#008A20]" />
                <span className="text-xs font-semibold text-black/60">Total Balance</span>
                <Eli5Tooltip
                  term="Huud Balance"
                  explanation="Your available funds and HuudCredit for peer-to-peer services, marketplace shopping, and community contributions."
                />
              </div>
              <span className="text-lg font-black tracking-tight text-[#111814]">
                ₦{(huudCoins * 25).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Deposit & Withdraw Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/huud-economy/wallet"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#00D431] hover:bg-[#00FF3E] text-black font-bold text-xs transition-all active:scale-[0.98] shadow-sm no-underline"
              >
                <CreditCard size={14} className="stroke-[2.5]" />
                <span>Deposit</span>
              </Link>

              <Link
                href="/huud-economy/wallet"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-[#111814] font-bold text-xs transition-all active:scale-[0.98] border border-black/[0.08] no-underline"
              >
                <Receipt size={14} />
                <span>Withdraw</span>
              </Link>
            </div>

            {/* 6 Quick Action Grid */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/5 text-center">
              <Link
                href="/huud-economy/wallet"
                onClick={onClose}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/[0.03] transition-colors group no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] group-hover:bg-[#00D431]/15 group-hover:text-[#008A20] flex items-center justify-center text-black/70 transition-colors">
                  <CreditCard size={15} />
                </div>
                <span className="text-[10px] font-semibold text-black/70">Buy</span>
              </Link>

              <Link
                href="/marketplace"
                onClick={onClose}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/[0.03] transition-colors group no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] group-hover:bg-[#00D431]/15 group-hover:text-[#008A20] flex items-center justify-center text-black/70 transition-colors">
                  <ArrowRightLeft size={15} />
                </div>
                <span className="text-[10px] font-semibold text-black/70">Swap</span>
              </Link>

              <Link
                href="/safety"
                onClick={onClose}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/[0.03] transition-colors group no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] group-hover:bg-[#00D431]/15 group-hover:text-[#008A20] flex items-center justify-center text-black/70 transition-colors">
                  <Lock size={15} />
                </div>
                <span className="text-[10px] font-semibold text-black/70">Vault Pro</span>
              </Link>

              <Link
                href="/huud-economy/wallet"
                onClick={onClose}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-black/[0.03] transition-colors group no-underline"
              >
                <div className="w-8 h-8 rounded-lg bg-black/[0.04] group-hover:bg-[#00D431]/15 group-hover:text-[#008A20] flex items-center justify-center text-black/70 transition-colors">
                  <Receipt size={15} />
                </div>
                <span className="text-[10px] font-semibold text-black/70">History</span>
              </Link>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm divide-y divide-black/5">
            {/* Do Not Disturb Toggle */}
            <div className="flex items-center justify-between p-3.5">
              <span className="text-xs font-semibold text-black/80">Do Not Disturb</span>
              <button
                type="button"
                onClick={() => setDndEnabled(!dndEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  dndEnabled ? 'bg-[#00D431]' : 'bg-black/15'
                }`}
                aria-label="Toggle Do Not Disturb"
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    dndEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <Link
              href="/notifications"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 hover:bg-black/[0.03] transition-colors no-underline"
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-black/60" />
                <span className="text-xs font-semibold text-black/80">Notification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-[#00D431]/20 text-[#008A20] text-[10px] font-bold">
                  8
                </span>
                <ChevronRight size={16} className="text-black/30" />
              </div>
            </Link>

            {/* Refer and Earn */}
            <Link
              href="/rewards"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 hover:bg-black/[0.03] transition-colors no-underline"
            >
              <div className="flex items-center gap-2.5">
                <Gift size={16} className="text-amber-500" />
                <span className="text-xs font-semibold text-black/80">Refer and Earn</span>
              </div>
              <ChevronRight size={16} className="text-black/30" />
            </Link>
          </div>

          {/* System Settings & Theme Section */}
          <div className="rounded-2xl bg-white border border-black/[0.08] shadow-sm divide-y divide-black/5">
            {/* Global Settings */}
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 hover:bg-black/[0.03] transition-colors no-underline"
            >
              <div className="flex items-center gap-2.5">
                <Settings size={16} className="text-black/60" />
                <span className="text-xs font-semibold text-black/80">Global Settings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={14} className="text-[#008A20]" />
                <ChevronRight size={16} className="text-black/30" />
              </div>
            </Link>

            {/* Language */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Globe size={16} className="text-black/60" />
                <span className="text-xs font-semibold text-black/80">Language</span>
              </div>
              <span className="text-xs font-semibold text-black/50">English</span>
            </div>

            {/* Theme Display */}
            <div className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <Sun size={16} className="text-amber-500" />
                <span className="text-xs font-semibold text-black/80">Theme</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold border border-amber-300">
                <Sun size={12} />
                <span>Daylight</span>
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#EF4444] font-bold text-xs border border-red-100 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
