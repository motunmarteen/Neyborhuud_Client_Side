/**
 * Incident Report types — mirrors src/models/IncidentReport.ts (backend)
 */

export type IncidentCategory =
  | "crime"
  | "fire"
  | "flood"
  | "accident"
  | "public_health"
  | "infrastructure"
  | "utility"
  | "environmental"
  | "suspicious"
  | "missing_person"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "open"
  | "under_review"
  | "escalated"
  | "in_progress"
  | "resolved"
  | "closed"
  | "disputed";

export interface IncidentLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  lga?: string;
  state?: string;
  landmark?: string;
}

export interface IncidentEvidence {
  url: string;
  type: "image" | "video" | "document";
  uploadedBy: string;
  uploadedAt: string;
  caption?: string;
}

export interface IncidentUpdate {
  message: string;
  updatedBy: string | { firstName?: string; lastName?: string; username?: string };
  updatedAt: string;
  isAuthorityUpdate: boolean;
}

export interface IncidentReporter {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string | null;
}

export interface IncidentReport {
  id: string;
  reporterId: string | IncidentReporter;
  isAnonymous: boolean;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  incidentDate: string;
  location: IncidentLocation;
  communityId?: string;
  mediaUrls: string[];
  evidence: IncidentEvidence[];
  status: IncidentStatus;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string | IncidentReporter;
  isEscalated: boolean;
  escalatedTo?: string;
  escalatedAt?: string;
  linkedEmergencyId?: string;
  witnessCount: number;
  confirmCount: number;
  disputeCount: number;
  viewsCount: number;
  commentsCount: number;
  isDeleted: boolean;
  isFlagged: boolean;
  verificationStatus: "unverified" | "community_confirmed" | "authority_confirmed" | "disputed";
  updates: IncidentUpdate[];
  tags: string[];
  myInteractions?: Array<"witness" | "confirm" | "dispute">;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  authorId: string | IncidentReporter;
  isAnonymous: boolean;
  body: string;
  isAuthorityUpdate: boolean;
  likesCount: number;
  isDeleted: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IncidentListResponse {
  incidents: IncidentReport[];
  pagination: IncidentPagination;
}

export interface IncidentStats {
  summary: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
  byCategory: Array<{ category: IncidentCategory; count: number }>;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  category: IncidentCategory;
  severity?: IncidentSeverity;
  incidentDate: string; // ISO string
  isAnonymous?: boolean;
  location?: IncidentLocation;
  communityId?: string;
  mediaUrls?: string[];
  linkedEmergencyId?: string;
  tags?: string[];
}

export interface UpdateIncidentPayload {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  incidentDate?: string;
  location?: IncidentLocation;
  tags?: string[];
  mediaUrls?: string[];
}

// ── Display helpers ───────────────────────────────────────────────────────────

export const INCIDENT_CATEGORY_META: Record<
  IncidentCategory,
  { label: string; icon: string; color: string }
> = {
  crime:          { label: "Crime",            icon: "local_police",    color: "text-red-500" },
  fire:           { label: "Fire",             icon: "local_fire_department", color: "text-orange-500" },
  flood:          { label: "Flood",            icon: "water",           color: "text-blue-500" },
  accident:       { label: "Accident",         icon: "car_crash",       color: "text-yellow-500" },
  public_health:  { label: "Public Health",    icon: "health_and_safety", color: "text-green-500" },
  infrastructure: { label: "Infrastructure",   icon: "construction",    color: "text-amber-500" },
  utility:        { label: "Utility Failure",  icon: "power_off",       color: "text-purple-500" },
  environmental:  { label: "Environmental",    icon: "eco",             color: "text-teal-500" },
  suspicious:     { label: "Suspicious",       icon: "visibility",      color: "text-indigo-500" },
  missing_person: { label: "Missing Person",   icon: "person_search",   color: "text-pink-500" },
  other:          { label: "Other",            icon: "report",          color: "text-gray-500" },
};

export const INCIDENT_SEVERITY_META: Record<
  IncidentSeverity,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  low:      { label: "Low",      bgClass: "bg-green-100 dark:bg-green-900/30",   textClass: "text-green-700 dark:text-green-400",  borderClass: "border-green-300 dark:border-green-700" },
  medium:   { label: "Medium",   bgClass: "bg-yellow-100 dark:bg-yellow-900/30", textClass: "text-yellow-700 dark:text-yellow-400", borderClass: "border-yellow-300 dark:border-yellow-700" },
  high:     { label: "High",     bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-700 dark:text-orange-400", borderClass: "border-orange-300 dark:border-orange-700" },
  critical: { label: "Critical", bgClass: "bg-red-100 dark:bg-red-900/30",       textClass: "text-red-700 dark:text-red-400",       borderClass: "border-red-300 dark:border-red-700" },
};

export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  open:         { label: "Open",         bgClass: "bg-blue-100 dark:bg-blue-900/30",   textClass: "text-blue-700 dark:text-blue-400" },
  under_review: { label: "Under Review", bgClass: "bg-yellow-100 dark:bg-yellow-900/30", textClass: "text-yellow-700 dark:text-yellow-400" },
  escalated:    { label: "Escalated",    bgClass: "bg-orange-100 dark:bg-orange-900/30", textClass: "text-orange-700 dark:text-orange-400" },
  in_progress:  { label: "In Progress",  bgClass: "bg-purple-100 dark:bg-purple-900/30", textClass: "text-purple-700 dark:text-purple-400" },
  resolved:     { label: "Resolved",     bgClass: "bg-green-100 dark:bg-green-900/30",  textClass: "text-green-700 dark:text-green-400" },
  closed:       { label: "Closed",       bgClass: "bg-gray-100 dark:bg-gray-800",       textClass: "text-gray-600 dark:text-gray-400" },
  disputed:     { label: "Disputed",     bgClass: "bg-red-100 dark:bg-red-900/30",      textClass: "text-red-700 dark:text-red-400" },
};

// ── News types ────────────────────────────────────────────────────────────────

export interface NewsSource {
  id: string;
  name: string;
}

export interface NewsCategory {
  key: string;
  label: string;
  sources: NewsSource[];
}

export interface NewsCategoriesResponse {
  categories: NewsCategory[];
}

// Parsed RSS article (client-side parsed from XML)
export interface RssArticle {
  id: string;         // guid or link as fallback
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;     // source id
  sourceName: string; // source display name
  imageUrl?: string;
}

// ── Community Emergency Post types ───────────────────────────────────────────

export type CommunityEmergencyType =
  | "crime"
  | "danger"
  | "missing_person"
  | "fire"
  | "accident"
  | "suspicious_activity";

export interface CreateCommunityEmergencyPayload {
  title: string;
  body: string;
  severity: "low" | "medium" | "critical";
  emergencyType?: CommunityEmergencyType;
  location?: {
    lat?: number;
    lng?: number;
    lga?: string;
    state?: string;
    address?: string;
  };
  mediaUrls?: string[];
}
