"use client";

import { useState } from "react";
import { useBookService } from "@/hooks/useServices";

interface Props {
  serviceId: string;
  serviceTitle: string;
  onClose: () => void;
}

export default function BookModal({ serviceId, serviceTitle, onClose }: Props) {
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const book = useBookService();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    book.mutate(
      { serviceId, date: new Date(date).toISOString(), notes: notes.trim() || undefined },
      { onSuccess: onClose }
    );
  }

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 30);
  const minDateStr = minDate.toISOString().slice(0, 16);

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
            <h2 className="text-lg font-bold text-white">Book Service</h2>
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
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={date}
              min={minDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or instructions..."
              rows={3}
              maxLength={500}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
            />
            <p className="text-right text-xs text-gray-600 mt-1">{notes.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={book.isPending || !date}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-white transition-colors"
          >
            {book.isPending ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
