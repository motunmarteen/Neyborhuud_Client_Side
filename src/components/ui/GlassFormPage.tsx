"use client";

/**
 * Full-route “modal” shell: doodle + ambient washes + centered glass sheet (offer-dialog family).
 */

import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

type GlassFormPageProps = {
  title: string;
  subtitle?: string;
  titleId?: string;
  onClose: () => void;
  /** Wider sheet for long marketplace listing form */
  wide?: boolean;
  children: React.ReactNode;
};

export function GlassFormPage({ title, subtitle, titleId = "glass-form-title", onClose, wide, children }: GlassFormPageProps) {
  return (
    <div className="doodle-surface relative flex h-screen w-full flex-col overflow-hidden text-brand-black">
      <div
        className="pointer-events-none fixed inset-0 motion-safe:animate-soft-float opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% -15%, rgba(0, 212, 49, 0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 40%, rgba(0, 111, 53, 0.06), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-50 motion-safe:animate-soft-float"
        aria-hidden
        style={{
          animationDelay: "-2s",
          background: "radial-gradient(ellipse 60% 50% at 0% 80%, rgba(0, 212, 49, 0.08), transparent 45%)",
        }}
      />

      <TopNav />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-4 pb-28 sm:px-4 sm:py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`doodle-modal-panel relative z-10 mx-auto w-full shrink-0 overflow-hidden rounded-[24px] border border-[var(--border-light)] shadow-[0_24px_60px_rgba(0,111,53,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset] dark:border-[var(--neu-shadow-dark)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:rounded-[28px] ${wide ? "max-w-2xl" : "max-w-lg"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doodle-modal-panel-wash z-0" aria-hidden />
            <div className="doodle-modal-ambient z-0 motion-safe:animate-soft-float" aria-hidden>
              <div className="doodle-modal-ambient-float" />
            </div>

            <div className="relative z-[1] flex flex-col">
              <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1 w-11 rounded-full bg-black/15 dark:bg-white/25" aria-hidden />
              </div>

              <div
                className="border-b border-[var(--border-light)] px-4 pb-4 pt-2 dark:border-white/10 sm:px-6 sm:pt-4"
                style={{ boxShadow: "0 1px 0 var(--neu-shadow-light)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 id={titleId} className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: "var(--neu-text)" }}>
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="mt-1 text-xs font-medium leading-relaxed text-brand-green-dark/70 dark:text-white/55 sm:text-sm">{subtitle}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mod-chip grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <span className="material-symbols-outlined text-[22px]" style={{ color: "var(--neu-text-secondary)" }}>
                      close
                    </span>
                  </button>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
