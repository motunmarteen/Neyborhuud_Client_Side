/**
 * Incident Report Detail Page
 * Full view: description, location, status timeline, comments, interactions, reporter actions
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { incidentService } from '@/services/incident.service';
import {
  IncidentReport,
  IncidentComment,
  IncidentUpdate,
  INCIDENT_CATEGORY_META,
  INCIDENT_SEVERITY_META,
  INCIDENT_STATUS_META,
} from '@/types/incident';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';

function getReporterName(reporter: IncidentReport['reporterId'], isAnonymous: boolean): string {
  if (isAnonymous) return 'Anonymous Reporter';
  if (typeof reporter === 'string') return 'Resident';
  return [reporter.firstName, reporter.lastName].filter(Boolean).join(' ') || reporter.username || 'Resident';
}

// ── Comment Component ──────────────────────────────────────────────────────────

function CommentItem({ comment, currentUserId, onDelete }: {
  comment: IncidentComment;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const authorName = comment.isAnonymous
    ? 'Anonymous'
    : (typeof comment.authorId === 'string'
      ? 'Resident'
      : [comment.authorId.firstName, comment.authorId.lastName].filter(Boolean).join(' ') || comment.authorId.username || 'Resident');

  const isOwner = currentUserId && (
    typeof comment.authorId === 'string'
      ? comment.authorId === currentUserId
      : (comment.authorId as any).id === currentUserId
  );

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full neu-socket flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--neu-text-muted)' }}>person</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{authorName}</span>
          <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>{formatTimeAgo(comment.createdAt)}</span>
          {isOwner && (
            <button onClick={() => onDelete(comment.id)} className="ml-auto text-xs text-brand-red hover:text-brand-red">
              Delete
            </button>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--neu-text)' }}>{comment.body}</p>
      </div>
    </div>
  );
}

// ── Update Timeline Item ──────────────────────────────────────────────────────

function UpdateItem({ update }: { update: IncidentUpdate }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1" />
        <div className="w-0.5 flex-1 bg-primary/20 mt-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          {update.isAuthorityUpdate ? 'Authority Update' : 'Update'} · {formatTimeAgo(update.updatedAt)}
        </p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text)' }}>{update.message}</p>
      </div>
    </div>
  );
}

// ── Main Detail Content ────────────────────────────────────────────────────────

function IncidentDetailInner() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [commentAnon, setCommentAnon] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resolve / escalate / add update states
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Load incident
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await incidentService.getById(incidentId);
        setIncident(res.data?.data?.incident ?? null);
      } catch {
        setError('Failed to load incident report');
      } finally {
        setLoading(false);
      }
    };
    if (incidentId) fetch();
  }, [incidentId]);

  // Load comments
  useEffect(() => {
    const fetch = async () => {
      setCommentsLoading(true);
      try {
        const res = await incidentService.listComments(incidentId, 1, 50);
        setComments(res.data?.data?.comments ?? []);
      } catch {
        // silent
      } finally {
        setCommentsLoading(false);
      }
    };
    if (incidentId) fetch();
  }, [incidentId]);

  const handleInteract = async (type: 'witness' | 'confirm' | 'dispute') => {
    if (!user) { toast.error('Sign in to interact'); return; }
    if (!incident) return;
    try {
      await incidentService.interact(incidentId, type);
      const already = incident.myInteractions?.includes(type);
      const field = type === 'witness' ? 'witnessCount' : type === 'confirm' ? 'confirmCount' : 'disputeCount';
      setIncident(prev => prev ? {
        ...prev,
        [field]: already ? Math.max(0, prev[field] - 1) : prev[field] + 1,
        myInteractions: already
          ? (prev.myInteractions ?? []).filter(t => t !== type)
          : [...(prev.myInteractions ?? []), type],
      } : prev);
    } catch { toast.error('Action failed'); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentText.length < 2) { toast.error('Comment too short'); return; }
    setSubmittingComment(true);
    try {
      await incidentService.addComment(incidentId, commentText.trim(), commentAnon);
      toast.success('Comment added');
      setCommentText('');
      // Reload comments
      const res = await incidentService.listComments(incidentId, 1, 50);
      setComments(res.data?.data?.comments ?? []);
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await incidentService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage.trim()) return;
    setSubmittingUpdate(true);
    try {
      await incidentService.addUpdate(incidentId, updateMessage.trim());
      toast.success('Update added');
      setUpdateMessage('');
      setShowUpdateForm(false);
      // Reload incident for updated updates[]
      const res = await incidentService.getById(incidentId);
      setIncident(res.data?.data?.incident ?? null);
    } catch { toast.error('Failed to add update'); }
    finally { setSubmittingUpdate(false); }
  };

  const handleResolve = async () => {
    const resolution = window.prompt('Brief resolution summary:');
    if (!resolution) return;
    try {
      await incidentService.resolve(incidentId, resolution);
      toast.success('Incident marked as resolved');
      const res = await incidentService.getById(incidentId);
      setIncident(res.data?.data?.incident ?? null);
    } catch { toast.error('Failed to resolve'); }
  };

  const handleEscalate = async () => {
    try {
      await incidentService.escalate(incidentId, 'community_admin');
      toast.success('Incident escalated');
      const res = await incidentService.getById(incidentId);
      setIncident(res.data?.data?.incident ?? null);
    } catch { toast.error('Failed to escalate'); }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm mt-4" style={{ color: 'var(--neu-text-muted)' }}>Loading report...</p>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6">
        <span className="material-symbols-outlined text-5xl text-brand-red mb-4">error</span>
        <p className="text-sm text-center mb-4" style={{ color: 'var(--neu-text)' }}>{error || 'Report not found'}</p>
        <button onClick={() => router.push('/incident-reports')} className="px-6 py-2.5 mod-chip rounded-2xl text-sm font-bold text-primary">
          Back to Reports
        </button>
      </div>
    );
  }

  const catMeta = INCIDENT_CATEGORY_META[incident.category];
  const sevMeta = INCIDENT_SEVERITY_META[incident.severity];
  const statusMeta = INCIDENT_STATUS_META[incident.status];
  const reporterName = getReporterName(incident.reporterId, incident.isAnonymous);
  const reporterId = typeof incident.reporterId === 'string' ? incident.reporterId : (incident.reporterId as any)?.id;
  const isReporter = user && reporterId === user.id;

  return (
    <div className="px-4 pb-24 flex flex-col gap-6 max-w-[680px] mx-auto">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 mt-4 text-sm font-semibold"
        style={{ color: 'var(--neu-text-muted)' }}
      >
        <span className="material-symbols-outlined text-base">arrow_back_ios</span>
        Incident Reports
      </button>

      {/* Header card */}
      <div className="neu-card rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl neu-socket flex items-center justify-center flex-shrink-0">
            <span className={`material-symbols-outlined text-2xl ${catMeta.color}`}>{catMeta.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-snug" style={{ color: 'var(--neu-text)' }}>
              {incident.title}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              {catMeta.label} · by {reporterName} · {formatTimeAgo(incident.createdAt)}
            </p>
          </div>
        </div>

        {/* Severity + Status badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${sevMeta.bgClass} ${sevMeta.textClass} ${sevMeta.borderClass}`}>
            {sevMeta.label} Severity
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusMeta.bgClass} ${statusMeta.textClass}`}>
            {statusMeta.label}
          </span>
          {incident.isEscalated && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-red100 text-brand-red700 border border-orange-200">
              Escalated
            </span>
          )}
          {incident.verificationStatus === 'community_confirmed' && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
              Community Confirmed ✓
            </span>
          )}
        </div>

        {/* Incident date */}
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          <span className="material-symbols-outlined text-base">calendar_today</span>
          Happened: {new Date(incident.incidentDate).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>

      {/* Description */}
      <div className="neu-card rounded-2xl p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--neu-text-muted)' }}>DESCRIPTION</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--neu-text)' }}>
          {incident.description}
        </p>
      </div>

      {/* Location */}
      {incident.location && (incident.location.address || incident.location.lga) && (
        <div className="neu-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
            <span className="material-symbols-outlined text-base">location_on</span>
            LOCATION
          </h2>
          <div className="flex flex-col gap-1 text-sm" style={{ color: 'var(--neu-text)' }}>
            {incident.location.address && <span>{incident.location.address}</span>}
            {incident.location.landmark && (
              <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                Near: {incident.location.landmark}
              </span>
            )}
            {incident.location.lga && (
              <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                {[incident.location.lga, incident.location.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {incident.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {incident.tags.map(tag => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-full neu-socket" style={{ color: 'var(--neu-text-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Interaction row */}
      <div className="neu-card rounded-2xl p-4 flex items-center justify-around">
        <button
          onClick={() => handleInteract('witness')}
          className={`flex flex-col items-center gap-1 transition-all ${incident.myInteractions?.includes('witness') ? 'text-brand-blue' : ''}`}
          style={!incident.myInteractions?.includes('witness') ? { color: 'var(--neu-text-muted)' } : {}}
        >
          <span className="material-symbols-outlined text-2xl">visibility</span>
          <span className="text-xs font-semibold">Witnessed</span>
          <span className="text-xs">{incident.witnessCount}</span>
        </button>
        <button
          onClick={() => handleInteract('confirm')}
          className={`flex flex-col items-center gap-1 transition-all ${incident.myInteractions?.includes('confirm') ? 'text-primary' : ''}`}
          style={!incident.myInteractions?.includes('confirm') ? { color: 'var(--neu-text-muted)' } : {}}
        >
          <span className="material-symbols-outlined text-2xl">check_circle</span>
          <span className="text-xs font-semibold">Confirm</span>
          <span className="text-xs">{incident.confirmCount}</span>
        </button>
        <button
          onClick={() => handleInteract('dispute')}
          className={`flex flex-col items-center gap-1 transition-all ${incident.myInteractions?.includes('dispute') ? 'text-brand-red' : ''}`}
          style={!incident.myInteractions?.includes('dispute') ? { color: 'var(--neu-text-muted)' } : {}}
        >
          <span className="material-symbols-outlined text-2xl">flag</span>
          <span className="text-xs font-semibold">Dispute</span>
          <span className="text-xs">{incident.disputeCount}</span>
        </button>
        <div className="flex flex-col items-center gap-1" style={{ color: 'var(--neu-text-muted)' }}>
          <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
          <span className="text-xs font-semibold">Comments</span>
          <span className="text-xs">{incident.commentsCount}</span>
        </div>
      </div>

      {/* Reporter actions */}
      {isReporter && (
        <div className="flex flex-wrap gap-2">
          {(incident.status === 'open' || incident.status === 'in_progress') && (
            <>
              <button
                onClick={() => setShowUpdateForm(v => !v)}
                className="flex-1 py-2.5 mod-chip rounded-2xl text-sm font-semibold text-primary"
              >
                Add Update
              </button>
              <button
                onClick={handleEscalate}
                className="flex-1 py-2.5 mod-chip rounded-2xl text-sm font-semibold"
                style={{ color: 'var(--neu-text-muted)' }}
              >
                Escalate
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-2.5 mod-chip rounded-2xl text-sm font-semibold text-brand-green-dark"
              >
                Resolve
              </button>
            </>
          )}
        </div>
      )}

      {/* Add update form */}
      {showUpdateForm && (
        <form onSubmit={handleAddUpdate} className="neu-card-sm rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Post an Update</h3>
          <textarea
            value={updateMessage}
            onChange={e => setUpdateMessage(e.target.value)}
            placeholder="What's the latest on this incident?"
            rows={3}
            className="w-full px-4 py-3 neu-input rounded-2xl text-sm resize-none"
            style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowUpdateForm(false)} className="flex-1 py-2.5 mod-chip rounded-2xl text-sm" style={{ color: 'var(--neu-text-muted)' }}>
              Cancel
            </button>
            <button type="submit" disabled={submittingUpdate} className="flex-1 py-2.5 mod-chip mod-chip-active rounded-2xl text-sm font-bold text-primary">
              {submittingUpdate ? 'Posting...' : 'Post Update'}
            </button>
          </div>
        </form>
      )}

      {/* Updates timeline */}
      {incident.updates && incident.updates.length > 0 && (
        <div className="neu-card rounded-2xl p-5">
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--neu-text-muted)' }}>UPDATES TIMELINE</h2>
          <div className="flex flex-col">
            {incident.updates.map((upd, i) => (
              <UpdateItem key={i} update={upd} />
            ))}
          </div>
        </div>
      )}

      {/* Resolution */}
      {incident.resolution && (
        <div className="neu-card rounded-2xl p-5 border border-green-200/60">
          <h2 className="text-sm font-bold mb-2 text-green-700">RESOLUTION</h2>
          <p className="text-sm" style={{ color: 'var(--neu-text)' }}>{incident.resolution}</p>
        </div>
      )}

      {/* Comments */}
      <div className="neu-card rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold" style={{ color: 'var(--neu-text-muted)' }}>
          COMMENTS ({incident.commentsCount})
        </h2>

        {/* Add comment */}
        {user && (
          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment or share what you know..."
              rows={2}
              maxLength={1000}
              className="w-full px-4 py-3 neu-input rounded-2xl text-sm resize-none"
              style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--neu-text-muted)' }}>
                <input type="checkbox" checked={commentAnon} onChange={e => setCommentAnon(e.target.checked)} className="w-3.5 h-3.5 rounded" />
                Post anonymously
              </label>
              <button type="submit" disabled={submittingComment} className="px-5 py-2 mod-chip mod-chip-active rounded-2xl text-xs font-bold text-primary">
                {submittingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        )}

        {/* Comment list */}
        {commentsLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--neu-text-muted)' }}>
            No comments yet — be the first to share what you know.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUserId={user?.id}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64" />}><LeftSidebar /></Suspense>
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <IncidentDetailInner />
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
