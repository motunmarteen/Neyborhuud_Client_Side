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
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyMutation = useApplyForJob();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Resume must be under 5 MB");
      return;
    }
    setResume(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProgress(10);
    applyMutation.mutate(
      { jobId, coverLetter: coverLetter.trim() || undefined, resume: resume ?? undefined },
      {
        onSuccess: () => {
          setProgress(100);
          onClose();
        },
        onError: () => setProgress(0),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div className="w-full sm:max-w-lg bg-[#1a1a2e] rounded-t-2xl sm:rounded-2xl border border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Apply for Job</h2>
            <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Cover Letter <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Introduce yourself and explain why you're a great fit..."
              className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-right text-xs text-gray-500 mt-1">
              {coverLetter.length}/1000
            </p>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Resume <span className="text-gray-500">(PDF/DOCX, max 5 MB, optional)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl py-4 text-gray-400 hover:text-blue-400 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              {resume ? resume.name : "Upload Resume"}
            </button>
            {resume && (
              <button
                type="button"
                onClick={() => { setResume(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="mt-1.5 text-xs text-red-400 hover:text-red-300"
              >
                Remove file
              </button>
            )}
          </div>

          {/* Progress bar */}
          {applyMutation.isPending && (
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white rounded-xl font-semibold transition-colors"
            >
              {applyMutation.isPending ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
