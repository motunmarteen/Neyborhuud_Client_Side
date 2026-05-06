"use client";

import { useState, useRef } from "react";
import { useApplyForJob } from "@/hooks/useJobs";

interface ApplyModalProps {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
}

export default function ApplyModal({ jobId, jobTitle, onClose }: ApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyMutation = useApplyForJob();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("File must be under 20 MB");
      return;
    }
    setResume(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyMutation.mutate(
      { jobId, coverLetter: coverLetter.trim() || undefined, resume: resume ?? undefined },
      {
        onSuccess: () => onClose(),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg neu-modal rounded-t-3xl sm:rounded-3xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--neu-text)" }}>
              Apply for Job
            </h2>
            <p className="text-sm mt-0.5 line-clamp-1" style={{ color: "var(--neu-text-muted)" }}>
              {jobTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full mod-btn transition-all"
            style={{ color: "var(--neu-text-muted)" }}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Letter */}
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: "var(--neu-text-secondary)" }}
            >
              Cover Letter{" "}
              <span style={{ color: "var(--neu-text-muted)" }} className="font-normal">
                (optional)
              </span>
            </label>
            <div className="neu-input rounded-xl">
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Introduce yourself and explain why you are a great fit…"
                className="w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none"
                style={{ color: "var(--neu-text)" }}
              />
            </div>
            <p className="text-right text-xs mt-1" style={{ color: "var(--neu-text-muted)" }}>
              {coverLetter.length}/2000
            </p>
          </div>

          {/* Resume Upload */}
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: "var(--neu-text-secondary)" }}
            >
              Resume{" "}
              <span style={{ color: "var(--neu-text-muted)" }} className="font-normal">
                (any file, max 5 MB, optional)
              </span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full mod-inset rounded-xl py-4 text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ color: resume ? "var(--primary)" : "var(--neu-text-muted)" }}
            >
              <span className="material-symbols-outlined text-[22px]">upload_file</span>
              {resume ? resume.name : "Upload Resume (optional)"}
            </button>
            {resume && (
              <button
                type="button"
                onClick={() => {
                  setResume(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="mt-1.5 text-xs transition-colors"
                style={{ color: "var(--brand-red)" }}
              >
                Remove file
              </button>
            )}
          </div>

          {/* Loading bar */}
          {applyMutation.isPending && (
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: "var(--neu-shadow-dark)" }}
            >
              <div className="h-full bg-primary animate-pulse w-2/3 transition-all duration-500 rounded-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold transition-all mod-btn"
              style={{ color: "var(--neu-text)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="flex-1 py-3 rounded-xl font-bold transition-all mod-btn-active text-primary disabled:opacity-60"
            >
              {applyMutation.isPending ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
