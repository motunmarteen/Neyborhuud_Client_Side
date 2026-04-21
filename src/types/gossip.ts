/**
 * Gossip Type Definitions
 * Types for anonymous gossip posts and comments
 */

export type DiscussionType =
  | "general"
  | "local_gist"
  | "recommendation_request"
  | "community_question"
  | "cultural_discussion"
  | "business_inquiry"
  | "social_update";

export interface GossipAuthor {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl: string | null;
  username: string;
}

export interface GossipLocation {
  lga?: string;
  state?: string;
  neighborhood?: string;
}

export interface SlangMeaning {
  term: string;
  meaning: string;
  region?: string;
}

export interface SlangEnrichment {
  hasSlang: boolean;
  detectedTerms: string[];
  sentiment: number;
  meanings?: SlangMeaning[];
}

export interface CulturalContext {
  categories: string[];
  holidays: string[];
  regions: string[];
  languages: string[];
  relevanceScore: number;
}

export interface GossipPost {
  id: string;
  _id?: string;
  title: string;
  body: string;
  anonymous: boolean;
  author: GossipAuthor;
  discussionType: DiscussionType;
  location?: GossipLocation;
  tags: string[];
  language?: string;
  likeCount: number;
  /** Server-resolved boolean — use this instead of checking likedBy array */
  isLiked?: boolean;
  likedBy?: string[];
  commentCount: number;
  viewCount: number;
  slangEnrichment?: SlangEnrichment;
  culturalContext?: CulturalContext;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface GossipComment {
  id: string;
  _id?: string;
  gossipId: string;
  body: string;
  anonymous: boolean;
  author: GossipAuthor;
  parentId?: string | null;
  depth: number;
  replyCount: number;
  likeCount: number;
  /** Server-resolved boolean — use this instead of checking likedBy array */
  isLiked?: boolean;
  likedBy?: string[];
  slangEnrichment?: SlangEnrichment;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGossipPayload {
  title: string;
  body: string;
  anonymous: boolean;
  discussion_type: DiscussionType;
  location?: GossipLocation;
  tags?: string[];
  language?: string;
  mediaUrls?: string[];
}

export interface UpdateGossipPayload {
  title?: string;
  body?: string;
  tags?: string[];
  discussion_type?: DiscussionType;
}

export interface CreateCommentPayload {
  body: string;
  anonymous: boolean;
  parentId?: string;
}

export interface GossipPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GossipListResponse {
  gossip: GossipPost[];
  pagination: GossipPagination;
}

export interface GossipDetailResponse {
  gossip: GossipPost;
  comments: GossipComment[];
}

export interface LikeResponse {
  liked: boolean;
}

export const DISCUSSION_TYPE_LABELS: Record<DiscussionType, string> = {
  general: "General",
  local_gist: "Local Gist",
  recommendation_request: "Requests",
  community_question: "Questions",
  cultural_discussion: "Cultural",
  business_inquiry: "Business",
  social_update: "Social",
};
