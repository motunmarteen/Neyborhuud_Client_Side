/**
 * Gossip Type Definitions
 * Types for anonymous gossip posts and comments
 */

export interface GossipAuthor {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl: string | null;
  username: string;
}

export interface GossipPost {
  id: string;
  title: string;
  body: string;
  anonymous: boolean;
  author: GossipAuthor;
  discussionType: 'safety' | 'general' | 'event' | 'question';
  location: {
    lga: string;
    state: string;
  };
  tags: string[];
  commentsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface GossipComment {
  id: string;
  gossipId: string;
  body: string;
  anonymous: boolean;
  author: GossipAuthor;
  createdAt: string;
}

export interface CreateGossipPayload {
  title: string;
  body: string;
  anonymous: boolean;
  discussion_type: string;
  location?: {
    lga: string;
    state: string;
  };
  tags?: string[];
}

export interface CreateCommentPayload {
  body: string;
  anonymous: boolean;
}
