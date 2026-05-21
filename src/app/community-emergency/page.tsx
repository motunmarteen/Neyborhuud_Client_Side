/**
 * Community Emergency Post Page — /community-emergency
 *
 * Distinct from /safety/emergency (SOS dispatch).
 * This page lets residents post community emergency alerts
 * and browse active emergency community posts from the feed.
 *
 * Backend: POST /api/v1/content/emergency
 *          GET  /api/v1/feed?contentType=emergency
 */

'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/content.service';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';

// ── Types (inline — mirrors CreateCommunityEmergencyPayload) ──────────────────

type EmergencyType =
  | 'crime'
  | 'danger'
  | 'missing_person'
  | 'fire'
  | 'accident'
  | 'suspicious_activity';

type Severity = 'low' | 'medium' | 'critical';

interface EmergencyPost {
  _id: string;
  id: string;
  contentType: 'emergency';
  title?: string;
  body: string;
  severity?: Severity;
  emergencyType?: EmergencyType;
  authorId: string | { id: string; username: string; firstName?: string; lastName?: string };
  createdAt: string;
  expiresAt?: string;
  location?: { lat?: number; lng?: number; address?: string; lga?: string; state?: string };
  mediaUrls?: string[];
  reactions?: { aware?: number; nearby?: number; safe?: number };
  myReactions?: string[];
}

// ── Meta helpers ──────────────────────────────────────────────────────────────

const EMERGENCY_TYPE_META: Record<EmergencyType, { label: string; icon: string; color: string }> = {
  crime:               { label: 'Crime',              icon: 'local_police',      color: 'text-red-600' },
  danger:              { label: 'Danger',             icon: 'dangerous',         color: 'text-brand-red600' },
  missing_person:      { label: 'Missing Person',     icon: 'person_search',     color: 'text-purple-600' },
  fire:                { label: 'Fire',               icon: 'local_fire_department', color: 'text-brand-red' },
  accident:            { label: 'Accident',           icon: 'car_crash',         color: 'text-amber-600' },
  suspicious_activity: { label: 'Suspicious Activity', icon: 'report',          color: 'text-primary600' },
};

