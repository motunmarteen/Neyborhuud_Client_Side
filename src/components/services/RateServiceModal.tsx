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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] border border-gray-800 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Rate & Review</h2>
            <p className="text-sm text-gray-400 mt-0.5">{serviceTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-sm text-gray-400">How would you rate this service?</p>
            <StarRating value={rating} size="lg" onChange={setRating} />
            {rating > 0 && (
              <p className="text-sm text-gray-300">
                {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Review (optional)</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              maxLength={500}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
            />
            <p className="text-right text-xs text-gray-600 mt-1">{review.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={rateService.isPending || rating === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-white transition-colors"
          >
            {rateService.isPending ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
