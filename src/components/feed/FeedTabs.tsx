/**
 * Feed Tabs Component - Stitch Design
 * Tabs for switching between "For You" and "Following" feeds
 */

interface FeedTabsProps {
    activeTab: 'for-you' | 'following';
    onTabChange: (tab: 'for-you' | 'following') => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    return (
        <div className="neu-socket rounded-2xl overflow-hidden">
            <div className="flex">
                <button
                    onClick={() => onTabChange('for-you')}
                    className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                        activeTab === 'for-you'
                            ? 'font-bold neu-card-sm m-1 rounded-xl'
                            : ''
                    }`}
                    style={{ color: activeTab === 'for-you' ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                >
                    For you
                    {activeTab === 'for-you' && (
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange('following')}
                    className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                        activeTab === 'following'
                            ? 'font-bold neu-card-sm m-1 rounded-xl'
                            : ''
                    }`}
                    style={{ color: activeTab === 'following' ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                >
                    Following
                    {activeTab === 'following' && (
                        <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                    )}
                </button>
            </div>
        </div>
    );
}
