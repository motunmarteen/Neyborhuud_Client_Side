/**
 * Complete TypeScript Type Definitions for NeyborHuud API
 * Version 1.0
 */

// ==================== Core API Response Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/** Feed metadata returned by backend */
export interface FeedMeta {
  feedType: "chronological" | "ranked";
  boostedCategories: string[];
  hasPinnedBulletins?: boolean;
  pinnedCount?: number;
}

/** Feed/list response from GET /feed or GET /content/posts – use response.data.content */
export interface FeedResponse<T> {
  content: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta?: FeedMeta;
}

/** Author shape returned by backend for posts (feed and create-post) */
export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

// ==================== User & Authentication Types ====================

export interface LocationData {
  latitude: number;
  longitude: number;
  state?: string;
  lga?: string;
  ward?: string;
  neighborhood?: string;
  formattedAddress?: string;
  resolutionSource?: "gps" | "ip" | "manual" | "geocoded";
}

export interface GamificationData {
  level: number;
  points: number;
  badges: Badge[];
  achievements: Achievement[];
  streak: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface UserSettings {
  language: "en" | "yo" | "ig" | "ha" | "pcm";
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    chat: boolean;
    mentions: boolean;
    likes: boolean;
    comments: boolean;
  };
  privacy: {
    profileVisibility: "public" | "friends" | "private";
    showLocation: boolean;
    showPhone: boolean;
    showEmail: boolean;
  };
  accessibility: {
    liteMode: boolean;
    textSize: "small" | "medium" | "large";
    highContrast: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  avatarUrl?: string | null; // Added for consistency with comments author shape
  coverPhoto?: string;
  bio?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  location: LocationData;
  verificationStatus: "unverified" | "pending" | "verified";
  identityVerified: boolean;
  isAdmin: boolean;
  role: "user" | "moderator" | "admin" | "super_admin";
  gamification: GamificationData;
  settings: UserSettings;
  createdAt: string;
  updatedAt: string;
}

// ==================== Content Types ====================

export interface MediaItem {
  id: string;
  type: "image" | "video" | "audio" | "document";
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  size: number;
  mimeType: string;
  caption?: string;
}

/** Post shape from backend: id, author (id/name/username/avatarUrl), content, media (URLs or items), createdAt, etc. */
export interface Post {
  id: string;
  userId?: string;
  /** Backend returns author with id, name, username, avatarUrl (same shape for feed and create-post) */
  author: (User & { name?: string; avatarUrl?: string | null }) | PostAuthor;
  type?: "text" | "image" | "video" | "poll" | "event" | "article";
  /** Post body – prefer content; backend sends both (GET /feed, GET /content/posts) */
  content: string;
  body?: string;
  /** Backend returns mediaUrls (array of URLs) or media (array of items); normalized to media */
  media?: (MediaItem | string)[];
  location?: LocationData | { lat?: number; lng?: number; lga?: string; [k: string]: unknown };
  visibility?: "public" | "friends" | "neighborhood" | "ward" | "lga" | "state";
  tags?: string[];
  mentions?: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isPinned?: boolean;
  isReported?: boolean;
  status?: "active" | "pending" | "removed" | "archived";
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  _id?: string; // Support for MongoDB _id
  postId?: string;
  userId: string | {
    id?: string;
    _id?: string;
    username: string;
    avatarUrl?: string | null;
    firstName?: string;
    lastName?: string;
  };
  content?: string;
  body: string; // The backend uses 'body' for the text content
  mediaUrls?: string[];
  parentId?: string;
  replies?: Comment[];
  likes: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostDetails {
  content: Post;
  comments: Comment[];
}

// ==================== Chat Types ====================

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  content: string;
  type: "text" | "image" | "video" | "audio" | "file" | "location";
  media?: MediaItem[];
  status: "sent" | "delivered" | "read";
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  groupName?: string;
  groupPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Events Types ====================

export interface Event {
  id: string;
  organizerId: string;
  organizer: User;
  title: string;
  description: string;
  type:
    | "community"
    | "social"
    | "sports"
    | "cultural"
    | "educational"
    | "business"
    | "other";
  location: LocationData;
  venue?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  capacity?: number;
  attendees: number;
  isAttending?: boolean;
  isFree: boolean;
  ticketPrice?: number;
  tags: string[];
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  visibility: "public" | "private" | "neighborhood";
  createdAt: string;
  updatedAt: string;
}

// ==================== Jobs Types ====================

export interface Job {
  id: string;
  employerId: string;
  employer: User;
  title: string;
  description: string;
  type: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  category: string;
  location: LocationData;
  workMode: "on-site" | "remote" | "hybrid";
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  };
  requirements: string[];
  skills: string[];
  applications: number;
  hasApplied?: boolean;
  status: "active" | "filled" | "closed";
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicant: User;
  coverLetter?: string;
  resumeUrl?: string;
  status: "pending" | "reviewing" | "shortlisted" | "rejected" | "accepted";
  createdAt: string;
  updatedAt: string;
}

// ==================== Marketplace Types ====================

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  seller: User;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  condition: "new" | "like-new" | "good" | "fair" | "poor";
  images: string[];
  location: LocationData;
  delivery: {
    available: boolean;
    fee?: number;
    methods: string[];
  };
  negotiable: boolean;
  quantity: number;
  views: number;
  likes: number;
  isLiked?: boolean;
  isSaved?: boolean;
  status: "available" | "sold" | "reserved" | "removed";
  createdAt: string;
  updatedAt: string;
}

