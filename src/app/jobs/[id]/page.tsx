"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import ApplyModal from "@/components/jobs/ApplyModal";
import { useJob, useSaveJob, useCloseJob } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-500/20 text-green-400",
  "part-time": "bg-blue-500/20 text-blue-400",
  contract: "bg-yellow-500/20 text-yellow-400",
  freelance: "bg-purple-500/20 text-purple-400",
  internship: "bg-gray-500/20 text-gray-400",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading, error } = useJob(id);
  const saveJob = useSaveJob();
  const closeJob = useCloseJob();

  const job = (data as any)?.data ?? data;

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e]">
            <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse space-y-4">
              <div className="h-8 bg-gray-800 rounded w-2/3" />
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-800 rounded-full w-24" />
                <div className="h-6 bg-gray-800 rounded-full w-20" />
              </div>
              <div className="h-40 bg-gray-800 rounded-xl" />
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">Job not found</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  const isOwner = user?.id === job.employerId;
  const employerName = job.employer
    ? [job.employer.firstName, job.employer.lastName].filter(Boolean).join(" ") ||
      job.employer.username
    : null;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* Back */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Jobs
            </button>

            {/* Main Card */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              {/* Title + badges */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{job.title}</h1>
                  {employerName && (
                    <p className="text-gray-400">
                      Posted by{" "}
                      {job.employer?.username ? (
                        <Link
                          href={`/profile/${job.employer.username}`}
                          className="text-blue-400 hover:underline"
                        >
                          {employerName}
                        </Link>
                      ) : (
                        employerName
                      )}
                    </p>
                  )}
                </div>
                {/* Save button */}
                <button
                  onClick={() =>
                    saveJob.mutate({ jobId: job.id, saved: !!job.isSaved })
                  }
                  disabled={saveJob.isPending}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      job.isSaved ? "text-yellow-400" : "text-gray-500"
                    }`}
                    style={{ fontVariationSettings: job.isSaved ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </button>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span
                  className={`text-xs px-3 py-1 rounded-full capitalize ${TYPE_COLORS[job.type] ?? "bg-gray-700 text-gray-300"}`}
                >
                  {(job.type ?? "").replace("-", " ")}
                </span>
                <span className="text-xs px-3 py-1 rounded-full capitalize bg-indigo-500/20 text-indigo-400">
                  {(job.workMode ?? "").replace("-", " ")}
                </span>
                {job.status && job.status !== "active" && (
                  <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 capitalize">
                    {job.status}
                  </span>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4 mb-5 p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-gray-500 text-[18px] mt-0.5">location_on</span>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-white">
                      {[job.location?.lga, job.location?.state].filter(Boolean).join(", ") || "Nigeria"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-gray-500 text-[18px] mt-0.5">category</span>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-white">{job.category}</p>
                  </div>
                </div>
                {job.salary && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-green-400 text-[18px] mt-0.5">payments</span>
                    <div>
                      <p className="text-xs text-gray-500">Salary</p>
                      <p className="text-sm text-white">
                        ₦{job.salary.min.toLocaleString()} – ₦{job.salary.max.toLocaleString()} / {job.salary.period}
                      </p>
                    </div>
                  </div>
                )}
                {job.expiresAt && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[18px] mt-0.5">event</span>
                    <div>
                      <p className="text-xs text-gray-500">Closing Date</p>
                      <p className="text-sm text-white">{formatDate(job.expiresAt)}</p>
                    </div>
                  </div>
                )}
                {typeof job.applications === "number" && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[18px] mt-0.5">group</span>
                    <div>
                      <p className="text-xs text-gray-500">Applicants</p>
                      <p className="text-sm text-white">{job.applications}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply button */}
              {!isOwner && job.status === "active" && (
                <button
                  onClick={() => setShowApply(true)}
                  disabled={job.hasApplied}
                  className={`w-full py-3 rounded-xl font-bold text-base transition-colors ${
                    job.hasApplied
                      ? "bg-gray-700 text-gray-400 cursor-default"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  {job.hasApplied ? "✓ Applied" : "Apply Now"}
                </button>
              )}

              {/* Owner actions */}
              {isOwner && (
                <div className="flex gap-3">
                  {job.status === "active" && (
                    <button
                      onClick={() => closeJob.mutate(job.id)}
                      disabled={closeJob.isPending}
                      className="flex-1 py-3 bg-red-900/40 hover:bg-red-900/60 border border-red-700 text-red-400 rounded-xl font-semibold transition-colors"
                    >
                      Close Job
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">Description</h2>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="material-symbols-outlined text-blue-400 text-[16px] mt-0.5">check_circle</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="bg-gray-800 text-gray-300 rounded-full px-3 py-1.5 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-600 pb-4">
              Posted {formatDate(job.createdAt)}
            </div>
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />

      {showApply && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setShowApply(false)}
        />
      )}
    </div>
  );
}
