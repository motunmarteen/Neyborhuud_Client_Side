/**
 * PostSkeleton Component - Loading placeholder for posts
 * Stitch design shimmer effect
 */

export function PostSkeleton() {
    return (
        <div className="neu-card-sm rounded-2xl p-4 animate-pulse">
            <div className="flex gap-3 mb-3">
                {/* Avatar skeleton */}
                <div className="w-10 h-10 rounded-full neu-socket flex-shrink-0" />

                {/* Header skeleton */}
                <div className="flex-1 space-y-2">
                    <div className="h-4 neu-socket rounded w-32" />
                    <div className="h-3 neu-socket rounded w-20" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="space-y-2 mb-4">
                <div className="h-4 neu-socket rounded w-full" />
                <div className="h-4 neu-socket rounded w-5/6" />
                <div className="h-4 neu-socket rounded w-3/4" />
            </div>

            {/* Actions skeleton */}
            <div className="flex items-center gap-8 pt-3">
                <div className="h-4 neu-socket rounded w-14" />
                <div className="h-4 neu-socket rounded w-14" />
                <div className="h-4 neu-socket rounded w-14" />
            </div>
        </div>
    );
}

/**
 * FeedSkeleton - Multiple post skeletons
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </div>
    );
}