const SEVERITY_META: Record<Severity, { label: string; bg: string; text: string; border: string }> = {
  low:      { label: 'Low',      bg: 'bg-primary50',  text: 'text-primary700', border: 'border-yellow-200' },
  medium:   { label: 'Medium',   bg: 'bg-brand-red50',  text: 'text-brand-red700', border: 'border-orange-200' },
  critical: { label: 'CRITICAL', bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200' },
};

function getExpiryCountdown(expiresAt?: string): string {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `Expires in ${hrs}h ${mins % 60}m`;
  return `Expires in ${mins}m`;
}

// ── Create Form ───────────────────────────────────────────────────────────────

function CreateEmergencyForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('danger');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [address, setAddress] = useState('');
  const [lga, setLga] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || body.trim().length < 10) {
      toast.error('Please describe the emergency (at least 10 characters)');
      return;
    }
    setSubmitting(true);
    try {
      await contentService.createEmergencyPost({
        title: title.trim() || undefined as any,
        body: body.trim(),
        severity,
        emergencyType,
        location: {
          address: address.trim() || undefined,
          lga: lga.trim() || undefined,
        },
      });
      toast.success('Emergency alert posted to your community');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to post alert';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Warning header */}
      <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-100">
        <span className="material-symbols-outlined text-brand-red text-xl flex-shrink-0 mt-0.5">warning</span>
        <p className="text-xs" style={{ color: 'var(--neu-text)' }}>
          This will immediately alert your community. Only post real emergencies — up to 3 per hour.
        </p>
      </div>

      {/* Emergency type */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
          Emergency Type <span className="text-brand-red">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(EMERGENCY_TYPE_META) as [EmergencyType, typeof EMERGENCY_TYPE_META[EmergencyType]][]).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setEmergencyType(key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl text-xs font-semibold transition-all ${
                emergencyType === key ? 'mod-chip mod-chip-active text-primary' : 'neu-socket'
              }`}
              style={emergencyType !== key ? { color: 'var(--neu-text-muted)' } : {}}
            >
              <span className={`material-symbols-outlined text-xl ${emergencyType === key ? '' : meta.color}`}>
                {meta.icon}
              </span>
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
          Severity <span className="text-brand-red">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(SEVERITY_META) as [Severity, typeof SEVERITY_META[Severity]][]).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSeverity(key)}
              className={`py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                severity === key
                  ? `${meta.bg} ${meta.text} ${meta.border}`
                  : 'neu-socket border-transparent'
              }`}
              style={severity !== key ? { color: 'var(--neu-text-muted)' } : {}}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title (optional) */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          Title <span className="text-xs font-normal" style={{ color: 'var(--neu-text-muted)' }}>(optional)</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Brief headline"
          maxLength={200}
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          Description <span className="text-brand-red">*</span>
        </label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Describe the emergency — what's happening, where, any details that help the community stay safe..."
          rows={4}
          maxLength={2000}
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm resize-none"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>{body.length}/2000</p>
      </div>

      {/* Location */}
      <div className="flex gap-2">
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Address / area"
          className="flex-1 px-3 py-2.5 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
        <input
          value={lga}
          onChange={e => setLga(e.target.value)}
          placeholder="LGA"
          className="w-28 px-3 py-2.5 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-2xl mod-chip mod-chip-active font-bold text-primary text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-xl">campaign</span>
        {submitting ? 'Posting Alert...' : 'Post Emergency Alert'}
      </button>
    </form>
  );
}

// ── Emergency Card ────────────────────────────────────────────────────────────

function EmergencyCard({ post, onReact }: {
  post: EmergencyPost;
  onReact: (postId: string, type: 'aware' | 'nearby' | 'safe') => void;
}) {
  const typeMeta = post.emergencyType ? EMERGENCY_TYPE_META[post.emergencyType] : null;
  const sevMeta = post.severity ? SEVERITY_META[post.severity] : null;
  const countdown = getExpiryCountdown(post.expiresAt);
  const expired = countdown === 'Expired';

  const isAware  = post.myReactions?.includes('aware');
  const isNearby = post.myReactions?.includes('nearby');
  const isSafe   = post.myReactions?.includes('safe');

  return (
    <div className={`neu-card rounded-2xl p-4 flex flex-col gap-3 ${expired ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          post.severity === 'critical' ? 'bg-red-100' : 'neu-socket'
        }`}>
          <span className={`material-symbols-outlined text-xl ${typeMeta?.color ?? 'text-brand-red'}`}>
            {typeMeta?.icon ?? 'emergency'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {post.title && (
            <p className="font-bold text-sm leading-snug" style={{ color: 'var(--neu-text)' }}>
              {post.title}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            {typeMeta && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full neu-socket" style={{ color: 'var(--neu-text-muted)' }}>
                {typeMeta.label}
              </span>
            )}
            {sevMeta && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevMeta.bg} ${sevMeta.text} ${sevMeta.border}`}>
                {sevMeta.label}
              </span>
            )}
            <span className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--neu-text)' }}>
        {post.body}
      </p>

      {/* Location */}
      {post.location && (post.location.address || post.location.lga) && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          <span className="material-symbols-outlined text-sm">location_on</span>
          {[post.location.address, post.location.lga].filter(Boolean).join(', ')}
        </div>
      )}

      {/* Expiry countdown */}
      {countdown && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${expired ? 'text-[var(--neu-text-muted)]' : 'text-brand-red'}`}>
          <span className="material-symbols-outlined text-sm">schedule</span>
          {countdown}
        </div>
      )}

      {/* Reaction row */}
      {!expired && (
        <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
          <button
            onClick={() => onReact(post.id ?? post._id, 'aware')}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${isAware ? 'text-brand-blue' : ''}`}
            style={!isAware ? { color: 'var(--neu-text-muted)' } : {}}
          >
            <span className="material-symbols-outlined text-base">notifications_active</span>
            I'm Aware {post.reactions?.aware ? `· ${post.reactions.aware}` : ''}
          </button>
          <button
            onClick={() => onReact(post.id ?? post._id, 'nearby')}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${isNearby ? 'text-brand-red' : ''}`}
            style={!isNearby ? { color: 'var(--neu-text-muted)' } : {}}
          >
            <span className="material-symbols-outlined text-base">my_location</span>
            Nearby {post.reactions?.nearby ? `· ${post.reactions.nearby}` : ''}
          </button>
          <button
            onClick={() => onReact(post.id ?? post._id, 'safe')}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${isSafe ? 'text-primary' : ''}`}
            style={!isSafe ? { color: 'var(--neu-text-muted)' } : {}}
          >
            <span className="material-symbols-outlined text-base">health_and_safety</span>
            I'm Safe {post.reactions?.safe ? `· ${post.reactions.safe}` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function CommunityEmergencyInner() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [posts, setPosts] = useState<EmergencyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadPosts = useCallback(async (p = 1) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await contentService.getEmergencyFeed({ page: p, limit: 20 });
      const items: EmergencyPost[] = res.data?.data?.feed ?? res.data?.data?.posts ?? res.data?.data ?? [];
      setPosts(prev => p === 1 ? items : [...prev, ...items]);
      const pagination = res.data?.data?.pagination;
      setHasNextPage(pagination?.hasNextPage ?? items.length === 20);
      setPage(p);
    } catch {
      setError('Failed to load emergency alerts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadPosts(1); }, [loadPosts]);

  const handleReact = async (postId: string, type: 'aware' | 'nearby' | 'safe') => {
    if (!user) { toast.error('Sign in to react'); return; }
    try {
      if (type === 'aware') await contentService.toggleImAware(postId);
      else if (type === 'nearby') await contentService.toggleImNearby(postId);
      else if (type === 'safe') await contentService.toggleSafeMark(postId);

      // Optimistic update
      setPosts(prev => prev.map(p => {
        if ((p.id ?? p._id) !== postId) return p;
        const already = p.myReactions?.includes(type);
        const reactionField = type === 'aware' ? 'aware' : type === 'nearby' ? 'nearby' : 'safe';
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [reactionField]: already
              ? Math.max(0, (p.reactions?.[reactionField] ?? 0) - 1)
              : (p.reactions?.[reactionField] ?? 0) + 1,
          },
          myReactions: already
            ? (p.myReactions ?? []).filter(r => r !== type)
            : [...(p.myReactions ?? []), type],
        };
      }));
    } catch { toast.error('Action failed'); }
  };

  const lastRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) loadPosts(page + 1);
    });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasNextPage, loadPosts, page]);

  return (
    <div className="max-w-[680px] mx-auto flex flex-col pb-24">

      {/* Page header */}
      <div className="px-4 pt-6 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <span className="material-symbols-outlined text-lg text-brand-red">campaign</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>Community Alerts</h1>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Real-time neighborhood emergency posts
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(v => !v)}
            className={`neu-fab w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              showCreate ? 'text-brand-red' : 'text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-xl">
              {showCreate ? 'close' : 'add_alert'}
            </span>
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mx-4 mb-4 neu-card rounded-2xl p-4">
          <h2 className="font-bold text-base mb-4" style={{ color: 'var(--neu-text)' }}>
            Post Emergency Alert
          </h2>
          <CreateEmergencyForm onSuccess={() => { setShowCreate(false); loadPosts(1); }} />
        </div>
      )}

      {/* Not signed in prompt */}
      {!user && (
        <div className="mx-4 mb-4 neu-card-sm rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-xl text-primary">login</span>
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            <a href="/login" className="font-semibold text-primary">Sign in</a> to post community emergency alerts and react to reports.
          </p>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 flex flex-col gap-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
            <p className="text-sm mt-4" style={{ color: 'var(--neu-text-muted)' }}>Loading alerts...</p>
          </div>
        )}

        {!loading && error && (
          <div className="neu-card-sm rounded-2xl p-8 flex flex-col items-center">
            <span className="material-symbols-outlined text-4xl text-brand-red mb-3">error</span>
            <p className="text-sm text-center mb-4" style={{ color: 'var(--neu-text)' }}>{error}</p>
            <button onClick={() => loadPosts(1)} className="px-6 py-2.5 mod-chip rounded-2xl text-sm font-bold text-primary">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="neu-card-sm rounded-2xl flex flex-col items-center justify-center py-14 px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.08)' }}>
              <span className="material-symbols-outlined text-4xl text-brand-red opacity-50">campaign</span>
            </div>
            <p className="text-base font-semibold text-center" style={{ color: 'var(--neu-text)' }}>
              No active alerts
            </p>
            <p className="text-sm text-center mt-2 mb-5" style={{ color: 'var(--neu-text-muted)' }}>
              All clear in your neighborhood! Post an alert if there's an active emergency.
            </p>
            {user && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-6 py-2.5 mod-chip mod-chip-active rounded-2xl text-sm font-bold text-primary"
              >
                Post Alert
              </button>
            )}
          </div>
        )}

        {posts.map((post, idx) => {
          const postId = post.id ?? post._id;
          const isLast = idx === posts.length - 1;
          return (
            <div key={postId} ref={isLast ? lastRef : undefined}>
              <EmergencyCard post={post} onReact={handleReact} />
            </div>
          );
        })}

        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-3 border-brand-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityEmergencyPage() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}><LeftSidebar /></Suspense>
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <CommunityEmergencyInner />
          </Suspense>
        </main>
        <RightSidebar />
      </div>
      <div className="md:hidden">
        <Suspense fallback={<div className="h-16" />}><BottomNav /></Suspense>
      </div>
    </div>
  );
}
