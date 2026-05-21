/**
 * HelpRequestCard — Community help request card
 * iOS 26 Liquid Glass action rail + ambient sphere background (green palette).
 */

'use client';

import { useState, useRef } from 'react';
import { Post } from '@/types/api';
import { formatTimeAgo } from '@/utils/timeAgo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { contentService } from '@/services/content.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface HelpRequestCardProps {
    post: Post;
    onComment?: (postId: string) => void;
}

function formatNaira(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '';
    return `₦${num.toLocaleString('en-NG')}`;
}

// Green / emerald spheres
const SPHERES: [string, string, string] = [
    'rgba(0,212,49,0.45)',
    'rgba(5,150,105,0.38)',
    'rgba(34,197,94,0.28)',
];

const CARD_HEIGHT = '90vh';

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    financial:  { label: 'Financial',  icon: 'account_balance_wallet', color: 'rgba(0,212,49,0.22)' },
    medical:    { label: 'Medical',    icon: 'local_hospital',          color: 'rgba(239,68,68,0.22)' },
    food:       { label: 'Food',       icon: 'restaurant',              color: 'rgba(249,115,22,0.22)' },
    shelter:    { label: 'Shelter',    icon: 'home',                    color: 'rgba(59,130,246,0.22)' },
    emergency:  { label: 'Emergency',  icon: 'emergency',               color: 'rgba(236,72,153,0.22)' },
};

const STATUS_CONFIG: Record<string, { label: string; textCls: string }> = {
    open:        { label: 'Open',        textCls: 'text-primary' },
    in_progress: { label: 'In Progress', textCls: 'text-amber-300' },
    fulfilled:   { label: 'Fulfilled',   textCls: 'text-brand-blue' },
    closed:      { label: 'Closed',      textCls: 'text-white/35' },
};

// ── iOS 26 Liquid Glass button ─────────────────────────────────────────────────
function GlassBtn({
    icon, count, active, activeIconClass, onClick, filled, label,
}: {
    icon: string; count?: number; active?: boolean;
    activeIconClass?: string; onClick: (e: React.MouseEvent) => void; filled?: boolean; label?: string;
}) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-full p-1 transition-transform duration-150 hover:scale-110 active:scale-[0.88] group" aria-label={label}>
            <span
                className={`material-symbols-outlined text-[22px] transition-transform duration-150 ${active ? (activeIconClass || 'text-white') : 'text-white'}`}
                style={{
                    ...(filled && active ? { fontVariationSettings: '"FILL" 1' } : {}),
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.85))',
                }}
            >
                {icon}
            </span>
            {(count !== undefined && count > 0) && (
                <span className="text-[10px] font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {count}
                </span>
            )}
            {label && !(count !== undefined && count > 0) && (
                <span className="text-[9px] font-semibold text-white/55">{label}</span>
            )}
        </button>
    );
}

