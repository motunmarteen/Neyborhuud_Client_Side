'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import { contentService } from '@/services/content.service';
import { toast } from 'sonner';

interface ChainItem {
    postId: string;
    contentType: string;
    title: string;
    body: string;
    createdAt: string;
    parentId: string | null;
    author: {
        id: string;
        name: string;
        username: string;
        avatarUrl: string | null;
        verificationTier: string;
        isVerified: boolean;
        firstName?: string;
        lastName?: string;
    } | null;
}

interface PostRepostChainModalProps {
    postId: string;
    open: boolean;
    onClose: () => void;
}

export function PostRepostChainModal({ postId, open, onClose }: PostRepostChainModalProps) {
    const [chain, setChain] = useState<ChainItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !postId) return;
        
        let active = true;
        setLoading(true);
        contentService.getRepostChain(postId)
            .then((data) => {
                if (active) {
                    // Chain comes back as current post -> parent -> grandparent
                    // Reverse it so originator is first and current post is last
                    const reversed = [...data].reverse();
                    setChain(reversed);
                }
            })
            .catch((err) => {
                console.error('Failed to get repost chain:', err);
                toast.error('Could not load repost chain.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [postId, open]);

    if (!open) return null;

    return (
        <BottomSheetOverlay
            open={open}
            onClose={onClose}
            ariaLabel="Repost Chain Trace"
            zIndexClass="z-[350]"
            alignClass="items-end justify-center sm:items-center"
            backdropClassName="bg-black/60 backdrop-blur-sm"
            panelClassName="w-full max-w-md rounded-t-3xl bg-white pb-safe shadow-2xl dark:bg-brand-black sm:rounded-3xl"
            handleClassName="pt-2 pb-0"
        >
            <div className="px-5 pb-6 pt-2 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-lg font-black text-[var(--neu-text-muted)] dark:text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
                            Chain of Post
                        </p>
                        <p className="text-xs text-[var(--neu-text-muted)] dark:text-[var(--neu-text-muted)] mt-0.5">
                            {!loading && chain.length > 0
                                ? `Shared ${chain.length - 1} time${chain.length - 1 !== 1 ? 's' : ''} — trace back to originator`
                                : 'Origin trace diagram back to originator'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface dark:bg-brand-black text-[var(--neu-text-muted)] hover:bg-brand-surface dark:hover:bg-brand-black/80 transition-colors"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto pr-1 py-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-neu-text-secondary/70 dark:text-white/50 mt-3 font-semibold">Tracing origin...</p>
                        </div>
                    ) : chain.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="material-symbols-outlined text-[36px] text-neu-text-secondary/55 mb-2">error</span>
                            <p className="text-sm font-bold">No chain found</p>
                            <p className="text-xs text-neu-text-secondary/70 dark:text-white/50 mt-1">This post appears to be the original creator's.</p>
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-7 border-l-2 border-primary/20 ml-3 py-1">
                            {chain.map((item, idx) => {
                                const isOrigin = idx === 0;
                                const isLast = idx === chain.length - 1;
                                const author = item.author;
                                const authorName = author ? [author.firstName, author.lastName].filter(Boolean).join(' ') || author.name || author.username : 'Anonymous';
                                const username = author?.username || 'anonymous';
                                const avatar = author?.avatarUrl || null;
                                const dateStr = new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div key={item.postId} className="relative group select-none animate-fadeIn">
                                        {/* Connector Circle / Node */}
                                        <div className={`absolute -left-[31px] top-1.5 w-[18px] h-[18px] rounded-full border-2 bg-white dark:bg-brand-black flex items-center justify-center transition-all ${
                                            isOrigin ? 'border-[#00c431] shadow-[0_0_8px_rgba(0,196,49,0.4)]' :
                                            isLast ? 'border-primary ring-4 ring-primary/10' :
                                            'border-primary/45'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                isOrigin ? 'bg-[#00c431]' :
                                                isLast ? 'bg-primary' :
                                                'bg-primary/50'
                                            }`} />
                                        </div>

                                        {/* Content card */}
                                        <div className={`p-3 rounded-2xl border transition-all ${
                                            isLast 
                                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                                : 'bg-black/[0.015] dark:bg-white/[0.015] border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.025] hover:dark:bg-white/[0.025]'
                                        }`}>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full overflow-hidden relative border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/10 shrink-0">
                                                    {avatar ? (
                                                        <Image
                                                            src={avatar}
                                                            alt={authorName}
                                                            fill
                                                            sizes="32px"
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black" style={{ background: 'linear-gradient(135deg, #00c431, #009924)', color: 'white' }}>
                                                            {username.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <Link href={`/profile/${username}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                                                            <h4 className="text-xs font-black truncate max-w-[120px]">{authorName}</h4>
                                                        </Link>
                                                        <span className="text-[9px] font-bold text-neu-text-secondary/60 dark:text-white/40">{dateStr}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <Link href={`/profile/${username}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                                                            <span className="text-[10px] text-primary font-bold">@{username}</span>
                                                        </Link>
                                                        {isOrigin && (
                                                            <span className="text-[8.5px] px-1.5 py-0.5 rounded-full bg-[#00c431]/15 text-[#00c431] font-black uppercase tracking-wider scale-90">Originator</span>
                                                        )}
                                                        {isLast && !isOrigin && (
                                                            <span className="text-[8.5px] px-1.5 py-0.5 rounded-full bg-primary/20 text-brand-green-dark dark:text-primary font-black uppercase tracking-wider scale-90">Current</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {item.body && (
                                                <p className="text-[11.5px] mt-2 text-neu-text-secondary dark:text-white/70 line-clamp-2 leading-relaxed italic">
                                                    "{item.body}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </BottomSheetOverlay>
    );
}
