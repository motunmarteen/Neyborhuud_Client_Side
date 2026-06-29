"use client";

import { useState } from "react";
import { useRateService } from "@/hooks/useServices";
import StarRating from "./StarRating";

interface Props {
  serviceId: string;
  serviceTitle: string;
  onClose: () => void;
}

export default function RateServiceModal({ serviceId, serviceTitle, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const rateService = useRateService();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    rateService.mutate(
      { serviceId, rating, review: review.trim() || undefined },
      { onSuccess: onClose }
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="mod-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--neu-text)" }}>Rate &amp; Review</h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--neu-text-muted)" }}>{serviceTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full mod-chip transition-all"
            style={{ color: "var(--neu-text-muted)" }}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm" style={{ color: "var(--neu-text-muted)" }}>How would you rate this service?</p>
            <StarRating value={rating} size="lg" onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>Review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              maxLength={500}
              className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all resize-none text-sm"
              style={{ color: "var(--neu-text)" }}
            />
            <p className="text-right text-xs mt-1" style={{ color: "var(--neu-text-muted)" }}>{review.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={rateService.isPending || rating === 0}
            className="w-full py-3.5 mod-chip mod-chip-active text-primary disabled:opacity-50 rounded-xl font-bold transition-all"
          >
            {rateService.isPending ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
