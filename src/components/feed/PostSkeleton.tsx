/**
 * PostSkeleton Component - Loading placeholder for posts
 * Stitch design shimmer effect
 */

export function PostSkeleton() {
    return (
        <div className="relative mx-auto h-[90vh] w-full overflow-hidden rounded-none border-y border-white/10 bg-[#030a0b] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] animate-pulse sm:max-w-[480px] sm:rounded-[32px] sm:border">
            <div className="absolute inset-0">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="h-6 w-28 rounded-full bg-white/10" />
                <div className="h-9 w-9 rounded-full bg-white/10" />
            </div>
            <div className="absolute bottom-5 right-3 z-10 flex flex-col gap-3 sm:bottom-6">
                <div className="h-10 w-10 rounded-full bg-white/12" />
                <div className="h-10 w-10 rounded-full bg-white/12" />
                <div className="h-10 w-10 rounded-full bg-white/12" />
                <div className="h-10 w-10 rounded-full bg-white/12" />
            </div>
            <div className="absolute bottom-6 left-4 right-20 z-10 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-white/12" />
                    <div className="h-10 w-36 rounded-full bg-white/10" />
                </div>
                <div className="h-4 w-full rounded-full bg-white/10" />
                <div className="h-4 w-2/3 rounded-full bg-white/10" />
            </div>
        </div>
    );
}

/**
 * FeedSkeleton - Multiple post skeletons
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </div>
    );
}
