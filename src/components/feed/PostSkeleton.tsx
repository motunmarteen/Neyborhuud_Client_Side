/**
 * PostSkeleton Component - Loading placeholder for posts
 * X.com style shimmer effect
 */

export function PostSkeleton() {
    return (
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 animate-pulse">
            <div className="flex gap-3">
                {/* Avatar skeleton */}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

                {/* Content skeleton */}
                <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
                    </div>

                    {/* Text lines */}
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-12 mt-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * FeedSkeleton - Multiple post skeletons
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </>
    );
}
