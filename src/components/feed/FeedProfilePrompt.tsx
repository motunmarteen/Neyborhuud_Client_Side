'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingData {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  percentComplete: number;
  isComplete: boolean;
}

const STEP_ROUTES: Record<string, string> = {
  email_verified: '/verify-email',
  profile_picture: '/settings',
  bio: '/settings',
  location_set: '/verify-location',
  earn_huudcoins: '/huud-economy',
};

const STEP_ICONS: Record<string, string> = {
  email_verified: 'mark_email_read',
  profile_picture: 'add_a_photo',
  bio: 'edit_note',
  location_set: 'location_on',
  earn_huudcoins: 'toll',
};

export function FeedProfilePrompt() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('feed_profile_prompt_dismissed')) {
      setDismissed(true);
      return;
    }
    apiClient
      .get<{ data?: OnboardingData }>('/auth/onboarding-status')
      .then((res) => { if (res.data?.data) setData(res.data.data); })
      .catch(() => {});
  }, []);

  if (!data || data.isComplete || dismissed) return null;

  const nextStep = data.steps.find((s) => !s.completed);

  function dismiss() {
    sessionStorage.setItem('feed_profile_prompt_dismissed', '1');
    setDismissed(true);
  }

  return (
    <div className="lg:hidden mod-card rounded-2xl p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[1.1rem] shrink-0" aria-hidden="true">person_add</span>
          <span className="text-sm font-bold neu-text truncate">Complete your profile</span>
          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {data.completedCount}/{data.totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss profile prompt"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center neu-text-muted hover:text-brand-red transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
        </button>
      </div>

      {/* Progress bar — inline style required; width is a runtime value, not a static Tailwind class */}
      {/* eslint-disable-next-line react/forbid-component-props */}
      <div className="h-1 rounded-full bg-primary/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${data.percentComplete}%` }}
        />
      </div>

      {/* Horizontally scrollable step pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
        {data.steps.map((step) => (
          <Link
            key={step.id}
            href={step.completed ? '#' : (STEP_ROUTES[step.id] ?? '#')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              step.completed
                ? 'bg-primary/10 text-primary pointer-events-none'
                : step.id === nextStep?.id
                  ? 'mod-chip mod-chip-active text-primary ring-1 ring-primary/30'
                  : 'mod-chip neu-text-muted'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              {step.completed ? 'check_circle' : (STEP_ICONS[step.id] ?? 'radio_button_unchecked')}
            </span>
            <span className={step.completed ? 'line-through opacity-60' : ''}>{step.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
