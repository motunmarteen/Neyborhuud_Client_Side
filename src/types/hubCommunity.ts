export type HubCategory =
  | 'security'
  | 'residents'
  | 'trade'
  | 'sports'
  | 'volunteer'
  | 'general';

export type HubActivityLevel = 'High' | 'Moderate' | 'Low';

export interface HubCommunity {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: HubCategory;
  categoryLabel: string;
  icon: string;
  imageUrl: string | null;
  visibility: 'public' | 'private';
  membersCount: number;
  activityLevel: HubActivityLevel;
  conversationId: string;
  joined: boolean;
  myRole: string | null;
  settings?: {
    onlyAdminsCanPost: boolean;
    allowMemberInvites: boolean;
    joinApprovalRequired: boolean;
  };
  largeGroupMode?: boolean;
  createdAt?: string;
}

export interface HubJoinRequestItem {
  id: string;
  userId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string | null;
  message?: string;
  createdAt?: string;
}

export interface HubInviteInfo {
  code: string;
  inviteUrl: string;
  expiresAt?: string;
  maxUses?: number;
  useCount?: number;
}

export type MessageReactionsMap = Record<
  string,
  { count: number; userIds: string[] }
>;

export interface CreateHubPayload {
  name: string;
  description?: string;
  category?: HubCategory;
  icon?: string;
  imageUrl?: string;
  visibility?: 'public' | 'private';
  settings?: {
    onlyAdminsCanPost?: boolean;
    allowMemberInvites?: boolean;
    joinApprovalRequired?: boolean;
  };
}
