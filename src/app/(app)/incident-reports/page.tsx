/**
 * Incident Report Page
 * Community neighborhood incident reporting — fire, crime, flood, accidents, etc.
 */

'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from '@/components/local-huud/LocalHuudHubHeader';
import { useAuth } from '@/hooks/useAuth';
import { incidentService } from '@/services/incident.service';
import {
  IncidentReport,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  INCIDENT_CATEGORY_META,
  INCIDENT_SEVERITY_META,
  INCIDENT_STATUS_META,
  CreateIncidentPayload,
} from '@/types/incident';
import { formatTimeAgo } from '@/utils/timeAgo';
import { toast } from 'sonner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getReporterName(reporter: IncidentReport['reporterId'], isAnonymous: boolean): string {
  if (isAnonymous) return 'Anonymous';
  if (typeof reporter === 'string') return 'Resident';
  return [reporter.firstName, reporter.lastName].filter(Boolean).join(' ') || reporter.username || 'Resident';
}

// ── Create Form ───────────────────────────────────────────────────────────────

function CreateIncidentForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('crime');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 16));
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [address, setAddress] = useState('');
  const [lga, setLga] = useState('');
  const [landmark, setLandmark] = useState('');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (!description.trim() || description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateIncidentPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        incidentDate: new Date(incidentDate).toISOString(),
        isAnonymous,
        location: {
          address: address.trim() || undefined,
          lga: lga.trim() || undefined,
          landmark: landmark.trim() || undefined,
        },
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      };
      await incidentService.create(payload);
      toast.success('Incident report filed successfully');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to file report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          Title <span className="text-brand-red">*</span>
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Brief title of the incident"
          maxLength={200}
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
      </div>

      {/* Category + Severity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
            Category <span className="text-brand-red">*</span>
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as IncidentCategory)}
            className="w-full px-3 py-3 neu-input rounded-2xl text-sm"
            style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
          >
            {(Object.keys(INCIDENT_CATEGORY_META) as IncidentCategory[]).map(cat => (
              <option key={cat} value={cat}>
                {INCIDENT_CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
            Severity <span className="text-brand-red">*</span>
          </label>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value as IncidentSeverity)}
            className="w-full px-3 py-3 neu-input rounded-2xl text-sm"
            style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
          >
            {(Object.keys(INCIDENT_SEVERITY_META) as IncidentSeverity[]).map(s => (
              <option key={s} value={s}>{INCIDENT_SEVERITY_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          Description <span className="text-brand-red">*</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what happened in detail (minimum 20 characters)"
          rows={5}
          maxLength={5000}
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm resize-none"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
          {description.length}/5000
        </p>
      </div>

      {/* Incident date */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          When did it happen? <span className="text-brand-red">*</span>
        </label>
        <input
          type="datetime-local"
          value={incidentDate}
          max={new Date().toISOString().slice(0, 16)}
          onChange={e => setIncidentDate(e.target.value)}
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
      </div>

      {/* Location */}
      <div className="neu-card-sm rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
          <span className="material-symbols-outlined text-base align-middle mr-1">location_on</span>
          Location (optional but helpful)
        </p>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Street address or area"
          className="w-full px-3 py-2.5 neu-input rounded-xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={lga}
            onChange={e => setLga(e.target.value)}
            placeholder="LGA"
            className="px-3 py-2.5 neu-input rounded-xl text-sm"
            style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
          />
          <input
            value={landmark}
            onChange={e => setLandmark(e.target.value)}
            placeholder="Landmark"
            className="px-3 py-2.5 neu-input rounded-xl text-sm"
            style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--neu-text)' }}>
          Tags (comma-separated)
        </label>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="e.g. robbery, night, victoria-island"
          className="w-full px-4 py-3 neu-input rounded-2xl text-sm"
          style={{ color: 'var(--neu-text)', background: 'var(--neu-bg)' }}
        />
      </div>

      {/* Anonymous */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={e => setIsAnonymous(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm" style={{ color: 'var(--neu-text)' }}>
          File anonymously (your name will be hidden)
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 mod-chip mod-chip-active rounded-2xl font-bold text-primary text-sm transition-all active:scale-95 disabled:opacity-50"
      >
        {submitting ? 'Filing Report...' : 'File Incident Report'}
      </button>
    </form>
  );
}

// ── Incident Card ─────────────────────────────────────────────────────────────

function IncidentCard({ incident, onInteract }: {
  incident: IncidentReport;
  onInteract: (id: string, type: 'witness' | 'confirm' | 'dispute') => void;
}) {
  const router = useRouter();
  const catMeta = INCIDENT_CATEGORY_META[incident.category];
  const sevMeta = INCIDENT_SEVERITY_META[incident.severity];
  const statusMeta = INCIDENT_STATUS_META[incident.status];
  const reporterName = getReporterName(incident.reporterId, incident.isAnonymous);
  const isWitness  = incident.myInteractions?.includes('witness');
  const isConfirm  = incident.myInteractions?.includes('confirm');
  const isDispute  = incident.myInteractions?.includes('dispute');

  return (
    <div
      className="neu-card rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all active:scale-[0.99]"
      onClick={() => router.push(`/incident-reports/${incident.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full neu-socket flex items-center justify-center flex-shrink-0">
            <span className={`material-symbols-outlined text-xl ${catMeta.color}`}>
              {catMeta.icon}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-snug line-clamp-1" style={{ color: 'var(--neu-text)' }}>
              {incident.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              {catMeta.label} · {reporterName} · {formatTimeAgo(incident.createdAt)}
            </p>
          </div>
        </div>
        {/* Severity badge */}
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevMeta.bgClass} ${sevMeta.textClass} ${sevMeta.borderClass}`}>
          {sevMeta.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--neu-text)' }}>
        {incident.description}
      </p>

      {/* Location */}
      {(incident.location?.address || incident.location?.lga) && (
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
          <span className="material-symbols-outlined text-sm">location_on</span>
          {[incident.location.address, incident.location.landmark, incident.location.lga]
            .filter(Boolean).join(', ')}
        </div>
      )}

      {/* Status + actions */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusMeta.bgClass} ${statusMeta.textClass}`}>
          {statusMeta.label}
        </span>

        <div className="flex items-center gap-3">
          {/* Witness */}
          <button
            onClick={e => { e.stopPropagation(); onInteract(incident.id, 'witness'); }}
            className={`flex items-center gap-1 text-xs transition-all ${isWitness ? 'text-brand-blue' : ''}`}
            style={!isWitness ? { color: 'var(--neu-text-muted)' } : {}}
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            {incident.witnessCount}
          </button>
          {/* Confirm */}
          <button
            onClick={e => { e.stopPropagation(); onInteract(incident.id, 'confirm'); }}
            className={`flex items-center gap-1 text-xs transition-all ${isConfirm ? 'text-primary' : ''}`}
            style={!isConfirm ? { color: 'var(--neu-text-muted)' } : {}}
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {incident.confirmCount}
          </button>
          {/* Comments */}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            <span className="material-symbols-outlined text-base">chat_bubble_outline</span>
            {incident.commentsCount}
          </div>
        </div>
      </div>

      {/* Tags */}
      {incident.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {incident.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full neu-socket" style={{ color: 'var(--neu-text-muted)' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: Array<{ value: IncidentCategory | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'crime', label: 'Crime' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'accident', label: 'Accident' },
  { value: 'public_health', label: 'Health' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'missing_person', label: 'Missing' },
  { value: 'other', label: 'Other' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

function IncidentReportsInner() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>('open');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const observerRef = useRef<IntersectionObserver | null>(null);

  const load = useCallback(async (p = 1, reset = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const res = await incidentService.list({
        page: p,
        limit: 20,
        category: categoryFilter || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = res.data?.data;
      if (data) {
        setIncidents(prev => reset || p === 1 ? data.incidents : [...prev, ...data.incidents]);
        setHasNextPage(data.pagination.hasNextPage);
        setPage(p);
      }
    } catch {
      setError('Failed to load incident reports');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryFilter, severityFilter, statusFilter, search]);

  // Initial load + reload on filter change
  useEffect(() => { load(1, true); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleInteract = async (id: string, type: 'witness' | 'confirm' | 'dispute') => {
    if (!user) { toast.error('Sign in to interact'); return; }
    try {
      await incidentService.interact(id, type);
      // Optimistically update counts
      setIncidents(prev => prev.map(inc => {
        if (inc.id !== id) return inc;
        const already = inc.myInteractions?.includes(type);
        const field = type === 'witness' ? 'witnessCount' : type === 'confirm' ? 'confirmCount' : 'disputeCount';
        return {
          ...inc,
          [field]: already ? Math.max(0, inc[field] - 1) : inc[field] + 1,
          myInteractions: already
            ? (inc.myInteractions ?? []).filter(t => t !== type)
            : [...(inc.myInteractions ?? []), type],
        };
      }));
    } catch {
      toast.error('Action failed');
    }
  };

  const lastRef = useCallback((node: HTMLElement | null) => {
    if (loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) load(page + 1);
    });
    if (node) observerRef.current.observe(node);
  }, [loadingMore, hasNextPage, load, page]);

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          hubId="incident-reports"
          toolbar={
            <div className="space-y-3">
              {user ? (
                <div className="flex justify-end">
                  <LocalHuudHubPrimaryAction
                    label={showCreate ? 'Cancel' : 'File report'}
                    icon={showCreate ? 'close' : 'add'}
                    onClick={() => setShowCreate((v) => !v)}
                  />
                </div>
              ) : null}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search incidents..."
                  className="mod-inset flex-1 rounded-xl px-4 py-2.5 text-sm"
                  style={{ color: 'var(--neu-text)' }}
                />
                <button
                  type="submit"
                  className="mod-chip mod-chip-active shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-primary"
                >
                  Search
                </button>
              </form>
              <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
                {CATEGORY_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(f.value as IncidentCategory | '');
                      load(1, true);
                    }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      categoryFilter === f.value ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'
                    }`}
                    style={categoryFilter !== f.value ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
                {(['', 'open', 'in_progress', 'resolved', 'escalated', 'closed'] as const).map((s) => (
                  <button
                    key={s || 'all'}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s as IncidentStatus | '');
                      load(1, true);
                    }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      statusFilter === s ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'
                    }`}
                    style={statusFilter !== s ? { color: 'var(--neu-text-muted)' } : undefined}
                  >
                    {s ? INCIDENT_STATUS_META[s as IncidentStatus].label : 'All status'}
                  </button>
                ))}
              </div>
            </div>
          }
        />
      }
    >
      {showCreate ? (
        <div className="mod-card mb-4 rounded-2xl p-4">
          <h2 className="mb-4 text-base font-bold" style={{ color: 'var(--neu-text)' }}>
            File a new report
          </h2>
          <CreateIncidentForm
            onSuccess={() => {
              setShowCreate(false);
              load(1, true);
            }}
          />
        </div>
      ) : null}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mod-card h-36 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <BrowseEmptyState
          icon="error"
          title={error}
          action={
            <button
              type="button"
              onClick={() => load(1, true)}
              className="mod-chip mod-chip-active rounded-xl px-5 py-2.5 text-sm font-bold text-primary"
            >
              Retry
            </button>
          }
        />
      )}

      {!loading && !error && incidents.length === 0 && (
        <BrowseEmptyState
          icon="report_off"
          title="No incident reports found"
          description="Be the first to document a safety incident in your Huud."
          action={
            user ? (
              <LocalHuudHubPrimaryAction label="File report" onClick={() => setShowCreate(true)} />
            ) : undefined
          }
        />
      )}

      <div className="flex flex-col gap-4">
        {incidents.map((incident, idx) => {
          const isLast = idx === incidents.length - 1;
          return (
            <div key={incident.id} ref={isLast ? lastRef : undefined}>
              <IncidentCard incident={incident} onInteract={handleInteract} />
            </div>
          );
        })}
      </div>

      {loadingMore ? (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}
    </AppBrowseLayout>
  );
}

export default function IncidentReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen neu-base flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <IncidentReportsInner />
    </Suspense>
  );
}
