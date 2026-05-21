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
            <h2 className="text-lg font-bold" style={{ color: "var(--neu-text)" }}>Book Service</h2>
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
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
              Date &amp; Time <span style={{ color: "var(--brand-red)" }}>*</span>
            </label>
            <input
              required
              type="datetime-local"
              value={date}
              min={minDateStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all"
              style={{ color: "var(--neu-text)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--neu-text-muted)" }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requirements or instructions..."
              rows={3}
              maxLength={500}
              className="w-full mod-inset rounded-xl px-4 py-3 focus:outline-none transition-all resize-none text-sm"
              style={{ color: "var(--neu-text)" }}
            />
            <p className="text-right text-xs mt-1" style={{ color: "var(--neu-text-muted)" }}>{notes.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={book.isPending || !date}
            className="w-full py-3.5 mod-chip mod-chip-active text-primary disabled:opacity-50 rounded-xl font-bold transition-all"
          >
            {book.isPending ? "Booking…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
