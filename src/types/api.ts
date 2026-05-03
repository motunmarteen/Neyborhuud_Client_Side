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
export type FeedTab = "your_huud" | "street_radar" | "following_places";

/** Content type for filtering posts in the feed */
export type ContentType =
  | "post"
  | "fyi"
  | "gossip"
  | "help_request"
  | "job"
  | "emergency"
  | "event"
  | "marketplace";

/** Supported languages */
export type AppLanguage = "en" | "ha" | "yo" | "ig" | "pcm";

export interface FeedMeta {
  feedType: "chronological" | "ranked" | "smart" | "trending";
  boostedCategories: string[];
  hasPinnedBulletins?: boolean;
  pinnedCount?: number;
  feedTab?: FeedTab;
  localLgas?: string[];
  blendRatio?: {
    local: number;
    extended: number;
    explore: number;
  };
  hasExtendedContent?: boolean;
  hasExploreContent?: boolean;
  missedAlerts?: {
    count: number;
    highestSeverity: "low" | "medium" | "critical";
    latestCreatedAt: string;
    lgas: string[];
    reminderSent: boolean;
  } | null;
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
  trustScore: number;
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

/** Geo community returned with auth (id = Mongo ObjectId for /geo/communities/:id/...). */
export interface CommunitySummary {
  id?: string;
  locationKey?: string;
  communityName?: string;
  name?: string;
  state?: string;
  lga?: string;
  ward?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  /** Set by backend after location-based assignment (Mongo Community _id). */
  assignedCommunityId?: string | null;
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
  trustScore?: number;
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
  contentType?:
    | "post"
    | "fyi"
    | "gossip"
    | "help_request"
    | "job"
    | "emergency"
    | "event"
    | "marketplace";
  mood?: string;
  severity?: "low" | "medium" | "critical";
  emergencyType?: string;
  verificationStatus?:
    | "unverified"
    | "verified"
    | "community_confirmed"
    | "disputed";
  cardStyle?:
    | "default"
    | "emergency_red"
    | "fyi_blue"
    | "gossip_neutral"
    | "marketplace_green"
    | "event_purple";
  _feedLayer?: "local" | "extended" | "explore";
  availableActions?: string[];
  savedCollection?: string | null;
  /** Post body – prefer content; backend sends both (GET /feed, GET /content/posts) */
  content: string;
  body?: string;
  /** Backend returns mediaUrls (array of URLs) or media (array of items); normalized to media */
  media?: (MediaItem | string)[];
  location?:
    | LocationData
    | { lat?: number; lng?: number; lga?: string; [k: string]: unknown };
  visibility?: "public" | "friends" | "neighborhood" | "ward" | "lga" | "state";
  tags?: string[];
  mentions?: string[];
  priority?: "low" | "normal" | "high" | "critical";
  culturalContext?: string[];
  targetAudience?: {
    ageRange?: { min?: number; max?: number };
    gender?: string;
    interests?: string[];
  };
  helpfulCount?: number;
  isHelpful?: boolean;
  fyiSubtype?:
    | "safety_notice"
    | "lost_found"
    | "community_announcement"
    | "local_news"
    | "alert";
  fyiStatus?:
    | "active"
    | "found"
    | "returned"
    | "resolved"
    | "expired"
    | "outdated"
    | "closed";
  expiresAt?: string;
  endorsements?: Array<{
    endorserId: string;
    authorityTitle: string;
    note?: string;
    createdAt: string;
  }>;
  metadata?: Record<string, any>;
  // Marketplace fields
  price?: number;
  currency?: string;
  itemCondition?: "new" | "used" | "refurbished" | "free";
  isNegotiable?: boolean;
  deliveryOption?: "pickup" | "delivery" | "both";
  availability?: "available" | "sold" | "reserved";
  itemCategory?: string;
  contactMethod?: string;
  // Help Request fields
  targetAmount?: number;
  amountReceived?: number;
  helpRequestPayment?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
  helpCategory?: string;
  // Event fields (in metadata)
  eventDate?: string;
  eventTime?: string;
  venue?: { name: string; address?: string; lat?: number; lng?: number };
  ticketInfo?: "free" | "paid";
  capacity?: number;
  rsvpEnabled?: boolean;
  organizer?: string;
  eventCategory?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isAcknowledged?: boolean;
  isAware?: boolean;
  isNearby?: boolean;
  isSafe?: boolean;
  confirmDisputeAction?: "confirm" | "dispute" | null;
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
  userId:
    | string
    | {
        id?: string;
        _id?: string;
        username: string;
        avatarUrl?: string | null;
        avatar?: string | null;
        firstName?: string;
        lastName?: string;
      };
  user?: {
    id?: string;
    _id?: string;
    username: string;
    avatarUrl?: string | null;
    avatar?: string | null;
    firstName?: string;
    lastName?: string;
  };
  author?: {
    id?: string;
    _id?: string;
    username: string;
    avatarUrl?: string | null;
    avatar?: string | null;
    firstName?: string;
    lastName?: string;
  };
  content?: string;
  body: string; // The backend uses 'body' for the text content
  mediaUrls?: string[];
  parentId?: string;
  replies?: Comment[];
  likes: number;
  likesCount?: number; // Marketplace comments use likesCount
  isLiked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PostDetails {
  content: Post;
  comments: Comment[];
}

// ==================== Marketplace Types ====================

export interface Order {
  id: string;
  _id?: string;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: User;
  productId: string;
  product?: MarketplaceItem;
  amount: number;
  status:
    | "pending"
    | "accepted"
    | "payment_pending"
    | "paid"
    | "in_transit"
    | "delivered"
    | "completed"
    | "cancelled";
  offerId?: string;
  offer?: MarketplaceOffer;
  conversationId?: string;
  paymentMethod?: string;
  paymentProofUrl?: string;
  paymentConfirmedAt?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  trackingNumber?: string;
  buyerConfirmedAt?: string;
  sellerConfirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MarketplaceOffer {
  id: string;
  _id?: string;
  productId: string;
  product?: MarketplaceItem;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: User;
  offerAmount: number;
  counterOfferAmount?: number;
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "countered"
    | "expired"
    | "cancelled";
  orderId?: string;
  /** Chat thread shared between buyer and seller for this product. */
  conversationId?: string;
  acceptedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== Chat Types ====================

export interface ChatMessage {
  id: string;
  _id?: string;
  conversationId: string;
  senderId: string;
  sender?: {
    id?: string;
    _id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  content: string;
  type: "text" | "image" | "video" | "audio" | "file" | "location" | "system";
  mediaUrl?: string;
  thumbnailUrl?: string;
  locationSnapshot?: { latitude: number; longitude: number; address?: string };
  media?: MediaItem[];
  replyTo?: string;
  readBy?: string[];
  deliveredTo?: string[];
  isEdited: boolean;
  isDeleted: boolean;
  /** Server-set from conversation type. "emergency" for incident conversations. */
  priority: "normal" | "emergency";
  status: "sent" | "delivered" | "read";
  /** Structured metadata attached to system messages (e.g. offer events). */
  meta?: {
    offerAction?: "accept" | "reject" | "counter";
    actorRole?: "buyer" | "seller";
    offerAmount?: number;
    counterAmount?: number | null;
    offerId?: string;
    [key: string]: unknown;
  };
  /** UUID v4 idempotency key generated by client for dedup. */
  clientMessageId?: string;
  emergencyRef?: string;
  trackingSessionRef?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationContext {
  productId?: string;
  orderId?: string;
  transactionId?: string;
  productTitle?: string;
  productPrice?: number;
  productCurrency?: string;
  productThumbnail?: string;
  origin?: string;
  label?: string;
}

export type ConversationContextType =
  | "general"
  | "marketplace"
  | "incident"
  | "community";

export interface Conversation {
  id: string;
  _id?: string;
  /** Backend list endpoint returns this field as the conversation's ObjectId. */
  conversationId?: string;
  type: "direct" | "group" | "community" | "incident";
  emergencyId?: string;
  name?: string;
  groupName?: string;
  groupPhoto?: string;
  participants?: any[];
  /** Populated for direct conversations: the other person's profile */
  otherParticipant?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
  };
  lastMessage?: ChatMessage | null;
  lastMessageAt?: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  participantRole?: "admin" | "member" | "moderator";
  isActive?: boolean;
  /** Origin/topic of the conversation. "marketplace" chats carry product context. */
  contextType?: ConversationContextType;
  /** Structured metadata describing what the conversation is about. */
  context?: ConversationContext | null;
  /** Pre-rendered label like "Marketplace • iPhone 13" for chat list rows. */
  contextLabel?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ─── E2EE Key Verification ─────────────────────────────────────────────────

export interface KeyVerificationStatus {
  targetUserId: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedFingerprint?: string;
  /** false when the target rotated their key after last verification — re-verify needed */
  fingerprintStillCurrent?: boolean;
  currentFingerprint?: string | null;
  currentKeyPresent?: boolean;
}

// ─── Incident Replay ───────────────────────────────────────────────────────

export interface TimelineEntry {
  timestamp: string;
  type: "location_ping" | "chat_message" | "system_event";
  source: string;
  data: Record<string, any>;
  clockDriftFlagged?: boolean;
}

export interface IncidentReplay {
  emergencyId: string;
  emergencyType: string;
  severity: string;
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number | null;
  status: string;
  assignedAgency: string | null;
  summary: {
    totalEvents: number;
    locationPings: number;
    chatMessages: number;
    systemEvents: number;
    clockDriftFlaggedPings: number;
    hasIncidentConversation: boolean;
  };
  timeline: TimelineEntry[];
}

// ==================== Events Types ====================

export interface Event {
  id: string;
  organizerId: string;
  organizer?: User;
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
  attendees?: number;
  isAttending?: boolean;
  isFree: boolean;
  ticketPrice?: number;
  tags?: string[];
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  visibility: "public" | "private" | "neighborhood";
  createdAt: string;
  updatedAt?: string;
}

// ==================== Jobs Types ====================

export interface Job {
  id: string;
  employerId: string;
  employer?: User;
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
  applications?: number;
  hasApplied?: boolean;
  status?: "active" | "filled" | "closed";
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
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
  _id?: string;
  sellerId: string;
  seller?: User;
  title: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  condition?: "new" | "like-new" | "good" | "fair" | "poor";
  images: string[];
  location?: LocationData;
  delivery?: {
    available: boolean;
    fee?: number;
    methods: string[];
  };
  negotiable: boolean;
  quantity?: number;
  views?: number;
  likes?: number;
  engagement?: {
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  status: "available" | "sold" | "reserved" | "removed" | "active" | "pending";
  createdAt: string;
  updatedAt?: string;
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

export type ConsentType =
  | "marketing"
  | "analytics"
  | "third_party"
  | "data_processing";

export interface UserConsentRecord {
  _id?: string;
  userId?: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

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
  /** NDPR / Privacy Policy — required by API */
  agreeToPrivacy: boolean;
  consentMarketing?: boolean;
  consentAnalytics?: boolean;
  consentThirdParty?: boolean;
  referralCode?: string;
}

export interface LoginPayload {
  identifier: string; // username, email, or phone
  password: string;
}

export interface CreatePostPayload {
  type: "text" | "image" | "video" | "poll" | "article";
  contentType?:
    | "post"
    | "fyi"
    | "gossip"
    | "help_request"
    | "job"
    | "emergency"
    | "event"
    | "marketplace";
  content: string;
  mood?: string;
  media?: File[];
  visibility: "public" | "friends" | "neighborhood" | "ward" | "lga" | "state";
  tags?: string[];
  mentions?: string[];
  language?: "en" | "ha" | "yo" | "ig" | "pcm";
  priority?: "low" | "normal" | "high" | "critical";
  culturalContext?: string[];
  targetAudience?: {
    ageRange?: { min?: number; max?: number };
    gender?: string;
    interests?: string[];
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  // Event fields
  eventDate?: string;
  eventTime?: string;
  venue?: { name: string; address?: string; lat?: number; lng?: number };
  ticketInfo?: "free" | "paid";
  ticketPrice?: number;
  capacity?: number;
  rsvpEnabled?: boolean;
  organizer?: string;
  eventCategory?: string;
  // Marketplace fields
  price?: number;
  currency?: "NGN" | "USD";
  itemCondition?: "new" | "used" | "refurbished" | "free";
  isNegotiable?: boolean;
  deliveryOption?: "pickup" | "delivery" | "both";
  itemCategory?: string;
  contactMethod?: string;
  // Help Request fields
  targetAmount?: number;
  helpRequestPayment?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  };
  helpCategory?: string;
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

// ==================== Department Types ====================

export interface HuudCoinReward {
  action: string;
  amount: number;
  description: string;
  dailyCap?: number;
}

export interface DepartmentMetadata {
  huudcoinRewards: HuudCoinReward[];
  recommendedServiceCategories: string[];
  useCases: string[];
  featuredActions: string[];
  analyticsDimensions: string[];
  contentTypes: string[];
}

export interface Department {
  _id: string;
  departmentId: string;
  label: string;
  description: string;
  tagline?: string;
  aliases: string[];
  iconUrl?: string;
  color?: string;
  isSafetyCritical: boolean;
  isActive: boolean;
  sortOrder: number;
  metadata: DepartmentMetadata;
  serviceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentServicesResponse {
  services: Service[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
