"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import CreateServiceForm from "@/components/services/CreateServiceForm";
import { useAuth } from "@/hooks/useAuth";

export default function CreateServicePage() {
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
        <div className="flex flex-col pb-20">
          {/* Header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full mod-chip transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--neu-text)" }}>Offer a Service</h1>
                <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>List your skills and let neighbors find you</p>
              </div>
            </div>
          </div>

          <CreateServiceForm />
        </div>
      </main>
      <RightSidebar />
      <BottomNav />
    </div>
  );
}
