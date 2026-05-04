'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBlockedUsers, useBlock } from '@/hooks/useBlock';
import Link from 'next/link';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

export default function BlockedUsersPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const { data: blockedData, isLoading } = useBlockedUsers(page);

    const blockedUsers = blockedData?.data?.blockedUsers || [];
    const pagination = blockedData?.data?.pagination;

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden neu-base">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />
                <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <header className="sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--neu-shadow-dark)', background: 'var(--neu-bg)' }}>
                <button onClick={() => router.back()} className="p-1.5 rounded-full hover:opacity-70 transition-opacity">
                    <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-text)' }}>arrow_back</span>
                </button>
                <div>
                    <h1 className="font-bold text-[17px]" style={{ color: 'var(--neu-text)' }}>Blocked NeyburHs</h1>
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                        {pagination?.total ?? 0} blocked
                    </p>
                </div>
            </header>

            {/* Content */}
            <div className="px-4 py-4">
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--neu-card-bg)' }}>
                                <div className="w-11 h-11 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded" />
                                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : blockedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <span className="material-symbols-outlined text-[48px] mb-3" style={{ color: 'var(--neu-text-muted)' }}>shield_person</span>
                        <h3 className="font-semibold text-[15px] mb-1" style={{ color: 'var(--neu-text)' }}>No blocked NeyburHs</h3>
                        <p className="text-sm max-w-[260px]" style={{ color: 'var(--neu-text-muted)' }}>
                            When you block someone, they won&apos;t be able to see your posts or interact with you.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {blockedUsers.map((user) => (
                            <BlockedUserItem key={user._id} user={user} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
                            style={{ background: 'var(--neu-card-bg)', color: 'var(--neu-text)' }}
                        >
                            Previous
                        </button>
                        <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                            {page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
                            style={{ background: 'var(--neu-card-bg)', color: 'var(--neu-text)' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
                </div>
                <RightSidebar />
            </div>
            <BottomNav />
        </div>
    );
}

function BlockedUserItem({ user }: { user: any }) {
    const { unblockUser, isPending } = useBlock(user._id);
    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username;

    return (
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--neu-card-bg)' }}>
            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                <MapPinAvatar
                    src={user.profilePicture || user.avatarUrl}
                    alt={displayName}
                    fallbackInitial={displayName[0]?.toUpperCase() || 'U'}
                    size="sm"
                />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--neu-text)' }}>{displayName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>@{user.username}</p>
                </div>
            </Link>
            <button
                onClick={() => unblockUser()}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
                style={{ borderColor: 'var(--neu-shadow-dark)', color: 'var(--neu-text)' }}
            >
                {isPending ? 'Unblocking...' : 'Unblock'}
            </button>
        </div>
    );
}
