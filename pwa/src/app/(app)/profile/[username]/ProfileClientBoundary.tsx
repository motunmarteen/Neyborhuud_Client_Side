'use client';

/**
 * Client-only boundary for the profile page.
 *
 * The profile view (`PageClient`) is a large `'use client'` component whose real
 * content is fetched client-side from the authenticated API. Server-rendering it
 * produces no useful HTML (there is no request-scoped auth token on the server)
 * and, on Vercel's production runtime, one of its many data hooks/imports throws
 * during the on-demand SSR of an un-prerendered username — surfacing as a hard
 * 500 page even though the client render is fine.
 *
 * Loading it via `next/dynamic` with `ssr: false` skips server rendering entirely
 * for this route, so Vercel never executes the fragile server path. This must live
 * in a client component because `ssr: false` dynamic imports are not permitted in
 * Server Components. The parent `page.tsx` stays a Server Component so it can keep
 * exporting `generateStaticParams` / `dynamicParams` for the Capacitor export.
 */

import dynamic from 'next/dynamic';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';

const PageClient = dynamic(() => import('./PageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full flex-col bg-white overflow-hidden">
      <TopNav />
      <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 !mt-0 !pt-0 px-6 py-4 space-y-6">
          <div className="animate-pulse bg-slate-100 h-32 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 h-16 rounded-xl" />
            ))}
          </div>
          <div className="animate-pulse bg-slate-100 h-28 rounded-2xl" />
        </div>
      </div>
      <BottomNav />
    </div>
  ),
});

export default function ProfileClientBoundary() {
  return <PageClient />;
}