// ==================== Services Types ====================

export interface Service {
  id: string;
  providerId: string;
  provider: User;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  pricing: {
    type: "fixed" | "hourly" | "custom";
    amount?: number;
    currency: string;
  };
  location: LocationData;
  availability: {
    days: string[];
    hours: string;
  };
  images: string[];
  rating: number;
  reviews: number;
  completedJobs: number;
  isVerified: boolean;
  isFavorited?: boolean;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
  updatedAt: string;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  service: Service;
  clientId: string;
  client: User;
  date: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// ==================== Notification Types ====================

export interface Notification {
  id: string;
  userId: string;
  type:
    | "like"
    | "comment"
    | "mention"
    | "follow"
    | "message"
    | "event"
    | "job"
    | "system";
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  createdAt: string;
}

// ==================== Gamification Types ====================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  earnedAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  goal: number;
  completed: boolean;
  reward: {
    points: number;
    badge?: string;
  };
}

export interface LeaderboardEntry {
  userId: string;
  user: User;
  points: number;
  level: number;
  rank: number;
}

// ==================== Report Types ====================

export interface Report {
  id: string;
  reporterId: string;
  reporter: User;
  targetType:
    | "user"
    | "post"
    | "comment"
    | "message"
    | "marketplace"
    | "service"
    | "event";
  targetId: string;
  reason: string;
  description?: string;
  evidence?: string[];
  status: "pending" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  updatedAt: string;
}

// ==================== Payment Types ====================

export interface Payment {
  id: string;
  userId: string;
  type:
    | "listing_boost"
    | "premium_subscription"
    | "event_ticket"
    | "marketplace_purchase"
    | "service_payment";
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  provider: "flutterwave" | "paystack" | "stripe";
  reference: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ==================== Social/Friends Types ====================

export interface FriendRequest {
  id: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friend: User;
  createdAt: string;
}

// ==================== Search Types ====================

export interface SearchResult {
  type: "user" | "post" | "event" | "job" | "marketplace" | "service";
  data: User | Post | Event | Job | MarketplaceItem | Service;
  score: number;
}

// ==================== Analytics Types ====================

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalEvents: number;
  totalJobs: number;
  totalMarketplaceItems: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  trends: {
    date: string;
    value: number;
  }[];
}

// ==================== Request Payload Types ====================

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  location: {
    latitude: number;
    longitude: number;
    state?: string;
    lga?: string;
    ward?: string;
    neighborhood?: string;
  };
  agreeToTerms: boolean;
  referralCode?: string;
}

export interface LoginPayload {
  identifier: string; // username, email, or phone
  password: string;
}

export interface CreatePostPayload {
  type: "text" | "image" | "video" | "poll" | "article";
  content: string;
  media?: File[];
  visibility: "public" | "friends" | "neighborhood" | "ward" | "lga" | "state";
  tags?: string[];
  mentions?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface CreateEventPayload {
  title: string;
  description: string;
  type:
    | "community"
    | "social"
    | "sports"
    | "cultural"
    | "educational"
    | "business"
    | "other";
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  };
  venue?: string;
  startDate: string;
  endDate: string;
  coverImage?: File;
  capacity?: number;
  isFree: boolean;
  ticketPrice?: number;
  visibility: "public" | "private" | "neighborhood";
  tags?: string[];
}

export interface CreateJobPayload {
  title: string;
  description: string;
  type: "full-time" | "part-time" | "contract" | "freelance" | "internship";
  category: string;
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  };
  workMode: "on-site" | "remote" | "hybrid";
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  };
  requirements: string[];
  skills: string[];
  expiresAt?: string;
}

export interface CreateMarketplaceItemPayload {
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  condition: "new" | "like-new" | "good" | "fair" | "poor";
  images: File[];
  location: {
    latitude: number;
    longitude: number;
    formattedAddress?: string;
  };
  delivery: {
    available: boolean;
    fee?: number;
    methods: string[];
  };
  negotiable: boolean;
  quantity: number;
}
