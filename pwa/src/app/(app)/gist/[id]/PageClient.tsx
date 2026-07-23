'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
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
      <div className="flex flex-1 w-full !h-[100dvh] !min-h-[100dvh] flex-col overflow-hidden !bg-white">
        <TopNav />
        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-col bg-white border-y border-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-3 px-6 py-5 border-b border-gray-100 last:border-b-0 animate-pulse">
                <div className="h-4 w-1/4 rounded bg-slate-100" />
                <div className="h-6 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (isError || !thread) {
    const status = (error as AxiosError)?.response?.status;
    const needsSignIn = status === 401;

    return (
      <div className="flex flex-1 w-full !h-[100dvh] !min-h-[100dvh] flex-col overflow-hidden !bg-white">
        <TopNav />
        <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden p-6">
          <BrowseEmptyState
            icon={needsSignIn ? 'login' : 'forum'}
            title={needsSignIn ? 'Sign in to view this thread' : 'Thread not found'}
            description={
              needsSignIn
                 ? 'Huud Gist threads are available to signed-in neighbours.'
                 : 'This gist may have been removed.'
            }
            filledIcon
            className="flex flex-col items-center justify-center text-center gap-3 !border-none !bg-transparent !shadow-none !px-6 !my-0 py-10"
            action={
              needsSignIn ? (
                <Link
                  href={`/login?redirect=/gist/${threadId}`}
                  className="rounded-full bg-primary hover:bg-brand-green-dark px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors no-underline"
                >
                  Sign in
                </Link>
              ) : (
                <Link
                  href="/gist"
                  className="rounded-full bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-bold text-slate-700 no-underline"
                >
                  Back to Huud Gist
                </Link>
              )
            }
          />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full !h-[100dvh] !min-h-[100dvh] flex-col overflow-hidden !bg-white">
      <TopNav />

      <div className="app-chrome-below-topnav mx-auto w-full max-w-[600px] !bg-white flex flex-col flex-1 overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center shrink-0">
          <Link
            href="/gist"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary no-underline transition-colors"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Gist
          </Link>
        </div>

        {/* Scrollable Thread Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <article className="bg-white px-6 py-6 border-b border-gray-100 flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {gistSectionLabel(thread.discussionType)}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {formatTimeAgo(thread.createdAt)}
              </span>
            </div>
            <h1 className="text-[20px] font-black leading-tight text-slate-800">
              {thread.title}
            </h1>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-650">
              {thread.body}
            </p>
            {thread.mediaUrls?.length ? (
              <div className="mt-4 grid gap-2">
                {thread.mediaUrls.map((url, i) => (
                  <div key={i} className="relative h-80 w-full overflow-hidden rounded-xl">
                    <Image src={url} alt="" fill sizes="(max-width: 640px) 100vw, 600px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex items-center gap-4 border-t border-gray-100 pt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <button
                type="button"
                onClick={() => mutations.likeThread()}
                className={`inline-flex items-center gap-1.5 transition-colors ${thread.isLiked ? 'text-brand-red' : 'hover:text-brand-red'}`}
              >
                <span className="material-symbols-outlined text-[18px]">favorite</span>
                {thread.likeCount}
              </button>
              <span className="inline-flex items-center gap-1.5">
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
                  className="ml-auto text-brand-red hover:underline"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </article>

          <form onSubmit={handleComment} className="bg-white px-6 py-6 border-b border-gray-100 flex flex-col">
            <h2 className="mb-3 text-[14px] font-bold text-slate-800 uppercase tracking-wider">
              Add a comment
            </h2>
            {!user ? (
              <p className="text-sm text-slate-500 font-medium">
                <Link href="/login" className="font-bold text-primary no-underline hover:underline">
                  Sign in
                </Link>{' '}
                to join the conversation.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts…"
                  className="w-full min-h-[96px] rounded-2xl border border-gray-200 bg-[#F4F5F6] p-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-350 focus:bg-[#EDEDEE] transition-all"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    Anonymous Post
                  </label>
                  <button
                    type="submit"
                    disabled={mutations.isCommenting || !comment.trim()}
                    className="rounded-full bg-primary hover:bg-brand-green-dark px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50"
                  >
                    {mutations.isCommenting ? 'Posting…' : 'Post comment'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {comments.length > 0 ? (
            <div className="flex flex-col bg-white border-b border-gray-100 divide-y divide-gray-100">
              {comments.map((c) => (
                <div key={c.id || c._id} className="px-6 py-4.5 bg-white flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-700">
                      {c.anonymous ? 'Anonymous' : c.author?.name || c.author?.username}
                    </p>
                    {c.createdAt ? (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-slate-650">{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 bg-white border-b border-gray-100 text-center">
              <p className="text-sm font-semibold text-slate-400">
                No comments yet — be the first to reply.
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default function HuudGistDetailPage() {
  return (
    <Suspense fallback={null}>
      <HuudGistDetailInner />
    </Suspense>
  );
}
