"use client";

/**
 * Full-screen form page (create / edit a listing, an event…). Restyled 2026-11-26: the usual app
 * frame and one white card, like the rest of the app. It used to be a see-through "glass" sheet
 * with the background pattern showing through the fields.
 */

import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";

type GlassFormPageProps = {
  title: string;
  subtitle?: string;
  titleId?: string;
  onClose: () => void;
  /** Kept for older callers; every form now uses the normal page width. */
  wide?: boolean;
  children: React.ReactNode;
};

export function GlassFormPage({ title, subtitle, titleId = "glass-form-title", onClose, children }: GlassFormPageProps) {
  return (
    <AppBrowseLayout>
      <section aria-labelledby={titleId} className="rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]">
        <div className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-4">
          <div className="min-w-0">
            <h1 id={titleId} className="font-heading text-xl font-extrabold leading-tight text-navy">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-background text-navy hover:bg-[#E6EAF0]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-5">{children}</div>
      </section>
    </AppBrowseLayout>
  );
}
