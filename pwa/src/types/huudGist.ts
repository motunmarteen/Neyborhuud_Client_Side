/**
 * Huud Gist — community discussions (Nairaland-style threads in Local News)
 * Section ids/types are validated by GET /api/v1/huud-gist/sections.
 */

export type GistSectionId = 'all' | (string & {});

/** Discussion type slug — must match backend huudGist.registry discussionType values. */
export type DiscussionType = string;

export interface GistSection {
  id: GistSectionId;
  label: string;
  icon: string;
  description?: string | null;
}

export interface HuudGistAuthor {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl: string | null;
  username: string;
}

export interface HuudGistLocation {
  lga?: string;
  state?: string;
  neighborhood?: string;
}

export interface HuudGistPost {
  id: string;
  _id?: string;
  title: string;
  body: string;
  anonymous: boolean;
  author: HuudGistAuthor;
  discussionType: DiscussionType;
  location?: HuudGistLocation;
  tags: string[];
  language?: string;
  likeCount: number;
  isLiked?: boolean;
  commentCount: number;
  viewCount: number;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface HuudGistComment {
  id: string;
  _id?: string;
  gossipId: string;
  body: string;
  anonymous: boolean;
  author: HuudGistAuthor;
  parentId?: string | null;
  depth: number;
  replyCount: number;
  likeCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateHuudGistPayload {
  title: string;
  body: string;
  anonymous: boolean;
  discussion_type: DiscussionType;
  location?: HuudGistLocation;
  tags?: string[];
  language?: string;
  mediaUrls?: string[];
}

export interface UpdateHuudGistPayload {
  title?: string;
  body?: string;
  tags?: string[];
  discussion_type?: DiscussionType;
}

export interface CreateGistCommentPayload {
  body: string;
  anonymous: boolean;
  parentId?: string;
}

export interface HuudGistPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HuudGistListResponse {
  gossip: HuudGistPost[];
  pagination: HuudGistPagination;
}

export interface HuudGistDetailResponse {
  gossip: HuudGistPost;
  comments: HuudGistComment[];
}

export interface GistLikeResponse {
  liked: boolean;
}

/** Offline fallback labels when sections API is unavailable. */
export const GIST_SECTION_LABELS: Record<string, string> = {
  general: 'General',
  local_gist: 'Local Gist',
  recommendation_request: 'Recommendations',
  community_question: 'Ask Huud',
  cultural_discussion: 'Culture',
  business_inquiry: 'Business & Economy',
  social_update: 'Social',
  sports: 'Sports',
  entertainment: 'Entertainment',
  education: 'Education',
  technology: 'Technology',
  music: 'Music',
  media: 'Media',
  investment: 'Investment',
  agriculture: 'Agriculture',
  university: 'University',
  nysc: 'NYSC',
  fashion: 'Fashion & Style',
  health_wellness: 'Health & Wellness',
  comedy_memes: 'Comedy & Memes',
  politics: 'Politics',
  religion: 'Religion & Faith',
  relationships: 'Family & Relationships',
  traffic_transport: 'Traffic & Transport',
  property_rent: 'Property & Rent',
  food_places: 'Food & Places',
};

export function gistSectionLabel(
  discussionType: string,
  sections?: GistSection[],
): string {
  const match = sections?.find((s) => s.id === discussionType);
  return match?.label ?? GIST_SECTION_LABELS[discussionType] ?? 'Gist';
}

export function gistPostId(post: HuudGistPost) {
  return post.id ?? post._id ?? '';
}
