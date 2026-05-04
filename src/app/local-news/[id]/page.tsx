/**
 * Gossip Detail Page
 * Full gossip post view with comments, likes, edit/delete
 */

'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import MapPinAvatar from '@/components/ui/MapPinAvatar';
import { CommentThread } from '@/components/gossip/CommentThread';
import { GossipCommentInput } from '@/components/gossip/GossipCommentInput';
import { EditGossipModal } from '@/components/gossip/EditGossipModal';
import { useGossipDetail, useGossipMutations, useGossipComments, useCommentMutations } from '@/hooks/useGossip';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/utils/timeAgo';
import { DISCUSSION_TYPE_LABELS, DiscussionType } from '@/types/gossip';

function GossipDetailInner() {
    const params = useParams();
    const router = useRouter();
    const gossipId = params.id as string;
    const { user } = useAuth();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [replyParentIds, setReplyParentIds] = useState<Record<string, boolean>>({});

    const { data, isLoading, isError, error } = useGossipDetail(gossipId);
    const mutations = useGossipMutations(gossipId);
    const commentMutations = useCommentMutations(gossipId);
    const { data: commentPages, fetchNextPage, hasNextPage } = useGossipComments(gossipId);

    const gossip = data?.gossip;
    const comments = data?.comments || [];

    const isOwner = user && gossip?.author?.id && user.id === gossip.author.id && !gossip.anonymous;
    const isLiked = gossip?.isLiked ?? false;

    const typeLabel = gossip
        ? DISCUSSION_TYPE_LABELS[gossip.discussionType as DiscussionType] || gossip.discussionType
        : '';

    const handleLike = () => mutations.likeGossip();

    const handleDelete = async () => {
        await mutations.deleteGossip();
        router.push('/local-news');
    };

    const handleComment = async (body: string, anonymous: boolean, parentId?: string) => {
        await mutations.addComment({ body, anonymous, parentId });
    };

    const handleLoadReplies = (parentId: string) => {
        setReplyParentIds((prev) => ({ ...prev, [parentId]: true }));
    };

    const getDiscussionTypeColor = (type: string) => {
        switch (type) {
            case 'safety': return 'bg-red-500/10 text-red-400';
            case 'cultural_discussion': return 'bg-amber-500/10 text-amber-400';
            case 'local_gist': return 'bg-green-500/10 text-green-400';
            case 'community_question':
            case 'recommendation_request': return 'bg-purple-500/10 text-purple-400';
            case 'business_inquiry': return 'bg-blue-500/10 text-blue-400';
            case 'social_update': return 'bg-cyan-500/10 text-cyan-400';
            default: return 'neu-chip';
        }
    };

    if (isLoading) {
        return (
            <div className="relative flex h-screen w-full flex-col overflow-hidden">
                <TopNav />
                <div className="flex flex-1 overflow-hidden">
                    <Suspense fallback={<div className="w-64" />}>
                        <LeftSidebar />
                    </Suspense>
                    <main className="flex-1 overflow-y-auto flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </main>
                    <RightSidebar />
                </div>
                <div className="md:hidden">
                    <Suspense fallback={<div className="h-16" />}>
                        <BottomNav />
                    </Suspense>
                </div>
            </div>
        );
    }

    if (isError || !gossip) {
        return (
            <div className="relative flex h-screen w-full flex-col overflow-hidden">
                <TopNav />
                <div className="flex flex-1 overflow-hidden">
                    <Suspense fallback={<div className="w-64" />}>
                        <LeftSidebar />
                    </Suspense>
                    <main className="flex-1 overflow-y-auto px-4 py-6">
                        <div className="max-w-[680px] mx-auto">
                            <div className="neu-card-sm rounded-2xl p-8 text-center">
                                <span className="material-symbols-outlined text-4xl text-red-400 mb-4">error</span>
                                <p className="text-sm mb-2" style={{ color: 'var(--neu-text)' }}>
                                    {error instanceof Error ? error.message : 'Discussion not found'}
                                </p>
                                <button
                                    onClick={() => router.push('/local-news')}
                                    className="mt-4 px-6 py-2.5 neu-btn rounded-2xl text-sm font-bold text-primary"
                                >
                                    Back to Local News
                                </button>
                            </div>
                        </div>
                    </main>
                    <RightSidebar />
                </div>
                <div className="md:hidden">
                    <Suspense fallback={<div className="h-16" />}>
                        <BottomNav />
                    </Suspense>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            <TopNav />
            <div className="flex flex-1 overflow-hidden">
                <Suspense fallback={<div className="w-64" />}>
                    <LeftSidebar />
                </Suspense>

                <main className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-[680px] mx-auto flex flex-col gap-4 pb-20">
                        {/* Back button */}
                        <button
                            onClick={() => router.push('/local-news')}
                            className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors self-start"
                            style={{ color: 'var(--neu-text-muted)' }}
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back
                        </button>

                        {/* Main Post */}
                        <article className="neu-card-sm rounded-2xl p-5">
                            {/* Author */}
                            <div className="flex items-start gap-3">
                                {!gossip.anonymous && gossip.author?.username ? (
                                    <Link href={`/profile/${gossip.author.username}`}>
                                        <MapPinAvatar
                                            src={gossip.author.avatarUrl}
                                            alt={gossip.author.name}
                                            size="md"
                                        />
                                    </Link>
                                ) : (
                                    <MapPinAvatar src={null} alt="Anonymous" size="md" fallbackInitial="?" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {!gossip.anonymous && gossip.author?.username ? (
                                            <Link
                                                href={`/profile/${gossip.author.username}`}
                                                className="font-bold text-[16px] hover:underline"
                                                style={{ color: 'var(--neu-text)' }}
                                            >
                                                {gossip.author.name}
                                            </Link>
                                        ) : (
                                            <span className="font-bold text-[16px]" style={{ color: 'var(--neu-text)' }}>
                                                Anonymous NeyburH
                                            </span>
                                        )}
                                        {gossip.anonymous && (
                                            <span className="neu-chip px-2 py-0.5 text-xs rounded-full flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
                                                <span className="material-symbols-outlined text-xs">lock</span>
                                                Anonymous
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                                        {formatTimeAgo(gossip.createdAt)}
                                    </span>
                                </div>

                                {/* Owner actions */}
                                {isOwner && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                                            title="Edit"
                                        >
                                            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>edit</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                            title="Delete"
                                        >
                                            <span className="material-symbols-outlined text-lg text-red-400">delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${getDiscussionTypeColor(gossip.discussionType)}`}>
                                    {typeLabel}
                                </span>
                                {gossip.culturalContext && gossip.culturalContext.categories.length > 0 && (
                                    gossip.culturalContext.categories.map((cat) => (
                                        <span key={cat} className="px-2 py-0.5 text-xs rounded-full font-medium bg-amber-500/10 text-amber-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">public</span>
                                            {cat}
                                        </span>
                                    ))
                                )}
                                {gossip.slangEnrichment?.hasSlang && (
                                    <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-500/10 text-green-400">
                                        🇳🇬 Pidgin
                                    </span>
                                )}
                                {gossip.language && gossip.language !== 'en' && (
                                    <span className="px-2 py-0.5 text-xs rounded-full font-medium neu-chip" style={{ color: 'var(--neu-text-muted)' }}>
                                        {gossip.language.toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Title & Body */}
                            <h1 className="font-bold text-xl mt-4" style={{ color: 'var(--neu-text)' }}>
                                {gossip.title}
                            </h1>
                            <p className="text-[15px] leading-6 mt-2 whitespace-pre-wrap break-words" style={{ color: 'var(--neu-text)' }}>
                                {gossip.body}
                            </p>

                            {/* Media grid */}
                            {gossip.mediaUrls && gossip.mediaUrls.length > 0 && (
                                <div className={`mt-4 grid gap-2 rounded-xl overflow-hidden ${gossip.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                    {gossip.mediaUrls.map((url, i) => (
                                        <div key={i} className={`relative rounded-xl overflow-hidden bg-black/10 ${gossip.mediaUrls!.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                                            <img src={url} alt={`media ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Slang meanings */}
                            {gossip.slangEnrichment?.hasSlang && gossip.slangEnrichment.meanings && gossip.slangEnrichment.meanings.length > 0 && (
                                <div className="mt-3 p-3 neu-socket rounded-xl">
                                    <p className="text-[11px] font-medium mb-1.5 flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
                                        <span className="material-symbols-outlined text-xs">translate</span>
                                        Slang glossary
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        {gossip.slangEnrichment.meanings.map((m) => (
                                            <span
                                                key={m.term}
                                                className="text-[12px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400"
                                            >
                                                <strong>{m.term}</strong>: {m.meaning}
                                                {m.region && m.region !== 'national' && (
                                                    <span className="opacity-60 ml-1">({m.region})</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {gossip.tags && gossip.tags.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {gossip.tags.map((tag) => (
                                        <span key={tag} className="text-primary text-[13px] hover:underline cursor-pointer">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Location */}
                            {gossip.location && (gossip.location.lga || gossip.location.state) && (
                                <div className="flex items-center gap-1 mt-3 text-[13px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span>{[gossip.location.lga, gossip.location.state].filter(Boolean).join(', ')}</span>
                                </div>
                            )}

                            {/* Cultural holidays */}
                            {gossip.culturalContext?.holidays && gossip.culturalContext.holidays.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                    {gossip.culturalContext.holidays.map((h) => (
                                        <span key={h} className="text-[12px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">celebration</span>
                                            {h}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Stats bar */}
                            <div className="flex items-center gap-6 mt-4 pt-3 border-t" style={{ borderColor: 'var(--neu-shadow-light)', color: 'var(--neu-text-muted)' }}>
                                <button
                                    onClick={handleLike}
                                    disabled={mutations.isLiking}
                                    className="flex items-center gap-1.5 hover:text-red-400 transition-colors group"
                                >
                                    <span className={`material-symbols-outlined text-xl transition-colors ${
                                        isLiked ? 'fill-1 text-red-400' : 'group-hover:text-red-400'
                                    }`}>
                                        favorite
                                    </span>
                                    <span className="text-sm font-medium">{gossip.likeCount || 0}</span>
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xl">chat_bubble_outline</span>
                                    <span className="text-sm font-medium">{gossip.commentCount || 0}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xl">visibility</span>
                                    <span className="text-sm font-medium">{gossip.viewCount || 0}</span>
                                </div>
                            </div>
                        </article>

                        {/* Comment Input */}
                        <div className="neu-card-sm rounded-2xl p-4">
                            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--neu-text)' }}>
                                Add a comment
                            </h3>
                            <GossipCommentInput
                                onSubmit={handleComment}
                                isSubmitting={mutations.isCommenting}
                                placeholder="Share your thoughts on this discussion..."
                            />
                        </div>

                        {/* Comments Section */}
                        {comments.length > 0 && (
                            <div className="neu-card-sm rounded-2xl p-4">
                                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--neu-text)' }}>
                                    Comments ({gossip.commentCount || comments.length})
                                </h3>
                                <div className="divide-y" style={{ borderColor: 'var(--neu-shadow-light)' }}>
                                    {comments.map((comment) => (
                                        <CommentThread
                                            key={comment.id || comment._id}
                                            comment={comment}
                                            onReply={handleComment}
                                            isSubmitting={mutations.isCommenting}
                                            onLoadReplies={handleLoadReplies}
                                            currentUserId={user?.id}
                                            onLikeComment={commentMutations.likeComment}
                                            onDeleteComment={commentMutations.deleteComment}
                                            isLikingCommentId={commentMutations.likingCommentId}
                                            isDeletingCommentId={commentMutations.deletingCommentId}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty comments state */}
                        {comments.length === 0 && (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-3xl opacity-30" style={{ color: 'var(--neu-text-muted)' }}>
                                    chat_bubble_outline
                                </span>
                                <p className="text-sm mt-2" style={{ color: 'var(--neu-text-muted)' }}>
                                    No comments yet. Be the first to share your thoughts!
                                </p>
                            </div>
                        )}
                    </div>
                </main>

                <RightSidebar />
            </div>

            <div className="md:hidden">
                <Suspense fallback={<div className="h-16" />}>
                    <BottomNav />
                </Suspense>
            </div>

            {/* Edit Modal */}
            {showEditModal && gossip && (
                <EditGossipModal
                    gossip={gossip}
                    onClose={() => setShowEditModal(false)}
                    onSave={async (payload) => {
                        await mutations.updateGossip(payload);
                        setShowEditModal(false);
                    }}
                    isSubmitting={mutations.isUpdating}
                />
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="neu-modal rounded-2xl max-w-sm w-full p-6 text-center">
                        <span className="material-symbols-outlined text-4xl text-red-400 mb-3">warning</span>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--neu-text)' }}>Delete Discussion?</h3>
                        <p className="text-sm mb-6" style={{ color: 'var(--neu-text-muted)' }}>
                            This action cannot be undone. All comments will also be removed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 neu-btn rounded-2xl font-bold"
                                style={{ color: 'var(--neu-text)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={mutations.isDeleting}
                                className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {mutations.isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GossipDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen neu-base flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <GossipDetailInner />
        </Suspense>
    );
}
