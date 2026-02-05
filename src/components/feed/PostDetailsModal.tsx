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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-gray-900/50 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="bg-white dark:bg-black w-full max-w-2xl h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={onClose}
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <i className="bi bi-arrow-left text-xl" />
                        </button>
                        <h2 className="font-bold text-lg">Post</h2>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-10 h-10 border-4 border-neon-green border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 animate-pulse font-medium">Loading conversation...</p>
                        </div>
                    ) : isError || !details ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <i className="bi bi-exclamation-circle text-4xl text-red-500 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Failed to load post</h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                                {error instanceof Error ? error.message : "Something went wrong while fetching the post details."}
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2 bg-neon-green text-white rounded-full font-bold hover:bg-neon-green/90 transition-all active:scale-95"
                            >
                                Back to Feed
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {/* Main Post Section */}
                            <div className="px-4 py-4">
                                <div className="flex gap-3 mb-4">
                                    <img
                                        src={(details.content.author as PostAuthor)?.avatarUrl || 'https://i.pravatar.cc/100?u=author'}
                                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                                        alt="Author"
                                    />
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="font-bold text-[16px] text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
                                            {(details.content.author as PostAuthor)?.name || 'Anonymous'}
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                                            @{(details.content.author as PostAuthor)?.username || 'user'}
                                        </div>
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <i className="bi bi-three-dots" />
                                    </button>
                                </div>

                                <div className="text-[18px] text-gray-900 dark:text-gray-100 leading-normal mb-4 whitespace-pre-wrap break-words">
                                    {details.content.content || details.content.body}
                                </div>

                                {/* Media Gallery */}
                                {details.content.media && details.content.media.length > 0 && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                                        <div className={`grid gap-0.5 ${details.content.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {details.content.media.map((m, idx) => {
                                                const url = typeof m === 'string' ? m : m.url;
                                                return (
                                                    <div key={idx} className={`${details.content.media && details.content.media.length > 1 ? 'aspect-square' : 'aspect-auto max-h-[500px]'} relative bg-gray-100 dark:bg-gray-900`}>
                                                        <img src={url} className="w-full h-full object-cover" alt="Post media" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="text-[15px] text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                    {formatTimeAgo(details.content.createdAt)}
                                </div>

                                {/* Stats Bar */}
                                <div className="flex items-center gap-8 py-3 border-b border-gray-100 dark:border-gray-800 px-1 overflow-x-auto no-scrollbar">
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-pink-600">
                                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-pink-600">{details.content.likes || 0}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-pink-600">Likes</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-blue-500">
                                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-500">{details.content.comments || 0}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500">Replies</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 transition-colors group cursor-pointer hover:text-green-500">
                                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-green-500">{details.content.shares || 0}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-green-500">Reposts</span>
                                    </div>
                                </div>

                                {/* Post Comment Form */}
                                <div className="mt-4">
                                    {postId && <CommentForm postId={postId} placeholder="Post your reply" />}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="px-4 pb-20">
                                {details.comments && details.comments.length > 0 ? (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {postId && details.comments.map((comment) => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                postId={postId}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-gray-500">
                                        <i className="bi bi-chat-dots text-3xl mb-3 block opacity-20" />
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
