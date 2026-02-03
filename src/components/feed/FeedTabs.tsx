/**
 * Feed Tabs Component - X.com Style
 * Tabs for switching between "For You" and "Following" feeds
 */

interface FeedTabsProps {
    activeTab: 'for-you' | 'following';
    onTabChange: (tab: 'for-you' | 'following') => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    return (
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="flex">
                <button
                    onClick={() => onTabChange('for-you')}
                    className={`flex-1 py-4 text-[15px] font-medium transition-colors relative hover:bg-gray-50 dark:hover:bg-gray-900 ${activeTab === 'for-you'
                            ? 'font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    For you
                    {activeTab === 'for-you' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neon-green rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange('following')}
                    className={`flex-1 py-4 text-[15px] font-medium transition-colors relative hover:bg-gray-50 dark:hover:bg-gray-900 ${activeTab === 'following'
                            ? 'font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Following
                    {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-neon-green rounded-full" />
                    )}
                </button>
            </div>
        </div>
    );
}
