import { Suspense, type ReactNode } from 'react';

/** Suspense wrapper for Local Huud module routes (matches Huud Economy layout). */
function LocalHuudHubLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <div className="mod-card h-24 w-full max-w-[680px] animate-pulse rounded-2xl" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export { LocalHuudHubLayout };
export default LocalHuudHubLayout;
