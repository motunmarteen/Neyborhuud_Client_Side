/**
 * Right Sidebar Component - X.com Style
 * Shows trending topics, who to follow, and other widgets
 * Only visible on large desktop screens (xl breakpoint and above)
 */

'use client';

import Link from 'next/link';

interface TrendingItem {
    category: string;
    topic: string;
    posts?: string;
}

interface SuggestedUser {
    name: string;
    username: string;
    avatar?: string;
}

export function RightSidebar() {
    // Placeholder trending data - in production this would come from API
    const trending: TrendingItem[] = [
        { category: 'Trending in your area', topic: '#NeighborhoodWatch', posts: '2.4K posts' },
        { category: 'Local Events', topic: 'Community Cleanup Day', posts: '890 posts' },
        { category: 'Trending', topic: '#LocalBusiness', posts: '1.2K posts' },
        { category: 'Safety', topic: 'Traffic Advisory', posts: '456 posts' },
    ];

    // Placeholder suggested users
    const suggestedUsers: SuggestedUser[] = [
        { name: 'Community Board', username: 'communityboard' },
        { name: 'Local News', username: 'localnews' },
        { name: 'Neighborhood Watch', username: 'nwatch' },
    ];

    return (
        <aside className="hidden xl:block fixed right-0 top-0 h-screen w-[350px] 2xl:w-[400px] py-3 px-4 overflow-y-auto">
            {/* Search Bar */}
            <div className="sticky top-0 pt-1 pb-3 bg-white dark:bg-black z-10">
                <div className="relative">
                    <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search NeyborHuud"
                        className="w-full bg-gray-100 dark:bg-gray-900 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green focus:bg-white dark:focus:bg-gray-800 transition-all placeholder:text-gray-500"
                    />
                </div>
            </div>

            {/* What's Happening */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl overflow-hidden mb-4">
                <h2 className="font-bold text-xl px-4 py-3 text-gray-900 dark:text-gray-100">
                    What&apos;s happening
                </h2>

                {trending.map((item, index) => (
                    <Link
                        key={index}
                        href="#"
                        className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <p className="text-xs text-gray-500">{item.category}</p>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{item.topic}</p>
                        {item.posts && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.posts}</p>
                        )}
                    </Link>
                ))}

                <Link
                    href="#"
                    className="block px-4 py-3 text-neon-green hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-sm"
                >
                    Show more
                </Link>
            </div>

            {/* Who to Follow */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl overflow-hidden mb-4">
                <h2 className="font-bold text-xl px-4 py-3 text-gray-900 dark:text-gray-100">
                    Who to follow
                </h2>

                {suggestedUsers.map((user, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-green to-brand-blue flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                    {user.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                            </div>
                        </div>
                        <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                            Follow
                        </button>
                    </div>
                ))}

                <Link
                    href="#"
                    className="block px-4 py-3 text-neon-green hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-sm"
                >
                    Show more
                </Link>
            </div>

            {/* Footer Links */}
            <div className="px-4 text-xs text-gray-500 leading-loose">
                <Link href="#" className="hover:underline">Terms of Service</Link>
                <span className="mx-1">·</span>
                <Link href="#" className="hover:underline">Privacy Policy</Link>
                <span className="mx-1">·</span>
                <Link href="#" className="hover:underline">Cookie Policy</Link>
                <span className="mx-1">·</span>
                <Link href="#" className="hover:underline">Accessibility</Link>
                <span className="mx-1">·</span>
                <Link href="#" className="hover:underline">About</Link>
                <p className="mt-2 text-gray-400">© 2026 NeyborHuud</p>
            </div>
        </aside>
    );
}
