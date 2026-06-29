import type { Post } from '@/types/api';

const SAMPLE_AUTHOR = {
  id: 'preview-author',
  name: 'NeyborHuud Demo',
  username: 'media_preview',
  avatarUrl: 'https://i.pravatar.cc/80?u=neyborhuud-preview',
  isVerified: true,
  verificationBadge: 'neighbor' as const,
};

const SAMPLE_LOCATION = { lga: 'Alimosho', state: 'Lagos' };

const SAMPLE_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

const IMG = {
  a: 'https://picsum.photos/seed/neybor-feed-a/900/560',
  b: 'https://picsum.photos/seed/neybor-feed-b/900/560',
  c: 'https://picsum.photos/seed/neybor-feed-c/900/560',
  d: 'https://picsum.photos/seed/neybor-feed-d/900/560',
  e: 'https://picsum.photos/seed/neybor-feed-e/900/560',
};

function basePost(id: string, content: string, media: Post['media']): Post {
  return {
    id,
    author: SAMPLE_AUTHOR,
    authorId: SAMPLE_AUTHOR.id,
    contentType: 'post',
    content,
    createdAt: new Date().toISOString(),
    location: SAMPLE_LOCATION,
    media,
    likes: 24,
    comments: 5,
    shares: 3,
    views: 312,
    isLiked: false,
    isSaved: false,
  };
}

export type FeedMediaPreviewSample = {
  id: string;
  label: string;
  hint: string;
  post: Post;
};

export const FEED_MEDIA_PREVIEW_SAMPLES: FeedMediaPreviewSample[] = [
  {
    id: 'single-image',
    label: 'Single image',
    hint: 'Full-width media with rounded corners.',
    post: basePost(
      'preview-single-image',
      'Market day vibes in the hood — one photo, full bleed inside the card.',
      [IMG.a],
    ),
  },
  {
    id: 'duo-images',
    label: 'Two images (X-style split)',
    hint: 'Side-by-side grid like the reference — both visible at once.',
    post: basePost(
      'preview-duo-images',
      'Transfer news drop! Two shots from today — player plus club badge style layout.',
      [IMG.a, IMG.b],
    ),
  },
  {
    id: 'carousel-images',
    label: 'Three+ images (swipe carousel)',
    hint: 'Swipe left — next slide peeks on the right, with dots and 1/4 counter.',
    post: basePost(
      'preview-carousel-images',
      'Weekend hangout dump 📸 Swipe through — you should see the next photo peeking on the right.',
      [IMG.a, IMG.b, IMG.c, IMG.d],
    ),
  },
  {
    id: 'carousel-mixed',
    label: 'Photos + video carousel',
    hint: 'Mixed media uses the carousel; only the active slide plays video.',
    post: basePost(
      'preview-carousel-mixed',
      'Block party recap — clip first, then stills. Tap mute on the video slide.',
      [
        SAMPLE_VIDEO,
        IMG.b,
        IMG.c,
        IMG.e,
      ],
    ),
  },
];

const QUOTER = {
  id: 'preview-quoter',
  name: 'AI',
  username: 'nonewthing',
  avatarUrl: 'https://i.pravatar.cc/80?u=neyborhuud-quoter',
  isVerified: true,
  verificationBadge: 'neighbor' as const,
};

const ORIGINAL_AUTHOR = {
  id: 'preview-original',
  name: 'WhoScored',
  username: 'WhoScored',
  avatarUrl: 'https://i.pravatar.cc/80?u=neyborhuud-whoscored',
  isVerified: true,
  verificationBadge: 'community_leader' as const,
};

const originalPost: Post = {
  id: 'preview-original-post',
  author: ORIGINAL_AUTHOR,
  authorId: ORIGINAL_AUTHOR.id,
  contentType: 'post',
  content:
    'Declan Rice has 7 G/A in his last 10 matches for England. 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🅰️',
  createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
  location: { lga: 'Westminster', state: 'London' },
  media: [IMG.a],
  likes: 497,
  comments: 9,
  shares: 28,
  views: 18000,
  isLiked: false,
  isSaved: false,
};

export type FeedRepostPreviewSample = {
  id: string;
  label: string;
  hint: string;
  post: Post;
};

export const FEED_REPOST_PREVIEW_SAMPLES: FeedRepostPreviewSample[] = [
  {
    id: 'quote-repost',
    label: 'Quote repost (X-style)',
    hint: 'Your comment on top, original post embedded below with border + media.',
    post: {
      id: 'preview-quote-repost',
      author: QUOTER,
      authorId: QUOTER.id,
      contentType: 'post',
      mood: 'repost',
      parentId: originalPost.id,
      content:
        'He and Jude are the same players. Just defensive/offensive versions of the same thing.',
      createdAt: new Date(Date.now() - 53 * 60 * 1000).toISOString(),
      location: { lga: 'Alimosho', state: 'Lagos' },
      media: [],
      quotedPost: originalPost,
      likes: 12,
      comments: 2,
      shares: 1,
      views: 420,
      isLiked: false,
      isSaved: false,
    },
  },
  {
    id: 'simple-repost',
    label: 'Simple repost',
    hint: 'No comment — just the embedded original post with a “Reposted” label.',
    post: {
      id: 'preview-simple-repost',
      author: QUOTER,
      authorId: QUOTER.id,
      contentType: 'post',
      mood: 'repost',
      parentId: originalPost.id,
      content: '',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      location: { lga: 'Alimosho', state: 'Lagos' },
      media: [],
      quotedPost: originalPost,
      likes: 3,
      comments: 0,
      shares: 0,
      views: 88,
      isLiked: false,
      isSaved: false,
    },
  },
  {
    id: 'quote-repost-duo',
    label: 'Quote repost (dual media original)',
    hint: 'Embedded post can include the same media slider layouts.',
    post: {
      id: 'preview-quote-repost-duo',
      author: QUOTER,
      authorId: QUOTER.id,
      contentType: 'post',
      mood: 'repost',
      parentId: 'preview-duo-original',
      content: 'This matchday energy is unmatched — had to quote this.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      location: { lga: 'Ikeja', state: 'Lagos' },
      media: [],
      quotedPost: {
        id: 'preview-duo-original',
        author: ORIGINAL_AUTHOR,
        authorId: ORIGINAL_AUTHOR.id,
        contentType: 'post',
        content: 'Two angles from training today. Which shot is cleaner?',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        media: [IMG.a, IMG.b],
        likes: 120,
        comments: 14,
        shares: 6,
        views: 2400,
        isLiked: false,
        isSaved: false,
      },
      likes: 8,
      comments: 1,
      shares: 2,
      views: 190,
      isLiked: false,
      isSaved: false,
    },
  },
];
