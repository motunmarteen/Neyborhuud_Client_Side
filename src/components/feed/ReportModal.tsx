'use client';

import { useState } from 'react';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', icon: 'block' },
  { value: 'harassment', label: 'Harassment or bullying', icon: 'person_off' },
  { value: 'hate_speech', label: 'Hate speech', icon: 'do_not_disturb' },
  { value: 'misinformation', label: 'False information', icon: 'report' },
  { value: 'violence', label: 'Violence or threats', icon: 'warning' },
  { value: 'inappropriate', label: 'Inappropriate content', icon: 'visibility_off' },
  { value: 'scam', label: 'Scam or fraud', icon: 'gpp_bad' },
  { value: 'other', label: 'Other', icon: 'more_horiz' },
];

interface ReportModalProps {
  postId: string;
  onClose: () => void;
  onSubmit: (postId: string, reason: string, description?: string) => Promise<void>;
}

export function ReportModal({ postId, onClose, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await onSubmit(postId, selectedReason, description.trim() || undefined);
      setSubmitted(true);
      setTimeout(onClose, 1500);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md mx-auto rounded-t-2xl sm:rounded-2xl neu-modal overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-base font-semibold" style={{ color: 'var(--neu-text)' }}>
            Report Post
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-xl" style={{ color: 'var(--neu-text-muted)' }}>close</span>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-10 px-4">
            <span className="material-symbols-outlined text-4xl text-green-400">check_circle</span>
            <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>Thanks for reporting</p>
            <p className="text-xs text-center" style={{ color: 'var(--neu-text-muted)' }}>
              We&apos;ll review this post and take action if it violates our community guidelines.
            </p>
          </div>
        ) : (
          <>
            {/* Reason selection */}
            <div className="px-4 py-3">
              <p className="text-xs mb-3" style={{ color: 'var(--neu-text-muted)' }}>
                Why are you reporting this post?
              </p>
              <div className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setSelectedReason(r.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      selectedReason === r.value
                        ? 'bg-green-600/20 ring-1 ring-green-500/40'
                        : 'hover:bg-white/5'
                    }`}
                    style={{ color: selectedReason === r.value ? 'var(--neu-accent, #22c55e)' : 'var(--neu-text)' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional description */}
            {selectedReason && (
              <div className="px-4 pb-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details (optional)"
                  rows={2}
                  maxLength={500}
                  className="w-full text-sm rounded-xl px-3 py-2.5 resize-none neu-inset focus:outline-none focus:ring-1 focus:ring-green-500/40"
                  style={{ color: 'var(--neu-text)', backgroundColor: 'transparent' }}
                />
              </div>
            )}

            {/* Submit */}
            <div className="px-4 pb-4">
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: selectedReason ? 'var(--neu-accent, #22c55e)' : undefined,
                  color: selectedReason ? '#fff' : 'var(--neu-text-muted)',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
