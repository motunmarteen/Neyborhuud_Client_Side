/**
 * Search Types
 * Type definitions for the global search functionality
 */

export interface SearchParams {
  q: string;
  type?: "all" | "users" | "posts" | "locations";
  page?: number;
  limit?: number;
}

export interface SearchUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  isVerified?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
}

export interface SearchPost {
  id: string;
  content: string;
  title?: string;
  author: {
    username: string;
    firstName: string;
    lastName: string;
    name: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  mediaUrls?: string[];
  tags?: string[];
  likes?: number;
  comments?: number;
  echoes?: number;
  createdAt: string;
  contentType: string;
  isLiked?: boolean;
}

export interface SearchLocation {
  city: string;
  state: string;
  lga?: string;
  userCount?: number;
}

export interface SearchResultSection<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SearchResults {
  users?: SearchResultSection<SearchUser>;
  posts?: SearchResultSection<SearchPost>;
  locations?: SearchResultSection<SearchLocation>;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: {
    query: string;
    type: string;
    results: SearchResults;
    totalResults: number;
    timestamp: string;
  };
}
