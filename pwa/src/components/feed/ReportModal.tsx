'use client';

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Ban,
  UserX,
  MessageSquareOff,
  AlertTriangle,
  Flame,
  EyeOff,
  ShieldAlert,
  MoreHorizontal,
} from 'lucide-react';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', Icon: Ban },
  { value: 'harassment', label: 'Harassment or bullying', Icon: UserX },
  { value: 'hate_speech', label: 'Hate speech', Icon: MessageSquareOff },
  { value: 'misinformation', label: 'False information', Icon: AlertTriangle },
  { value: 'violence', label: 'Violence or threats', Icon: Flame },
  { value: 'inappropriate', label: 'Inappropriate content', Icon: EyeOff },
  { value: 'scam', label: 'Scam or fraud', Icon: ShieldAlert },
  { value: 'other', label: 'Other', Icon: MoreHorizontal },
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
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel="Report post"
      zIndexClass="z-50"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="bg-black/60 backdrop-blur-sm"
      panelClassName="relative mx-auto w-full max-w-md overflow-hidden rounded-t-2xl neu-modal sm:rounded-2xl"
      handleClassName="pt-2 pb-0"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 ">
          <h3 className="text-base font-semibold" style={{ color: 'var(--neu-text)' }}>
            Report Post
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10  transition-colors">
            <X size={18} style={{ color: 'var(--neu-text-muted)' }} />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-10 px-4">
            <CheckCircle2 size={36} className="text-primary" />
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
                {REPORT_REASONS.map((r) => {
                  const Icon = r.Icon;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setSelectedReason(r.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        selectedReason === r.value
                          ? 'bg-brand-green-dark/20 ring-1 ring-primary/40 text-primary font-bold'
                          : 'hover:bg-black/5  text-charcoal '
                      }`}
                    >
                      <Icon size={16} />
                      {r.label}
                    </button>
                  );
                })}
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
                  className="w-full text-sm rounded-xl px-3 py-2.5 resize-none neu-inset focus:outline-none focus:ring-1 focus:ring-primary/40"
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
                  backgroundColor: selectedReason ? 'var(--neu-accent, #00B82E)' : undefined,
                  color: selectedReason ? '#000' : 'var(--neu-text-muted)',
                }}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
    </BottomSheetOverlay>
  );
}
