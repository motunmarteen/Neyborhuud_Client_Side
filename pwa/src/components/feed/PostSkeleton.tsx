'use client';

export function PostSkeleton({ index = 0 }: { index?: number }) {
    const hasMedia = index % 3 === 1;

    return (
        <div
            className="relative w-full bg-white dark:bg-[#121b14] border-b border-black/5 dark:border-white/5 px-4 py-3.5 flex flex-col gap-0 overflow-hidden"
            aria-hidden="true"
        >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="feed-skeleton-shimmer shrink-0 rounded-full w-11 h-11" />
                    <div className="flex flex-col gap-2 min-w-0">
                        <div className="feed-skeleton-shimmer rounded-sm h-3 w-28" />
                        <div className="feed-skeleton-shimmer rounded-sm h-2.5 w-20" />
                    </div>
                </div>
                <div className="feed-skeleton-shimmer rounded-sm w-7 h-7 shrink-0" />
            </div>

            {/* Text lines */}
            <div className="flex flex-col gap-2 mt-3 px-1">
                <div className="feed-skeleton-shimmer rounded-sm h-3 w-full" />
                <div className="feed-skeleton-shimmer rounded-sm h-3 w-11/12" />
                {index % 2 === 0 && (
                    <div className="feed-skeleton-shimmer rounded-sm h-3 w-4/5" />
                )}
            </div>

            {/* Optional media placeholder — every 3rd skeleton */}
            {hasMedia && (
                <div className="feed-skeleton-shimmer -mx-4 mt-3 h-48" />
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                <div className="feed-skeleton-shimmer rounded-sm h-7 w-16" />
                <div className="feed-skeleton-shimmer rounded-sm h-7 w-12" />
                <div className="feed-skeleton-shimmer rounded-sm h-7 w-12" />
                <div className="feed-skeleton-shimmer rounded-sm h-7 w-7" />
                <div className="feed-skeleton-shimmer rounded-sm h-7 w-7" />
            </div>
        </div>
    );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} index={i} />
            ))}
        </div>
    );
}
