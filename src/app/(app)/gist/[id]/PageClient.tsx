'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { useHuudGistDetail, useHuudGistMutations } from '@/hooks/useHuudGist';
import { useAuth } from '@/hooks/useAuth';
import { gistSectionLabel } from '@/types/huudGist';
import { formatTimeAgo } from '@/utils/timeAgo';

function HuudGistDetailInner() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const { data, isLoading, isError, error } = useHuudGistDetail(threadId);
  const mutations = useHuudGistMutations(threadId);

  const thread = data?.gossip;
  const comments = data?.comments ?? [];
  const isOwner =
    user && thread?.author?.id && user.id === thread.author.id && !thread.anonymous;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await mutations.addComment({ body: comment.trim(), anonymous });
    setComment('');
  };

  if (isLoading) {
    return (
      <AppBrowseLayout maxWidth="680">
        <div className="mod-card flex flex-col gap-2 rounded-2xl p-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mod-inset h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      </AppBrowseLayout>
    );
  }

  if (isError || !thread) {
    const status = (error as AxiosError)?.response?.status;
    const needsSignIn = status === 401;

    return (
      <AppBrowseLayout maxWidth="680">
        <BrowseEmptyState
          icon={needsSignIn ? 'login' : 'forum'}
          title={needsSignIn ? 'Sign in to view this thread' : 'Thread not found'}
          description={
            needsSignIn
              ? 'Huud Gist threads are available to signed-in neighbours.'
              : 'This gist may have been removed.'
          }
          filledIcon
          action={
            needsSignIn ? (
              <Link
                href={`/login?redirect=/gist/${threadId}`}
                className="mod-chip mod-chip-active inline-flex rounded-full px-4 py-2 text-sm font-bold text-primary"
              >
                Sign in
              </Link>
            ) : (
              <Link
                href="/gist"
                className="mod-chip mod-chip-active inline-flex rounded-full px-4 py-2 text-sm font-bold text-primary"
              >
                Back to Huud Gist
              </Link>
            )
          }
        />
      </AppBrowseLayout>
    );
  }

  return (
    <AppBrowseLayout maxWidth="680">
      <div className="space-y-4">
        <Link
          href="/gist"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--neu-text-muted)] hover:text-primary"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Huud Gist
        </Link>

        <article className="mod-card rounded-2xl p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="mod-chip rounded-full px-2 py-0.5 text-[10px] font-bold text-primary">
              {gistSectionLabel(thread.discussionType)}
            </span>
            <span className="text-[11px] text-[var(--neu-text-muted)]">
              {formatTimeAgo(thread.createdAt)}
            </span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
            {thread.title}
          </h1>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--neu-text-muted)]">
            {thread.body}
          </p>
          {thread.mediaUrls?.length ? (
            <div className="mt-3 grid gap-2">
              {thread.mediaUrls.map((url, i) => (
                <img key={i} src={url} alt="" className="max-h-80 w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-4 border-t pt-3 text-sm text-[var(--neu-text-muted)]">
            <button
              type="button"
              onClick={() => mutations.likeThread()}
              className={`inline-flex items-center gap-1 ${thread.isLiked ? 'text-brand-red' : ''}`}
            >
              <span className="material-symbols-outlined text-[18px]">favorite</span>
              {thread.likeCount}
            </button>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              {thread.commentCount}
            </span>
            {isOwner ? (
              <button
                type="button"
                onClick={async () => {
                  await mutations.deleteThread();
                  router.push('/gist');
                }}
                className="ml-auto text-brand-red"
              >
                Delete
              </button>
            ) : null}
          </div>
        </article>

        <form onSubmit={handleComment} className="mod-card rounded-2xl p-4">
          <h2 className="mb-2 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            Add a comment
          </h2>
          {!user ? (
            <p className="text-sm text-[var(--neu-text-muted)]">
              <Link href="/login" className="font-semibold text-primary">
                Sign in
              </Link>{' '}
              to join the conversation.
            </p>
          ) : (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts…"
                className="mod-inset mb-2 min-h-[80px] w-full rounded-xl px-3 py-2 text-sm"
              />
              <label className="mb-3 flex items-center gap-2 text-xs text-[var(--neu-text-muted)]">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                Anonymous
              </label>
              <button
                type="submit"
                disabled={mutations.isCommenting || !comment.trim()}
                className="mod-chip mod-chip-active rounded-full px-4 py-2 text-sm font-bold text-primary disabled:opacity-50"
              >
                {mutations.isCommenting ? 'Posting…' : 'Post comment'}
              </button>
            </>
          )}
        </form>

        {comments.length > 0 ? (
          <div className="mod-card divide-y overflow-hidden rounded-2xl">
            {comments.map((c) => (
              <div key={c.id || c._id} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--neu-text)' }}>
                    {c.anonymous ? 'Anonymous' : c.author?.name || c.author?.username}
                  </p>
                  {c.createdAt ? (
                    <span className="text-[10px] text-[var(--neu-text-muted)]">
                      {formatTimeAgo(c.createdAt)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[var(--neu-text-muted)]">{c.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--neu-text-muted)]">
            No comments yet — be the first to reply.
          </p>
        )}
      </div>
    </AppBrowseLayout>
  );
}

export default function HuudGistDetailPage() {
  return (
    <Suspense fallback={null}>
      <HuudGistDetailInner />
    </Suspense>
  );
}
