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
  crime:          { label: "Crime",            icon: "local_police",    color: "text-brand-red" },
  fire:           { label: "Fire",             icon: "local_fire_department", color: "text-brand-red" },
  flood:          { label: "Flood",            icon: "water",           color: "text-brand-blue" },
  accident:       { label: "Accident",         icon: "car_crash",       color: "text-primary" },
  public_health:  { label: "Public Health",    icon: "health_and_safety", color: "text-primary" },
  infrastructure: { label: "Infrastructure",   icon: "construction",    color: "text-primary" },
  utility:        { label: "Utility Failure",  icon: "power_off",       color: "text-brand-blue" },
  environmental:  { label: "Environmental",    icon: "eco",             color: "text-brand-green-dark" },
  suspicious:     { label: "Suspicious",       icon: "visibility",      color: "text-brand-blue500" },
  missing_person: { label: "Missing Person",   icon: "person_search",   color: "text-brand-blue" },
  other:          { label: "Other",            icon: "report",          color: "text-[var(--neu-text-muted)]" },
};

export const INCIDENT_SEVERITY_META: Record<
  IncidentSeverity,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  low:      { label: "Low",      bgClass: "bg-status-success/10",   textClass: "text-status-success",  borderClass: "border-status-success/40" },
  medium:   { label: "Medium",   bgClass: "bg-status-warning/10",   textClass: "text-status-warning",  borderClass: "border-status-warning/40" },
  high:     { label: "High",     bgClass: "bg-status-warning/15",   textClass: "text-status-warning",  borderClass: "border-status-warning/50" },
  critical: { label: "Critical", bgClass: "bg-status-danger/10",    textClass: "text-status-danger",   borderClass: "border-status-danger/40" },
};

export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  open:         { label: "Open",         bgClass: "bg-status-info/10",    textClass: "text-status-info" },
  under_review: { label: "Under Review", bgClass: "bg-status-pending/10", textClass: "text-status-warning" },
  escalated:    { label: "Escalated",    bgClass: "bg-status-danger/10",  textClass: "text-status-danger" },
  in_progress:  { label: "In Progress",  bgClass: "bg-status-info/10",    textClass: "text-status-info" },
  resolved:     { label: "Resolved",     bgClass: "bg-status-success/10", textClass: "text-status-success" },
  closed:       { label: "Closed",       bgClass: "bg-white/5",           textClass: "text-white/40" },
  disputed:     { label: "Disputed",     bgClass: "bg-status-danger/8",   textClass: "text-status-danger" },
};

// ── News types ────────────────────────────────────────────────────────────────

export interface NewsSource {
  id: string;
  name: string;
  region?: 'nigeria' | 'international';
}

export interface NewsTopic {
  id: string;
  label: string;
}

export interface NewsCategory {
  key: string;
  label: string;
  sources: NewsSource[];
}

export interface NewsCategoriesResponse {
  categories: NewsCategory[];
  topics: NewsTopic[];
}

export interface NewsArticlesResponse {
  articles: RssArticle[];
  region: string;
  topic: string;
  sourcesUsed: string[];
  count: number;
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
