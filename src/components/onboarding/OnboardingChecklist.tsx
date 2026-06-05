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

export function OnboardingChecklist() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data?: OnboardingData }>('/auth/onboarding-status')
      .then((res) => { if (res.data?.data) setData(res.data.data); })
      .catch(() => {});
  }, []);

  if (!data || data.isComplete) return null;

  const nextStep = data.steps.find((s) => !s.completed);

  return (
    <div className="neu-card rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 pt-4 pb-3"
        onClick={() => setCollapsed(!collapsed)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[1.125rem]" aria-hidden="true">checklist</span>
          <span className="text-sm font-bold neu-text">Get started</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {data.completedCount}/{data.totalSteps}
          </span>
        </div>
        <span className="material-symbols-outlined text-[1rem] neu-text-muted" aria-hidden="true">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {/* Progress bar */}
      <div className="mx-4 h-1.5 rounded-full bg-primary/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${data.percentComplete}%` }}
        />
      </div>

      {!collapsed && (
        <ul className="flex flex-col px-4 pb-4 pt-3 gap-2.5">
          {data.steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.completed ? '#' : (STEP_ROUTES[step.id] ?? '#')}
                className={`flex items-center gap-3 group ${step.completed ? 'pointer-events-none' : ''}`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    step.completed
                      ? 'border-primary bg-primary'
                      : 'border-primary/30 group-hover:border-primary/60'
                  }`}
                >
                  {step.completed && (
                    <span className="material-symbols-outlined text-white text-[12px]" aria-hidden="true">check</span>
                  )}
                </span>
                <span className={`text-sm transition-colors ${
                  step.completed
                    ? 'line-through neu-text-muted'
                    : 'neu-text group-hover:text-primary'
                }`}>
                  {step.label}
                </span>
                {step.id === nextStep?.id && !step.completed && (
                  <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                    Next
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
