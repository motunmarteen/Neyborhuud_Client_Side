/**
 * Block/Unblock Type Definitions
 */

export interface BlockResponse {
  success: boolean;
  message: string;
  data: {
    block: {
      id: string;
      blockedUserId: string;
      createdAt: string;
    };
  };
}

export interface UnblockResponse {
  success: boolean;
  message: string;
  data: {
    unblockedUserId: string;
  };
}

export interface BlockStatus {
  isBlocked: boolean;
  isBlockedByThem: boolean;
  isEitherBlocked: boolean;
}

export interface BlockedUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  profilePicture: string;
  bio: string;
  blockedAt: string;
}

export interface BlockedUsersResponse {
  blockedUsers: BlockedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
