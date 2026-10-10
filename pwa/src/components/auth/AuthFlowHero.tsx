import React, { type ComponentType } from 'react';
import {
  Fingerprint,
  Mail,
  Lock,
  ShieldCheck,
  UserCheck,
  Sparkles,
  BadgeCheck,
  Gift,
  Home,
  MapPin,
  Phone,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  fingerprint: Fingerprint,
  mail: Mail,
  lock: Lock,
  verified_user: ShieldCheck,
  how_to_reg: UserCheck,
  auto_awesome: Sparkles,
  badge: BadgeCheck,
  redeem: Gift,
  'redeem-fill': Gift,
  home: Home,
  my_location: MapPin,
  phone: Phone,
  event: Calendar,
  error: AlertCircle,
  check: CheckCircle2,
};

type AuthFlowHeroProps = {
  icon: string | ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  eyebrow: string;
  title: string;
  meta?: string;
  error?: boolean;
  pulse?: boolean;
};

export function AuthFlowHero({ icon, eyebrow, title, meta, error, pulse }: AuthFlowHeroProps) {
  const IconComponent = typeof icon === 'string' ? (ICON_MAP[icon] || HelpCircle) : icon;

  return (
    <div className="auth-flow-hero-card flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.08] shadow-xs">
      <span
        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
          error
            ? 'bg-rose-50 text-rose-600 border border-rose-200'
            : 'bg-emerald-50 text-[#0E8A3E] border border-emerald-200/60'
        }`}
        aria-hidden="true"
      >
        <IconComponent
          size={20}
          strokeWidth={2}
          className={pulse ? 'animate-pulse' : ''}
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[10px] font-extrabold uppercase tracking-wider ${error ? 'text-rose-600' : 'text-[#9AA3B1]'}`}>
          {eyebrow}
        </p>
        <p className="text-sm sm:text-base font-black text-[#1D2433] truncate leading-snug">{title}</p>
        {meta ? <p className="text-[11px] font-semibold text-[#5B6478] truncate mt-0.5">{meta}</p> : null}
      </div>
    </div>
  );
}

