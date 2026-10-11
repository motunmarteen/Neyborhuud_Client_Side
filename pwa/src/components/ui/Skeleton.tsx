/**
 * Design foundation F-09: loading placeholders.
 *
 * Light grey shapes in the layout of what is coming, so the page never flashes dark or
 * jumps when content lands. They pulse gently; with reduced motion they stay still.
 * Screen readers hear "Loading" once (role="status" on the wrapper), not every shape.
 */

type SkeletonProps = { className?: string };

/** One shape. Size and corners come from className (default: a text line). */
export function Skeleton({ className = 'h-3 w-full rounded-full' }: SkeletonProps) {
  return <span aria-hidden className={`block animate-pulse bg-[#E3E8EF] motion-reduce:animate-none ${className}`} />;
}

/** Page frame for a loading screen: clears the top and bottom bars, keeps the light background. */
export function SkeletonPage({ children, label = 'Loading' }: { children: React.ReactNode; label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="min-h-screen bg-background pb-[var(--app-bottomnav-h)] pt-[var(--app-topnav-offset)]"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4">{children}</div>
    </div>
  );
}

/** Page title and a row of filter chips. */
export function SkeletonHeader({ chips = 4 }: { chips?: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-7 w-32 rounded-full" />
      {chips > 0 ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: chips }, (_, i) => (
            <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Rows with a round avatar and two lines: chats, notifications, people, settings. */
export function SkeletonList({ rows = 6, square = false }: { rows?: number; square?: boolean }) {
  return (
    <div className="flex flex-col divide-y divide-line overflow-hidden rounded-[22px] bg-white">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className={`h-11 w-11 shrink-0 ${square ? 'rounded-xl' : 'rounded-full'}`} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2 rounded-full" />
            <Skeleton className="h-3 w-3/4 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full-width cards shaped like the post card: author, text, optional photo, actions. */
export function SkeletonCards({ count = 3, photo = true }: { count?: number; photo?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-[22px] bg-white p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
          {photo && i % 2 === 0 ? <Skeleton className="aspect-[4/3] w-full rounded-2xl" /> : null}
          <div className="flex gap-6 pt-1">
            {Array.from({ length: 4 }, (_, k) => (
              <Skeleton key={k} className="h-5 w-10 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** Two-per-row tiles shaped like BrowseTile: marketplace, jobs, services, events. */
export function SkeletonTiles({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-[22px] bg-white">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-3.5 w-4/5 rounded-full" />
            <Skeleton className="h-4 w-1/2 rounded-full" />
            <div className="flex gap-1">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
