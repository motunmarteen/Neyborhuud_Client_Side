'use client';

import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAdminReports, useResolveReport, useAdminReport } from '@/hooks/useAdmin';
import { Report } from '@/types/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<string, string> = {
  pending:      'bg-status-warning/15 text-status-warning',
  under_review: 'bg-sky-500/20   text-sky-300',
  resolved:     'bg-primary/20 text-primary',
  dismissed:    'bg-slate-500/20  text-[var(--neu-text-muted)]',
};

const TARGET_CHIP: Record<string, string> = {
  user:        'bg-brand-blue500/20 text-brand-blue300',
  post:        'bg-brand-blue/20   text-brand-blue',
  comment:     'bg-brand-blue500/20 text-brand-blue300',
  message:     'bg-sky-500/20    text-sky-300',
  marketplace: 'bg-status-warning/15 text-status-warning',
  service:     'bg-brand-green-dark/20   text-brand-green-dark',
  event:       'bg-brand-red500/20   text-brand-red300',
};

const RESOLVE_ACTIONS = [
  { value: 'dismiss',  label: 'Dismiss',      color: 'bg-slate-600 hover:bg-slate-500' },
  { value: 'warn',     label: 'Warn User',    color: 'bg-amber-600 hover:bg-primary' },
  { value: 'remove',   label: 'Remove Content', color: 'bg-brand-red600 hover:bg-brand-red' },
  { value: 'suspend',  label: 'Suspend User', color: 'bg-status-danger hover:bg-status-danger/85' },
] as const;

// ── Review side panel ─────────────────────────────────────────────────────────

function ReviewPanel({
  reportId,
  onClose,
}: {
  reportId: string;
  onClose: () => void;
}) {
  const { data: report, isLoading } = useAdminReport(reportId);
  const resolve = useResolveReport();
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (action: 'dismiss' | 'remove' | 'warn' | 'suspend') => {
    setResolving(action);
    await resolve.mutateAsync({ reportId, action, notes: note || undefined });
    onClose();
  };

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#13132a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-black text-white">Review Report</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : !report ? (
            <p className="text-center text-white/40 py-12">Could not load report details.</p>
          ) : (() => {
            const r = report as unknown as Report;
            return (
              <>
                {/* Meta */}
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TARGET_CHIP[r.targetType] ?? 'bg-white/10 text-white/60'}`}>
                    {r.targetType}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_CHIP[r.status] ?? 'bg-white/10 text-white/60'}`}>
                    {r.status}
                  </span>
                </div>

                {/* Reporter */}
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/30">Reported by</p>
                  <p className="text-sm font-bold text-white">
                    @{r.reporter?.username ?? r.reporterId}
                  </p>
                  <p className="text-xs text-white/40">{new Date(r.createdAt).toLocaleString()}</p>
                </div>

                {/* Reason */}
                <div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/30">Reason</p>
                  <p className="text-sm text-white">{r.reason}</p>
                </div>

                {/* Description */}
                {r.description && (
                  <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-white/30">Details</p>
                    <p className="text-sm leading-6 text-white/70">{r.description}</p>
                  </div>
                )}

                {/* Evidence */}
                {Array.isArray(r.evidence) && r.evidence.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/30">Evidence</p>
                    <div className="flex flex-wrap gap-2">
                      {r.evidence.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-white/20 transition-colors"
                        >
                          Evidence {i + 1} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Action footer */}
        {report && (report as unknown as Report).status === 'pending' || (report as unknown as Report)?.status === 'under_review' ? (
          <div className="border-t border-white/10 p-5 space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/30">
              Admin note (optional)
            </label>
            <textarea
              className="w-full rounded-xl bg-white/10 p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              rows={2}
              placeholder="Internal note about this resolution…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              {RESOLVE_ACTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handleResolve(value)}
                  disabled={resolve.isPending}
                  className={`rounded-xl py-2.5 text-sm font-black text-white transition-colors disabled:opacity-50 ${color} ${resolving === value ? 'opacity-70' : ''}`}
                >
                  {resolving === value && resolve.isPending ? 'Working…' : label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ── Report row ────────────────────────────────────────────────────────────────

function ReportRow({
  report,
  onReview,
}: {
  report: Report;
  onReview: (id: string) => void;
}) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${TARGET_CHIP[report.targetType] ?? 'bg-white/10 text-white/60'}`}>
          {report.targetType}
        </span>
      </td>
      <td className="px-4 py-3 max-w-[220px]">
        <p className="truncate text-sm text-white">{report.reason}</p>
        {report.description && (
          <p className="truncate text-xs text-white/40">{report.description}</p>
        )}
      </td>
      <td className="hidden px-4 py-3 text-sm text-white/50 sm:table-cell">
        @{report.reporter?.username ?? report.reporterId}
      </td>
      <td className="hidden px-4 py-3 text-xs text-white/40 md:table-cell">
        {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_CHIP[report.status] ?? 'bg-white/10 text-white/60'}`}>
          {report.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => onReview((report as any)._id ? String((report as any)._id) : report.id)}
          className="rounded-xl border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60 hover:border-emerald-500/50 hover:text-primary transition-colors"
        >
          Review
        </button>
      </td>
    </tr>
  );
}

// ── Status filter tabs ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: undefined,        label: 'All' },
  { value: 'pending',        label: 'Pending' },
  { value: 'under_review',   label: 'Under Review' },
  { value: 'resolved',       label: 'Resolved' },
  { value: 'dismissed',      label: 'Dismissed' },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'under_review' | 'resolved' | 'dismissed' | undefined
  >(undefined);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useAdminReports({ status: statusFilter });

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: '200px' });

  if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();

  const allReports: Report[] =
    data?.pages.flatMap((p: any) => {
      const items = p?.reports ?? p?.data ?? p?.items ?? [];
      return Array.isArray(items) ? items : [];
    }) ?? [];

  return (
    <div className="p-4 sm:p-6">
      {/* Review panel */}
      {reviewingId && (
        <ReviewPanel reportId={reviewingId} onClose={() => setReviewingId(null)} />
      )}

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white">Reports</h1>
        <p className="text-sm text-white/40">Review content flagged by the community</p>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(value as any)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              statusFilter === value
                ? 'bg-emerald-600 text-white'
                : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-white/50">
            <span className="material-symbols-outlined text-[40px] text-brand-red">error</span>
            <p className="mt-2 text-sm">Could not load reports.</p>
          </div>
        ) : allReports.length === 0 ? (
          <div className="py-16 text-center text-white/40">
            <span className="material-symbols-outlined text-[40px]">flag</span>
            <p className="mt-2 text-sm">No reports found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30">Reason</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 sm:table-cell">Reporter</th>
                  <th className="hidden px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30 md:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/30">Action</th>
                </tr>
              </thead>
              <tbody>
                {allReports.map((report: Report) => (
                  <ReportRow
                    key={report.id ?? (report as any)._id}
                    report={report}
                    onReview={setReviewingId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
        )}
      </div>
    </div>
  );
}
