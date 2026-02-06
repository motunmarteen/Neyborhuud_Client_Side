/**
 * Follow/Unfollow Type Definitions
 * Types for the follow system API responses
 */

export interface FollowResponse {
  success: boolean;
  message: string;
  data: {
    follow: {
      id: string;
      followerId: string;
      followingId: string;
      createdAt: string;
    };
    followerCount: number;
    followingCount: number;
  };
}

export interface UnfollowResponse {
  success: boolean;
  message: string;
  data: {
    unfollowedUserId: string;
    followerCount: number;
    followingCount: number;
  };
}

export interface FollowStatus {
  isFollowing: boolean;
  followsYou: boolean;
  isMutual: boolean;
}

export interface FollowStatusResponse {
  success: boolean;
  message: string;
  data: FollowStatus;
}

export interface FollowerUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  profilePicture: string;
  bio: string;
  isVerified: boolean;
  followedAt: string;
}

export interface FollowersResponse {
  success: boolean;
  message: string;
  data: {
    followers: FollowerUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface FollowingResponse {
  success: boolean;
  message: string;
  data: {
    following: FollowerUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
