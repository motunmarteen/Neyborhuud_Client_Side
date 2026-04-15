'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePosts';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { PostAuthor } from '@/types/api';
import { contentService } from '@/services/content.service';
import { fyiService } from '@/services/fyi.service';

interface PostDetailsModalProps {
    postId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ postId, isOpen, onClose }) => {
    const { data: details, isLoading, isError, error } = usePost(postId);
    const modalRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
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

    const formatTimeAgo = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
                            className="neu-btn w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
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
                                <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                            </div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--neu-text)' }}>Failed to load post</h3>
                            <p className="text-sm max-w-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                {error instanceof Error ? error.message : "Something went wrong while fetching the post details."}
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 neu-btn rounded-2xl font-bold text-primary transition-all active:scale-95"
                            >
                                Back to Feed
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Main Post Section */}
                            <div className="px-4 py-4">
                                <div className="flex gap-3 mb-4">
                                    <img
                                        src={(details.content.author as PostAuthor)?.avatarUrl || 'https://i.pravatar.cc/100?u=author'}
                                        className="w-12 h-12 rounded-full object-cover neu-avatar"
                                        alt="Author"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="font-bold text-[16px] hover:underline cursor-pointer" style={{ color: 'var(--neu-text)' }}>
                                            {(details.content.author as PostAuthor)?.name || 'Anonymous'}
                                        </div>
                                        <div className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                                            @{(details.content.author as PostAuthor)?.username || 'user'}
                                        </div>
                                    </div>
                                    <button className="neu-btn w-8 h-8 flex items-center justify-center rounded-xl transition-colors">
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
                                            details.content.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            details.content.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {details.content.priority.charAt(0).toUpperCase() + details.content.priority.slice(1)}
                                        </span>
                                    )}
                                </div>

                                {/* Cultural Context */}
                                {details.content.culturalContext && details.content.culturalContext.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {details.content.culturalContext.map((ctx: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400">
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
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
                                                {details.content.targetAudience.ageRange.min || '?'}-{details.content.targetAudience.ageRange.max || '?'} yrs
                                            </span>
                                        )}
                                        {details.content.targetAudience.gender && details.content.targetAudience.gender !== 'all' && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium capitalize">
                                                {details.content.targetAudience.gender}
                                            </span>
                                        )}
                                        {details.content.targetAudience.interests && details.content.targetAudience.interests.map((interest: string, i: number) => (
                                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* FYI Status */}
                                {details.content.fyiStatus && details.content.fyiStatus !== 'active' && (
                                    <div className="mb-3">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            details.content.fyiStatus === 'found' || details.content.fyiStatus === 'resolved' ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
                                        }`}>
                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                            Status: {details.content.fyiStatus.charAt(0).toUpperCase() + details.content.fyiStatus.slice(1)}
                                        </span>
                                    </div>
                                )}

                                {/* FYI Status Update (owner only) */}
                                {details.content.contentType === 'fyi' && currentUserId && details.content.author?.id === currentUserId && (
                                    <div className="mb-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                        <label className="flex items-center gap-1.5 mb-2">
                                            <span className="material-symbols-outlined text-blue-400 text-[16px]">edit</span>
                                            <span className="text-xs font-bold text-blue-400 uppercase">Update Status</span>
                                        </label>
                                        <select
                                            className="w-full text-sm rounded-lg px-3 py-2 border border-white/10 bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                                                    window.alert('Failed to update status. Please try again.');
                                                } finally {
                                                    setStatusUpdating(false);
                                                }
                                            }}
                                        >
                                            {(details.content.fyiSubtype === 'lost_found'
                                                ? ['active', 'found', 'returned', 'closed']
                                                : details.content.fyiSubtype === 'safety_notice'
                                                ? ['active', 'resolved', 'expired', 'closed']
                                                : ['active', 'closed']
                                            ).map((s) => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                        {statusUpdating && (
                                            <p className="text-xs mt-1.5 text-blue-400 animate-pulse">Updating status…</p>
                                        )}
                                    </div>
                                )}

                                {/* Endorsements */}
                                {details.content.endorsements && details.content.endorsements.length > 0 && (
                                    <div className="mb-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="material-symbols-outlined text-emerald-400 text-[16px]">verified</span>
                                            <span className="text-xs font-bold text-emerald-400 uppercase">Authority Endorsed</span>
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
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={async () => {
                                                try {
                                                    await fyiService.endorseBulletin(
                                                        details.content.id,
                                                        'Endorsed by community member',
                                                        'Community Member'
                                                    );
                                                    queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                                                    window.alert('Endorsement submitted successfully!');
                                                } catch {
                                                    window.alert('Failed to submit endorsement. Please try again.');
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
                                                            rsvpStatus === 'going' ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' :
                                                            rsvpStatus === 'maybe' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                        }`}
                                                        onClick={async () => {
                                                            setRsvpLoading(true);
                                                            try {
                                                                await fyiService.rsvpToBulletin(details.content.id, rsvpStatus);
                                                                queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                            } catch {
                                                                window.alert('Failed to RSVP. Please try again.');
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
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                                onClick={async () => {
                                                    setReceiptLoading(true);
                                                    try {
                                                        await fyiService.confirmReceipt(details.content.id);
                                                        queryClient.invalidateQueries({ queryKey: ['post', postId] });
                                                        window.alert('Receipt confirmed. Stay safe!');
                                                    } catch {
                                                        window.alert('Failed to confirm receipt.');
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
                                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20 hover:bg-gray-500/20'
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
                                                        window.alert('Failed to update pin status.');
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
                                        {details.content.fyiStatus && details.content.fyiStatus !== 'active' && (
                                            <button
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-colors"
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
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-primary">
                                        <span className="font-bold text-sm group-hover:text-primary" style={{ color: 'var(--neu-text)' }}>{details.content.shares || 0}</span>
                                        <span className="text-sm group-hover:text-primary" style={{ color: 'var(--neu-text-muted)' }}>Reposts</span>
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
                            <button onClick={() => setShowEditHistory(false)} className="neu-btn w-8 h-8 flex items-center justify-center rounded-xl">
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
                            <button onClick={() => setShowStatusHistory(false)} className="neu-btn w-8 h-8 flex items-center justify-center rounded-xl">
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
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-blue-400 text-[16px]">swap_horiz</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <span className="px-1.5 py-0.5 rounded bg-gray-500/15 font-medium" style={{ color: 'var(--neu-text-muted)' }}>
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
        </div>
    );
};
