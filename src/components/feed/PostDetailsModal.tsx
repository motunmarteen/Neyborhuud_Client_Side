'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePosts';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import ShareModal from './ShareModal';
import { PostAuthor } from '@/types/api';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { contentService } from '@/services/content.service';
import { fyiService } from '@/services/fyi.service';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';

interface PostDetailsModalProps {
    postId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ postId, isOpen, onClose }) => {
    const { data: details, isLoading, isError, error } = usePost(postId);
    const modalRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const [showShare, setShowShare] = useState(false);
    const [showEditHistory, setShowEditHistory] = useState(false);
    const [editHistory, setEditHistory] = useState<Array<{ _id: string; title?: string; body: string; editReason?: string; versionNumber: number; createdAt: string }>>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [pinLoading, setPinLoading] = useState(false);
    const [showStatusHistory, setShowStatusHistory] = useState(false);
    const [statusHistory, setStatusHistory] = useState<Array<{ previousStatus: string; newStatus: string; changedBy: any; changedAt: string }>>([]);
    const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);

    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('neyborhuud_user_id') : null;

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent scrolling on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleViewEditHistory = async () => {
        if (!postId) return;
        setHistoryLoading(true);
        setShowEditHistory(true);
        try {
            const res = await contentService.getEditHistory(postId);
            const data = res.data as any;
            const history = Array.isArray(data) ? data : (data?.history || []);
            setEditHistory(history);
        } catch {
            setEditHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };



    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="neu-modal w-full max-w-2xl h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 sticky top-0 neu-base z-10" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="mod-chip w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl" style={{ color: 'var(--neu-text-secondary)' }}>arrow_back</span>
                        </button>
                        <h2 className="font-bold text-lg" style={{ color: 'var(--neu-text)' }}>Post</h2>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="animate-pulse font-medium" style={{ color: 'var(--neu-text-muted)' }}>Loading conversation...</p>
                        </div>
                    ) : isError || !details ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-16 h-16 neu-socket rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-brand-red">error</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Failed to load post</h3>
                            <p className="text-sm max-w-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                {error instanceof Error ? error.message : "Something went wrong while fetching the post details."}
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 mod-chip rounded-2xl font-bold text-primary transition-all active:scale-95"
                            >
                                Back to Feed
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Main Post Section */}
                            <div className="px-4 py-4">
                                <div className="flex gap-3 mb-4">
                                    <MapPinAvatar
                                        src={(details.content.author as PostAuthor)?.avatarUrl}
                                        alt="Author"
                                        size="md"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="font-bold text-[16px] hover:underline cursor-pointer" style={{ color: 'var(--neu-text)' }}>
                                            {(details.content.author as PostAuthor)?.name || 'Anonymous'}
                                        </div>
                                        <div className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                                            @{(details.content.author as PostAuthor)?.username || 'user'}
                                        </div>
                                    </div>
                                    <button className="btn-ghost w-8 h-8 flex items-center justify-center rounded-xl transition-colors">
                                        <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>more_horiz</span>
                                    </button>
                                </div>

                                <div className="text-[18px] leading-normal mb-4 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                                    {details.content.content || details.content.body}
                                </div>

                                {/* Media Gallery */}
                                {details.content.media && details.content.media.length > 0 && (
                                    <div className="mb-4 neu-card-sm rounded-2xl overflow-hidden">
                                        <div className={`grid gap-0.5 ${details.content.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {details.content.media.map((m, idx) => {
                                                const url = typeof m === 'string' ? m : m.url;
                                                return (
                                                    <div key={idx} className={`${details.content.media && details.content.media.length > 1 ? 'aspect-square' : 'aspect-auto max-h-[500px]'} relative neu-base`}>
                                                        <img src={url} className="w-full h-full object-cover" alt="Post media" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="text-[15px] mb-4 flex items-center gap-3 flex-wrap" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span>{formatTimeAgo(details.content.createdAt)}</span>
                                    {details.content.updatedAt && details.content.updatedAt !== details.content.createdAt && (
                                        <button
                                            onClick={handleViewEditHistory}
                                            className="text-xs italic hover:text-primary hover:underline transition-colors cursor-pointer"
                                        >
                                            (edited)
                                        </button>
                                    )}
                                    {details.content.priority && details.content.priority !== 'normal' && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                            details.content.priority === 'critical' ? 'bg-brand-red/20 text-brand-red' :
                                            details.content.priority === 'high' ? 'bg-brand-red/20 text-brand-red' :
                                            'bg-brand-blue/20 text-brand-blue'
                                        }`}>
                                            {details.content.priority.charAt(0).toUpperCase() + details.content.priority.slice(1)}
                                        </span>
                                    )}
                                </div>

                                {/* Cultural Context */}
                                {details.content.culturalContext && details.content.culturalContext.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {details.content.culturalContext.map((ctx: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-blue/10 text-brand-blue">
                                                <span className="material-symbols-outlined text-[12px]">language</span>
                                                {ctx}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Target Audience */}
                                {details.content.targetAudience && (details.content.targetAudience.ageRange || details.content.targetAudience.gender || (details.content.targetAudience.interests && details.content.targetAudience.interests.length > 0)) && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>group</span>
                                        <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--neu-text-muted)' }}>Audience:</span>
                                        {details.content.targetAudience.ageRange && (details.content.targetAudience.ageRange.min || details.content.targetAudience.ageRange.max) && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green-dark/10 text-brand-green-dark font-medium">
                                                {details.content.targetAudience.ageRange.min || '?'}-{details.content.targetAudience.ageRange.max || '?'} yrs
                                            </span>
                                        )}
                                        {details.content.targetAudience.gender && details.content.targetAudience.gender !== 'all' && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green-dark/10 text-brand-green-dark font-medium capitalize">
                                                {details.content.targetAudience.gender}
                                            </span>
                                        )}
                                        {details.content.targetAudience.interests && details.content.targetAudience.interests.map((interest: string, i: number) => (
                                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-green-dark/10 text-brand-green-dark font-medium">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* FYI Status */}
                                {details.content.fyiStatus && details.content.fyiStatus !== 'active' && (
                                    <div className="mb-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            details.content.fyiStatus === 'found' || details.content.fyiStatus === 'resolved' ? 'bg-primary/15 text-primary' : 'bg-brand-surface/15 text-[var(--neu-text-muted)]'
                                        }`}>
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Status: {details.content.fyiStatus.charAt(0).toUpperCase() + details.content.fyiStatus.slice(1)}
                                        </span>
                                    </div>
                                )}

                                {/* FYI Status Update (owner only) */}
                                {details.content.contentType === 'fyi' && currentUserId && details.content.author?.id === currentUserId && (
                                    <div className="mb-3 p-3 rounded-xl bg-brand-blue/5 border border-brand-blue/10">
                                        <label className="flex items-center gap-1.5 mb-2">
                                            <span className="material-symbols-outlined text-brand-blue text-[16px]">edit</span>
                                            <span className="text-xs font-bold text-brand-blue uppercase">Update Status</span>
                                        </label>
                                        <select
                                            className="w-full text-sm rounded-lg px-3 py-2 border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
                                            style={{ color: 'var(--neu-text)' }}
                                            value={details.content.fyiStatus || 'active'}
                                            disabled={statusUpdating}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                setStatusUpdating(true);
                                                try {
                                                    await fyiService.updateStatus(details.content.id, newStatus);
                                                    queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                                                } catch (err) {
                                                    toast.error('Failed to update status. Please try again.');
                                                } finally {
                                                    setStatusUpdating(false);
                                                }
                                            }}
                                        >
                                            {(details.content.fyiSubtype === 'lost_found'
                                                ? ['active', 'found', 'returned', 'closed']
                                                : details.content.fyiSubtype === 'safety_notice'
                                                ? ['active', 'resolved', 'expired', 'closed']
                                                : details.content.fyiSubtype === 'community_announcement'
                                                ? ['active', 'expired', 'closed']
                                                : details.content.fyiSubtype === 'local_news'
                                                ? ['active', 'outdated', 'closed']
                                                : details.content.fyiSubtype === 'alert'
                                                ? ['active', 'resolved', 'expired', 'closed']
                                                : ['active', 'closed']
                                            ).map((s) => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                        {statusUpdating && (
                                            <p className="text-xs mt-1.5 text-brand-blue animate-pulse">Updating status…</p>
                                        )}
                                    </div>
                                )}

                                {/* Endorsements */}
                                {details.content.endorsements && details.content.endorsements.length > 0 && (
                                    <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-emerald-500/10">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
                                            <span className="text-xs font-bold text-primary uppercase">Authority Endorsed</span>
                                        </div>
                                        {details.content.endorsements.map((e: any, i: number) => (
                                            <div key={i} className="text-xs mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                <span className="font-medium" style={{ color: 'var(--neu-text)' }}>{e.authorityTitle}</span>
                                                {e.note && <span> - {e.note}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Request Endorsement (visible on FYI posts) */}
                                {details.content.contentType === 'fyi' && (
                                    <div className="mb-3">
                                        <button
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-emerald-500/20 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={async () => {
                                                try {
                                                    await fyiService.endorseBulletin(
                                                        details.content.id,
                                                        'Endorsed by community member',
                                                        'Community Member'
                                                    );
                                                    queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                                                    toast.success('Endorsement submitted successfully!');
                                                } catch {
                                                    toast.error('Failed to submit endorsement. Please try again.');
                                                }
                                            }}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">verified</span>
                                            Request Endorsement
                                        </button>
                                    </div>
                                )}

                                {/* FYI Action Buttons: RSVP, Receipt, Pin/Unpin */}
                                {details.content.contentType === 'fyi' && (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {/* RSVP — for community announcements/events */}
                                        {(details.content.fyiSubtype === 'community_announcement' || details.content.fyiSubtype === 'local_news') && (
                                            <div className="flex gap-1.5">
                                                {(['going', 'maybe', 'declined'] as const).map((rsvpStatus) => (
                                                    <button
                                                        key={rsvpStatus}
                                                        disabled={rsvpLoading}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                                                            rsvpStatus === 'going' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' :
                                                            rsvpStatus === 'maybe' ? 'bg-primary/10 text-primary400 border-yellow-500/20 hover:bg-primary/20' :
                                                            'bg-brand-red/10 text-brand-red border-brand-red/20 hover:bg-brand-red/20'
                                                        }`}
                                                        onClick={async () => {
                                                            setRsvpLoading(true);
                                                            try {
                                                                await fyiService.rsvpToBulletin(details.content.id, rsvpStatus);
                                                                queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                            } catch {
                                                                toast.error('Failed to RSVP. Please try again.');
                                                            } finally {
                                                                setRsvpLoading(false);
                                                            }
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {rsvpStatus === 'going' ? 'check_circle' : rsvpStatus === 'maybe' ? 'help' : 'cancel'}
                                                        </span>
                                                        {rsvpStatus.charAt(0).toUpperCase() + rsvpStatus.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Receipt Confirmation — for safety notices */}
                                        {details.content.fyiSubtype === 'safety_notice' && (
                                            <button
                                                disabled={receiptLoading}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-blue/10 text-brand-blue border border-brand-blue/20 hover:bg-brand-blue/20 transition-colors disabled:opacity-50"
                                                onClick={async () => {
                                                    setReceiptLoading(true);
                                                    try {
                                                        await fyiService.confirmReceipt(details.content.id);
                                                        queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                        toast.success('Receipt confirmed. Stay safe!');
                                                    } catch {
                                                        toast.error('Failed to confirm receipt.');
                                                    } finally {
                                                        setReceiptLoading(false);
                                                    }
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">task_alt</span>
                                                {receiptLoading ? 'Confirming…' : 'I Acknowledge This'}
                                            </button>
                                        )}

                                        {/* Pin/Unpin — for author or admin */}
                                        {currentUserId && details.content.author?.id === currentUserId && (
                                            <button
                                                disabled={pinLoading}
                                                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold border transition-colors disabled:opacity-50 ${
                                                    details.content.isPinned
                                                        ? 'bg-primary/10 text-primary border-amber-500/20 hover:bg-primary/20'
                                                        : 'bg-brand-surface/10 text-[var(--neu-text-muted)] border-black/[0.08]/20 hover:bg-brand-surface/20'
                                                }`}
                                                onClick={async () => {
                                                    setPinLoading(true);
                                                    try {
                                                        if (details.content.isPinned || details.content.metadata?.isPinned) {
                                                            await fyiService.unpinBulletin(details.content.id);
                                                        } else {
                                                            await fyiService.pinBulletin(details.content.id);
                                                        }
                                                        queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                        queryClient.invalidateQueries({ queryKey: ['posts'] });
                                                    } catch {
                                                        toast.error('Failed to update pin status.');
                                                    } finally {
                                                        setPinLoading(false);
                                                    }
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {details.content.isPinned || details.content.metadata?.isPinned ? 'push_pin' : 'push_pin'}
                                                </span>
                                                {pinLoading ? 'Updating…' : (details.content.isPinned || details.content.metadata?.isPinned ? 'Unpin' : 'Pin to Feed')}
                                            </button>
                                        )}

                                        {/* View Status History */}
                                        {details.content.contentType === 'fyi' && (
                                            <button
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-surface/10 text-[var(--neu-text-muted)] border border-black/[0.08]/20 hover:bg-brand-surface/20 transition-colors"
                                                onClick={async () => {
                                                    setShowStatusHistory(true);
                                                    setStatusHistoryLoading(true);
                                                    try {
                                                        const res = await fyiService.getStatusHistory(details.content.id);
                                                        const data = (res as any)?.data ?? res;
                                                        setStatusHistory(data?.history || data?.data?.history || []);
                                                    } catch {
                                                        setStatusHistory([]);
                                                    } finally {
                                                        setStatusHistoryLoading(false);
                                                    }
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[14px]">history</span>
                                                Status History
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="neu-divider mb-3" />

                                {/* Stats Bar */}
                                <div className="flex items-center gap-8 py-3 px-1 overflow-x-auto no-scrollbar">
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-pink-400">
                                        <span className="font-bold text-sm group-hover:text-pink-400" style={{ color: 'var(--neu-text)' }}>{details.content.likes || 0}</span>
                                        <span className="text-sm group-hover:text-pink-400" style={{ color: 'var(--neu-text-muted)' }}>Likes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-primary">
                                        <span className="font-bold text-sm group-hover:text-primary" style={{ color: 'var(--neu-text)' }}>{details.content.comments || 0}</span>
                                        <span className="text-sm group-hover:text-primary" style={{ color: 'var(--neu-text-muted)' }}>Replies</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-primary" onClick={() => setShowShare(true)}>
                                        <span className="font-bold text-sm group-hover:text-primary" style={{ color: 'var(--neu-text)' }}>{details.content.shares || 0}</span>
                                        <span className="text-sm group-hover:text-primary" style={{ color: 'var(--neu-text-muted)' }}>Share</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>{details.content.views || 0}</span>
                                        <span className="text-sm">Views</span>
                                    </div>
                                </div>
                                <div className="neu-divider" />

                                {/* Post Comment Form */}
                                <div className="mt-4">
                                    {postId && <CommentForm postId={postId} placeholder="Post your reply" />}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="px-4 pb-20">
                                {details.comments && details.comments.length > 0 ? (
                                    <div className="space-y-1">
                                        {postId && details.comments.map((comment) => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                postId={postId}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span className="material-symbols-outlined text-3xl mb-3 block opacity-30">chat_bubble_outline</span>
                                        <p className="text-sm">Be the first to reply to this post</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit History Modal */}
            {showEditHistory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEditHistory(false)}>
                    <div className="neu-modal rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 neu-base" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
                            <h3 className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>Edit History</h3>
                            <button onClick={() => setShowEditHistory(false)} className="btn-ghost w-8 h-8 flex items-center justify-center rounded-xl">
                                <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : editHistory.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: 'var(--neu-text-muted)' }}>No edit history found</p>
                            ) : (
                                editHistory.map((version, idx) => (
                                    <div key={version._id || idx} className="neu-card-sm rounded-xl p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                v{version.versionNumber}
                                            </span>
                                            <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                                                {new Date(version.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {version.title && (
                                            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{version.title}</p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--neu-text-secondary, var(--neu-text))' }}>
                                            {version.body}
                                        </p>
                                        {version.editReason && (
                                            <p className="text-xs italic" style={{ color: 'var(--neu-text-muted)' }}>
                                                Reason: {version.editReason}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Status History Modal */}
            {showStatusHistory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowStatusHistory(false)}>
                    <div className="neu-modal rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 neu-base" style={{ boxShadow: '0 2px 8px var(--neu-shadow-dark)' }}>
                            <h3 className="font-bold text-base" style={{ color: 'var(--neu-text)' }}>Status History</h3>
                            <button onClick={() => setShowStatusHistory(false)} className="btn-ghost w-8 h-8 flex items-center justify-center rounded-xl">
                                <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {statusHistoryLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : statusHistory.length === 0 ? (
                                <p className="text-center py-8 text-sm" style={{ color: 'var(--neu-text-muted)' }}>No status changes recorded</p>
                            ) : (
                                statusHistory.map((entry, idx) => (
                                    <div key={idx} className="neu-card-sm rounded-xl p-3 flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-brand-blue text-[16px]">swap_horiz</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="px-1.5 py-0.5 rounded bg-brand-surface/15 font-medium" style={{ color: 'var(--neu-text-muted)' }}>
                                                    {entry.previousStatus}
                                                </span>
                                                <span className="material-symbols-outlined text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>arrow_forward</span>
                                                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                                                    {entry.newStatus}
                                                </span>
                                            </div>
                                            <div className="text-[11px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                by {entry.changedBy?.name || entry.changedBy?.firstName || 'Unknown'} &middot; {new Date(entry.changedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {showShare && postId && (
                <ShareModal
                    postId={postId}
                    postContent={details?.content?.content ?? details?.content?.body ?? ''}
                    onClose={() => setShowShare(false)}
                />
            )}
        </div>
    );
};
