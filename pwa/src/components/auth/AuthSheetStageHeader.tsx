'use client';

import React, { type ComponentType } from 'react';
import {
  MapPin,
  Home,
  BadgeCheck,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  my_location: MapPin,
  location_on: MapPin,
  home: Home,
  badge: BadgeCheck,
  mail: Mail,
  lock: Lock,
  user: User,
  verified_user: ShieldCheck,
};

type AuthSheetStageHeaderProps = {
  icon: string | ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  eyebrow: string;
  title: string;
  meta?: string;
  signal?: string;
  badge?: string;
  error?: string;
};

/** Signup-style sheet header (location / identity stages). */
export function AuthSheetStageHeader({
  icon,
  eyebrow,
  title,
  meta,
  signal,
  badge = 'N',
  error,
}: AuthSheetStageHeaderProps) {
  const IconComp = typeof icon === 'string' ? (ICON_MAP[icon] || HelpCircle) : icon;

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3">
        <div className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-[#00B82E] text-black shadow-lg shadow-[#00B82E]/25">
          {badge ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-[#00B82E] border border-black/10 shadow-sm">
              {badge}
            </span>
          ) : null}
          <IconComp size={24} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#00B82E]">{eyebrow}</p>
            {signal ? (
              <>
                <span className="h-1 w-1 rounded-full bg-[#3B82C4]" aria-hidden />
                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[#3B82C4]">
                  {signal}
                </p>
              </>
            ) : null}
          </div>
          <h2 className="truncate text-[1.35rem] font-black tracking-tight text-[#1D2433]">{title}</h2>
          {meta ? (
            <p className="truncate text-xs font-medium text-[#5B6478]">{meta}</p>
          ) : null}
        </div>
      </div>
      {error ? (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500  text-xs flex items-center gap-2 mb-3.5" role="alert">
          <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );
}
