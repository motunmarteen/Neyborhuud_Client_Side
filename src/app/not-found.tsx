import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you were looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 bg-soft-bg">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px] text-primary">location_off</span>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-black text-primary">404</h1>
          <h2 className="text-xl font-bold text-charcoal">Page not found</h2>
          <p className="text-sm text-[var(--neu-text-muted)]">
            This street doesn&apos;t exist on NeyborHuud yet. Head back to your Huud.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/feed"
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm text-center transition-opacity hover:opacity-90 active:opacity-80"
          >
            Back to Feed
          </Link>
          <Link
            href="/explore"
            className="w-full py-3 rounded-xl border border-border text-charcoal font-bold text-sm text-center transition-colors hover:bg-black/5"
          >
            Explore NeyborHuud
          </Link>
        </div>
      </div>
    </div>
  );
}
