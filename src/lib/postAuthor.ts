import type { Post, PostAuthor } from '@/types/api';

function asId(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value || undefined;
  if (typeof value === 'object') {
    const obj = value as { _id?: unknown; id?: unknown };
    const id = obj._id ?? obj.id;
    if (typeof id === 'string' && id) return id;
    if (id && typeof (id as { toString?: () => string }).toString === 'function') {
      const s = (id as { toString: () => string }).toString();
      return s && s !== '[object Object]' ? s : undefined;
    }
  }
  return undefined;
}

/** Resolve a stable Mongo user id for follow/block/chat actions on a post card. */
export function getPostAuthorUserId(post: Post): string | undefined {
  const author = post.author as PostAuthor | undefined;
  const fromAuthor = asId(author?.id) ?? asId((author as { _id?: unknown })?._id);
  if (fromAuthor && fromAuthor !== 'anonymous') return fromAuthor;

  const fromAuthorId = asId(post.authorId);
  if (fromAuthorId && fromAuthorId !== 'anonymous') return fromAuthorId;

  return undefined;
}