export function HelpRequestCard({ post, onComment }: HelpRequestCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const postId = post.id || '';

    const meta = (post.metadata || {}) as Record<string, any>;
    const targetAmount: number | undefined = post.targetAmount ?? meta.targetAmount ?? (post as any).targetAmount;
    const accountDetails = post.helpRequestPayment ?? meta.helpRequestPayment ?? meta.accountDetails ?? (post as any).helpRequestPayment ?? (post as any).accountDetails;
    const helpCategory: string = post.helpCategory ?? meta.helpCategory ?? (post as any).helpCategory ?? '';
    const storedReceived: number = post.amountReceived ?? meta.amountReceived ?? (post as any).amountReceived ?? 0;
    const helpStatus: string = meta.helpStatus ?? (post as any).helpStatus ?? 'open';

    const categoryConfig = CATEGORY_CONFIG[helpCategory];
    const statusConfig = STATUS_CONFIG[helpStatus];
    const isOwner = !!(user && (user.id === post.author?.id || (user as any)._id === post.author?.id));

    const [copied, setCopied] = useState(false);
    const [showUpdateReceived, setShowUpdateReceived] = useState(false);
    const [receivedInput, setReceivedInput] = useState(String(storedReceived || ''));
    const [localReceived, setLocalReceived] = useState<number>(storedReceived);
    const receivedInputRef = useRef<HTMLInputElement>(null);

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
        mutationFn: (newAmount: number) => contentService.updateHelpRequestAmount(postId, newAmount),
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
    const hasMedia = mediaUrls.length > 0;
    const textContent = post.content || post.body || '';
    const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length;
    const textSizeClass =
        wordCount <= 6  ? 'text-[30px] leading-tight' :
        wordCount <= 15 ? 'text-[22px] leading-snug' :
        wordCount <= 35 ? 'text-[18px] leading-snug' :
        'text-[15px] leading-relaxed';

    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('a') && !target.closest('button') && !target.closest('input')) {
            router.push(`/help-request/${postId}`);
        }
    };

    // ── Action rail ────────────────────────────────────────────────────────────
    const actionRail = (
        <div className="absolute right-3 bottom-5 z-30 flex flex-col items-center gap-3 sm:bottom-6">
            <GlassBtn
                icon="favorite"
                count={post.likes || undefined}
                active={isLiked}
                activeIconClass="text-brand-blue"
                filled
                onClick={(e) => { e.stopPropagation(); likeMutation.mutate(); }}
            />
            <GlassBtn
                icon="chat_bubble"
                count={post.comments || undefined}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onComment) {
                        onComment(postId);
                    }
                }}
            />
            <GlassBtn
                icon="volunteer_activism"
                activeIconClass="text-primary"
                label="Help"
                onClick={(e) => { e.stopPropagation(); router.push(`/help-request/${postId}`); }}
            />
            {(post.views || 0) > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                    <span className="material-symbols-outlined text-[18px] text-white/30">visibility</span>
                    <span className="text-[10px] text-white/35 font-medium">{post.views}</span>
                </div>
            )}
        </div>
    );

    // ── Top status badges ─────────────────────────────────────────────────────
    const topBadges = (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 bg-gradient-to-b from-black/65 via-black/20 to-transparent px-4 pb-16 pt-4">
            <div className="pointer-events-auto flex items-center gap-1.5">
                {statusConfig && (
                    <span
                        className={`text-[9px] px-2 py-[3px] rounded-full font-bold tracking-wider uppercase ${statusConfig.textCls}`}
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)' }}
                    >
                        {statusConfig.label}
                    </span>
                )}
                {categoryConfig && (
                    <span
                        className="flex items-center gap-0.5 text-[9px] px-2 py-[3px] rounded-full font-bold text-white/75"
                        style={{ background: categoryConfig.color, border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
                    >
                        <span className="material-symbols-outlined text-[12px]">{categoryConfig.icon}</span>
                        {categoryConfig.label}
                    </span>
                )}
            </div>
        </div>
    );

    // ── Bottom author cluster ─────────────────────────────────────────────────
    const bottomAuthorPanel = (
        <div className="absolute bottom-5 left-4 right-[76px] z-30 sm:bottom-6 sm:left-5 sm:right-24">
            <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                    <Link href={`/profile/${post.author?.username}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                            {post.author?.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={post.author.avatarUrl} alt={post.author?.name || 'Author'} className="h-full w-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-[18px] text-white/55">person</span>
                            )}
                        </div>
                    </Link>
                </div>
                <div className="min-w-0">
                    <Link
                        href={`/profile/${post.author?.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block max-w-[150px] whitespace-normal text-[12px] font-black leading-[1.05] text-white hover:underline"
                        style={{ textShadow: '0 1px 10px rgba(0,0,0,0.8)' }}
                    >
                        {post.author?.name || 'Anonymous Neyborh'}
                    </Link>
                    <div className="mt-1 text-[10px] font-bold leading-none text-white/58">
                        {formatTimeAgo(post.createdAt)}
                    </div>
                </div>
            </div>
            {hasMedia && textContent.trim().length > 0 && (
                <p
                    className="mt-3 text-[14px] font-semibold leading-snug text-white whitespace-pre-wrap break-words"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.65)' }}
                >
                    <span className="text-primary font-black mr-1.5">#helprequest</span>
                    {textContent}
                </p>
            )}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (onComment) {
                        onComment(postId);
                    }
                }}
                className="mt-3 flex h-8 w-full max-w-[210px] items-center rounded-full border border-white/12 bg-white/8 px-3 text-left text-[11px] font-semibold text-white/55 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/12 hover:text-white/75 active:scale-[0.98]"
                aria-label="Add comment"
            >
                Add comment...
            </button>
        </div>
    );

    // ── Shared structured content blocks ───────────────────────────────────────
    const fundingBlock = targetAmount != null && targetAmount > 0 ? (
        <div
            className="p-3.5 rounded-2xl flex flex-col gap-2.5"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[17px] text-primary">savings</span>
                    <span className="text-[11px] font-bold uppercase text-white/45">Funding Goal</span>
                </div>
                <span className="text-[15px] font-bold text-white">{formatNaira(targetAmount)}</span>
            </div>
            <div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPct ?? 0}%` }}
                    />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] font-medium text-primary">{formatNaira(localReceived)} raised</span>
                    <span className="text-[11px] text-white/35">{progressPct != null ? `${progressPct}%` : ''}</span>
                </div>
            </div>
            {isOwner && !showUpdateReceived && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setReceivedInput(String(localReceived || '')); setShowUpdateReceived(true); setTimeout(() => receivedInputRef.current?.focus(), 50); }}
                    className="self-start flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl text-primary hover:text-white/90 transition-colors"
                    style={{ background: 'rgba(0,212,49,0.15)', border: '1px solid rgba(0,212,49,0.20)' }}
                >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    Update amount
                </button>
            )}
            {isOwner && showUpdateReceived && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-white/40">₦</span>
                        <input
                            ref={receivedInputRef}
                            type="number"
                            value={receivedInput}
                            onChange={(e) => setReceivedInput(e.target.value)}
                            min="0"
                            placeholder="Amount received"
                            className="w-full pl-6 pr-2 py-1.5 rounded-xl text-[12px] focus:outline-none bg-white/10 text-white placeholder:text-white/25 border border-white/10"
                        />
                    </div>
                    <button type="button" onClick={handleSaveReceived} disabled={updateReceivedMutation.isPending}
                        className="px-3 py-1.5 rounded-xl text-[12px] font-bold text-white bg-primary/30 hover:bg-primary/40 transition-all">
                        {updateReceivedMutation.isPending ? '…' : 'Save'}
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowUpdateReceived(false); }}
                        className="px-2.5 py-1.5 rounded-xl text-[12px] text-white/50 hover:text-white/70 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        ✕
                    </button>
                </div>
            )}
        </div>
    ) : null;

    const accountBlock = accountDetails && (accountDetails.bankName || accountDetails.accountName || accountDetails.accountNumber) ? (
        <div
            className="p-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)' }}
        >
            <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-[15px] text-white/40">account_balance</span>
                <span className="text-[11px] font-bold uppercase text-white/40">How to Help</span>
            </div>
            <div className="flex flex-col gap-1.5">
                {accountDetails.bankName && (
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-white/35">Bank</span>
                        <span className="text-[12px] font-semibold text-white">{accountDetails.bankName}</span>
                    </div>
                )}
                {accountDetails.accountName && (
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-white/35">Name</span>
                        <span className="text-[12px] font-semibold text-white">{accountDetails.accountName}</span>
                    </div>
                )}
                {accountDetails.accountNumber && (
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] text-white/35">Account</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-mono font-bold tracking-wider text-white">{accountDetails.accountNumber}</span>
                            <button
                                type="button"
                                onClick={handleCopyAccount}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.10)',
                                    color: copied ? '#4ade80' : 'rgba(255,255,255,0.45)',
                                }}
                            >
                                <span className="material-symbols-outlined text-[13px]">{copied ? 'check' : 'content_copy'}</span>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : null;

    // ── TEXT-ONLY MODE ────────────────────────────────────────────────────────
    if (!hasMedia) {
        return (
            <article
                className="relative overflow-hidden cursor-pointer rounded-none border-y border-white/10 sm:rounded-3xl sm:border"
                style={{ background: '#04100a', height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
                onClick={handleCardClick}
            >
                {/* Ambient spheres */}
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-28 -left-28 w-[340px] h-[340px] rounded-full" style={{ background: SPHERES[0], filter: 'blur(90px)' }} />
                    <div className="absolute top-[35%] -right-20 w-[300px] h-[300px] rounded-full" style={{ background: SPHERES[1], filter: 'blur(80px)' }} />
                    <div className="absolute -bottom-24 left-[15%] w-[280px] h-[280px] rounded-full" style={{ background: SPHERES[2], filter: 'blur(75px)' }} />
                </div>
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

                {topBadges}
                {actionRail}
                {bottomAuthorPanel}

                {/* Center: content */}
                <div
                    className="absolute inset-x-0 z-20 px-5 pr-20 flex flex-col justify-center gap-4 overflow-y-auto"
                    style={{ top: '88px', bottom: '148px' }}
                >
                    <p
                        className={`font-bold whitespace-pre-wrap break-words text-white ${textSizeClass}`}
                        style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}
                    >
                        <span className="text-primary mr-1.5 font-black">
                            #helprequest{helpCategory ? ` #${helpCategory}` : ''}
                        </span>
                        {textContent}
                    </p>

                    {fundingBlock}
                    {accountBlock}

                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                        <span className="text-[10px] italic text-white/25">edited</span>
                    )}
                </div>
            </article>
        );
    }

    // ── MIXED MODE (text + media) ─────────────────────────────────────────────
    return (
        <article
            className="relative overflow-hidden cursor-pointer rounded-none border-y border-white/10 bg-black sm:rounded-3xl sm:border"
            style={{ height: CARD_HEIGHT, minHeight: CARD_HEIGHT }}
            onClick={handleCardClick}
        >
            {/* Full-bleed media */}
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={mediaUrls[0]}
                    alt="Help request media"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://i.pravatar.cc/600?u=help'; }}
                />
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, transparent 25%, rgba(0,0,0,0.88) 65%, rgba(0,0,0,0.97) 100%)' }}
                />
            </div>

            {mediaUrls.length > 1 && (
                <div
                    className="absolute top-4 right-14 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)' }}
                >
                    <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
                    <span className="text-white text-[11px] font-bold">{mediaUrls.length}</span>
                </div>
            )}

            {topBadges}
            {actionRail}
            {bottomAuthorPanel}

            {/* Bottom details panel */}
            <div className="absolute bottom-[160px] left-0 right-0 z-20 px-5 pr-20 flex flex-col gap-3">
                {fundingBlock}
                {accountBlock}
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="text-[10px] italic text-white/25">edited</span>
                )}
            </div>
        </article>
    );
}
