import apiClient from '@/lib/api-client';

/** Lost & Found — server: /api/v1/lost-found (NeyborHuud_Server_Side modules/lostfound). */

export const LF_CATEGORIES = [
  { id: 'phone', label: 'Phone', icon: '📱' },
  { id: 'wallet', label: 'Wallet / purse', icon: '👛' },
  { id: 'bag', label: 'Bag', icon: '🎒' },
  { id: 'keys', label: 'Keys', icon: '🔑' },
  { id: 'documents', label: 'ID / documents', icon: '🪪' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'jewellery', label: 'Jewellery', icon: '💍' },
  { id: 'clothing', label: 'Clothing', icon: '👕' },
  { id: 'pet', label: 'Pet', icon: '🐕' },
  { id: 'other', label: 'Something else', icon: '📦' },
] as const;

export const MAX_PLEDGE = 500;

export type LfKind = 'lost' | 'found';
export type LfItem = {
  kind: LfKind;
  itemName: string;
  category: string;
  place: string;
  seenAt: string;
  pledge: number;
  pledgeStatus: 'none' | 'held' | 'assigned' | 'released' | 'refunded';
  status: 'open' | 'matched' | 'returned' | 'closed';
};

export type LfReward = {
  status: 'none' | 'held' | 'review' | 'paid' | 'blocked' | 'reversed';
  amount: number;
  pledgeAmount: number;
  releaseAt: string | null;
  blockedReasons: string[];
};

export type LfClaim = {
  id: string;
  postId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'returned' | 'cancelled';
  role: 'owner' | 'finder' | null;
  isPoster: boolean;
  message: string;
  acceptedAt: string | null;
  returnedAt: string | null;
  codeExpiresAt: string | null;
  codeAttemptsLeft: number;
  reward: LfReward | null;
  helperRewarded: boolean;
  createdAt: string;
};

export type LfMyView = {
  item: LfItem;
  isPoster: boolean;
  myClaim: LfClaim | null;
  activeClaim: LfClaim | null;
  pendingClaims: number;
  returned: { claimId: string; rewardStatus: string; canFlag: boolean } | null;
};

export type LfPosterClaim = {
  _id: string;
  claimantId: string;
  message: string;
  status: LfClaim['status'];
  createdAt: string;
};

const data = <T>(res: unknown) => ((res as { data?: T })?.data ?? res) as T;

export async function createLostFound(input: {
  kind: LfKind;
  itemName: string;
  category: string;
  place: string;
  seenAt?: string;
  body?: string;
  mediaUrls?: string[];
  secretDetail: string;
  pledge?: number;
}) {
  return data<{ postId: string }>(await apiClient.post('/lost-found', input));
}

export const myView = async (postId: string) => data<LfMyView>(await apiClient.get(`/lost-found/${postId}/me`));
export const listClaims = async (postId: string) =>
  data<{ yourSecretDetail: string | null; claims: LfPosterClaim[] }>(await apiClient.get(`/lost-found/${postId}/claims`));
export const createClaim = async (postId: string, message: string) =>
  data<{ claimId: string }>(await apiClient.post(`/lost-found/${postId}/claims`, { message }));
export const acceptClaim = async (claimId: string) => data(await apiClient.post(`/lost-found/claims/${claimId}/accept`));
export const rejectClaim = async (claimId: string) => data(await apiClient.post(`/lost-found/claims/${claimId}/reject`));
export const getClaim = async (claimId: string) =>
  data<{ claim: LfClaim; item: Pick<LfItem, 'kind' | 'itemName' | 'place' | 'status'> | null; postAuthorId: string | null }>(
    await apiClient.get(`/lost-found/claims/${claimId}`),
  );
export const getCode = async (claimId: string, fresh = false) =>
  data<{ code: string; expiresAt: string }>(await apiClient.get(`/lost-found/claims/${claimId}/code${fresh ? '?new=1' : ''}`));
export const confirmReturn = async (claimId: string, code: string) =>
  data<{ status: 'returned'; reward: { status: 'held' | 'blocked'; amount?: number; pledgeAmount?: number; releaseInHours?: number; reasons?: string[] } }>(
    await apiClient.post(`/lost-found/claims/${claimId}/return`, { code }),
  );
export const flagReturn = async (claimId: string, reason: string) => data(await apiClient.post(`/lost-found/claims/${claimId}/flag`, { reason }));
export const thankHelper = async (claimId: string, helperId: string) => data(await apiClient.post(`/lost-found/claims/${claimId}/helper`, { helperId }));
export const closeLostFound = async (postId: string) => data(await apiClient.post(`/lost-found/${postId}/close`));
