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
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400"
              >
                <span className="material-symbols-outlined text-[20px]">
                  arrow_back
                </span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Offer a Service</h1>
                <p className="text-sm text-gray-400">
                  List your skills and let neighbors find you
                </p>
              </div>
            </div>

            <CreateServiceForm />
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
