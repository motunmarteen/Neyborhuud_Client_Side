/**
 * HelpRequestCard Component
 * Displays a help request post with target amount, payment details, progress bar, and hashtags.
 */

'use client';

import { useState, useRef } from 'react';
import { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { contentService } from '@/services/content.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface HelpRequestCardProps {
    post: Post;
}

/** Format Naira amounts: ₦1,000,000 */
function formatNaira(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    return `₦${num.toLocaleString('en-NG')}`;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    financial:  { label: 'Financial',  color: 'text-green-400 bg-green-400/10',  icon: 'account_balance_wallet' },
    medical:    { label: 'Medical',    color: 'text-red-400 bg-red-400/10',      icon: 'local_hospital' },
    food:       { label: 'Food',       color: 'text-orange-400 bg-orange-400/10',icon: 'restaurant' },
    shelter:    { label: 'Shelter',    color: 'text-blue-400 bg-blue-400/10',    icon: 'home' },
    emergency:  { label: 'Emergency',  color: 'text-pink-400 bg-pink-400/10',    icon: 'emergency' },
};

export function HelpRequestCard({ post }: HelpRequestCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const postId = post.id || '';

    const meta = (post.metadata || {}) as Record<string, any>;
    const targetAmount: number | undefined = post.targetAmount ?? meta.targetAmount ?? (post as any).targetAmount;
    const accountDetails = post.helpRequestPayment ?? meta.helpRequestPayment ?? meta.accountDetails ?? (post as any).helpRequestPayment ?? (post as any).accountDetails;
    const helpCategory: string = post.helpCategory ?? meta.helpCategory ?? (post as any).helpCategory ?? '';
    const storedReceived: number = post.amountReceived ?? meta.amountReceived ?? (post as any).amountReceived ?? 0;

    const categoryConfig = CATEGORY_CONFIG[helpCategory];
    const isOwner = !!(user && (user.id === post.author?.id || (user as any)._id === post.author?.id));

    // Local UI state
    const [copied, setCopied] = useState(false);
    const [showUpdateReceived, setShowUpdateReceived] = useState(false);
    const [receivedInput, setReceivedInput] = useState(String(storedReceived || ''));
    const [localReceived, setLocalReceived] = useState<number>(storedReceived);
    const receivedInputRef = useRef<HTMLInputElement>(null);

    // Derived progress
    const progressPct = targetAmount && targetAmount > 0
        ? Math.min(100, Math.round((localReceived / targetAmount) * 100))
        : null;

    const likeMutation = useMutation({
        mutationFn: () =>
            post.isLiked ? contentService.unlikePost(postId) : contentService.likePost(postId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['helpRequest'] });
            queryClient.setQueriesData({ queryKey: ['helpRequest'] }, (old: any) => {
                if (!old?.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        helpRequests: (page.helpRequests || []).map((p: Post) => {
                            if (p.id !== postId) return p;
                            const wasLiked = p.isLiked === true;
                            return { ...p, isLiked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) };
                        }),
                    })),
                };
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const updateReceivedMutation = useMutation({
        mutationFn: (newAmount: number) =>
            contentService.updateHelpRequestAmount(postId, newAmount),
        onSuccess: (_, newAmount) => {
            setLocalReceived(newAmount);
            setShowUpdateReceived(false);
            queryClient.invalidateQueries({ queryKey: ['helpRequest'] });
            queryClient.invalidateQueries({ queryKey: ['locationFeed'] });
        },
    });

    const handleCopyAccount = (e: React.MouseEvent) => {
        e.stopPropagation();
        const acct = accountDetails?.accountNumber;
        if (!acct) return;
        navigator.clipboard.writeText(String(acct)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSaveReceived = (e: React.MouseEvent) => {
        e.stopPropagation();
        const num = parseFloat(receivedInput.replace(/,/g, ''));
        if (isNaN(num) || num < 0) return;
        updateReceivedMutation.mutate(num);
    };

    const isLiked = post.isLiked === true;
    const mediaUrls = (Array.isArray(post.media) ? post.media : []) as string[];
    const location = post.location as any;

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button') && !target.closest('input')) {
            router.push(`/post/${postId}`);
        }
    };

    return (
        <article
            className="neu-card-sm rounded-2xl overflow-hidden hover:opacity-95 active:scale-[0.995] transition-all cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="p-4">
                {/* Row 1: category badge + location + time */}
                <div className="flex items-center justify-between mb-3">
                    {categoryConfig && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${categoryConfig.color}`}>
                            <span className="material-symbols-outlined text-[13px]">{categoryConfig.icon}</span>
                            {categoryConfig.label}
                        </span>
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {location && (location.lga || location.state) && (
                            <span className="text-[11px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                <span className="material-symbols-outlined text-[13px]">location_on</span>
                                {location.lga || location.state}
                            </span>
                        )}
                        <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                            {formatTimeAgo(post.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Row 2: avatar + author */}
                <div className="flex items-center gap-2.5 mb-3">
                    <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                        <MapPinAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="sm" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/profile/${post.author?.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[13px] font-semibold hover:underline block truncate"
                            style={{ color: 'var(--neu-text)' }}
                        >
                            {post.author?.name}
                        </Link>
                        {post.author?.username && (
                            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                                @{post.author.username}
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 3: hashtags + body inline */}
                <div className="mb-3">
                    <p className="text-[14px] leading-6 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text-muted)' }}>
                        <span className="font-semibold mr-1" style={{ color: 'var(--primary)' }}>
                            #helprequest
                            {helpCategory ? ` #${helpCategory}` : ''}
                        </span>
                        {post.content || post.body}
                    </p>
                </div>

                {/* Media grid */}
                {mediaUrls.length > 0 && (
                    <div className={`mb-3 grid gap-1.5 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {mediaUrls.slice(0, 4).map((url, i) => (
                            <div
                                key={i}
                                className={`relative bg-black/10 rounded-xl overflow-hidden ${mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`media ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                {i === 3 && mediaUrls.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">+{mediaUrls.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Funding goal + progress block */}
                {targetAmount != null && targetAmount > 0 && (
                    <div className="mb-3 p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--neu-bg-offset, rgba(0,0,0,0.04))' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-green-400">savings</span>
                                <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>Funding Goal</span>
                            </div>
                            <span className="text-[15px] font-bold" style={{ color: 'var(--neu-text)' }}>{formatNaira(targetAmount)}</span>
                        </div>

                        {/* Progress bar */}
                        <div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--neu-shadow-light)' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${progressPct ?? 0}%`, background: 'var(--primary)' }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-medium" style={{ color: 'var(--primary)' }}>
                                    {formatNaira(localReceived)} raised
                                </span>
                                <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    {progressPct != null ? `${progressPct}%` : ''}
                                </span>
                            </div>
                        </div>

                        {/* Owner: update received amount */}
                        {isOwner && !showUpdateReceived && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setReceivedInput(String(localReceived || '')); setShowUpdateReceived(true); setTimeout(() => receivedInputRef.current?.focus(), 50); }}
                                className="self-start flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg neu-btn transition-all"
                                style={{ color: 'var(--primary)' }}
                            >
                                <span className="material-symbols-outlined text-[13px]">edit</span>
                                Update amount received
                            </button>
                        )}

                        {isOwner && showUpdateReceived && (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <div className="relative flex-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>₦</span>
                                    <input
                                        ref={receivedInputRef}
                                        type="number"
                                        value={receivedInput}
                                        onChange={(e) => setReceivedInput(e.target.value)}
                                        min="0"
                                        placeholder="Amount received so far"
                                        className="w-full pl-6 pr-2 py-1.5 rounded-xl text-[12px] focus:outline-none neu-input"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSaveReceived}
                                    disabled={updateReceivedMutation.isPending}
                                    className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-primary neu-btn-active transition-all"
                                >
                                    {updateReceivedMutation.isPending ? '…' : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setShowUpdateReceived(false); }}
                                    className="px-2.5 py-1.5 rounded-xl text-[12px] neu-btn transition-all"
                                    style={{ color: 'var(--neu-text-muted)' }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment / account details block */}
                {accountDetails && (accountDetails.bankName || accountDetails.accountName || accountDetails.accountNumber) && (
                    <div className="mb-3 p-3 rounded-xl" style={{ background: 'var(--neu-bg-offset, rgba(0,0,0,0.04))' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--neu-text-muted)' }}>account_balance</span>
                            <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>How to Help</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {accountDetails.bankName && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Bank</span>
                                    <span className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{accountDetails.bankName}</span>
                                </div>
                            )}
                            {accountDetails.accountName && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Account Name</span>
                                    <span className="text-[12px] font-semibold" style={{ color: 'var(--neu-text)' }}>{accountDetails.accountName}</span>
                                </div>
                            )}
                            {accountDetails.accountNumber && (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Account No.</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-mono font-bold tracking-wider" style={{ color: 'var(--neu-text)' }}>
                                            {accountDetails.accountNumber}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyAccount}
                                            aria-label="Copy account number"
                                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all neu-btn"
                                            style={{ color: copied ? 'var(--primary)' : 'var(--neu-text-muted)' }}
                                        >
                                            <span className="material-symbols-outlined text-[13px]">{copied ? 'check' : 'content_copy'}</span>
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t" style={{ borderColor: 'var(--neu-shadow-light)' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
                        disabled={likeMutation.isPending}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all group ${
                            isLiked ? 'bg-red-500/10 text-red-400' : 'hover:bg-red-500/10 hover:text-red-400'
                        }`}
                        style={!isLiked ? { color: 'var(--neu-text-muted)' } : undefined}
                    >
                        <span className={`material-symbols-outlined text-[18px] transition-colors ${isLiked ? 'fill-1' : ''}`}>favorite</span>
                        <span>{post.likes || 0}</span>
                    </button>

                    <div
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium hover:bg-white/5 transition-all"
                        style={{ color: 'var(--neu-text-muted)' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                        <span>{post.comments || 0}</span>
                    </div>

                    {(post.views || 0) > 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            <span>{post.views}</span>
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-1 text-[12px] font-bold text-green-400">
                        <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
                        <span>Offer Help</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
