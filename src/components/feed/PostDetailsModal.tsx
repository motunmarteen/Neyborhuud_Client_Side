'use client';

import React, { useEffect, useRef } from 'react';
import { usePost } from '@/hooks/usePosts';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { PostAuthor } from '@/types/api';

interface PostDetailsModalProps {
    postId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PostDetailsModal: React.FC<PostDetailsModalProps> = ({ postId, isOpen, onClose }) => {
    const { data: details, isLoading, isError, error } = usePost(postId);
    const modalRef = useRef<HTMLDivElement>(null);

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

                                <div className="text-[15px] mb-4" style={{ color: 'var(--neu-text-muted)' }}>
                                    {formatTimeAgo(details.content.createdAt)}
                                </div>
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
        </div>
    );
};
