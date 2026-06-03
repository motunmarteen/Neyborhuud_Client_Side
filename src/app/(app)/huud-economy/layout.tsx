import { Suspense, type ReactNode } from 'react';

export default function HuudEconomyLayout({ children }: { children: ReactNode }) {
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
