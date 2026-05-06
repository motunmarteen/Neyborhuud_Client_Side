"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import CreateJobForm from "@/components/jobs/CreateJobForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateJobPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />

      <main className="flex flex-col flex-1 overflow-y-auto">
        <TopNav />

        <div className="px-4 pt-5 pb-20">
          {/* Back header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl mod-btn transition-all"
              style={{ color: "var(--neu-text-muted)" }}
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--neu-text)" }}>Post a Job</h1>
              <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>
                Fill in the details to list a job opening
              </p>
            </div>
          </div>

          <CreateJobForm />
        </div>
      </main>

      <RightSidebar />
      <BottomNav />
    </div>
  );
}
