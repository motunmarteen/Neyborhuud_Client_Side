"use client";

/**
 * Edit Marketplace Listing Page
 * Pre-fills ProductForm with the existing product for editing
 */

import { use } from "react";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/useMarketplace";
import { ProductForm } from "@/components/marketplace";
import { Product } from "@/services/marketplace.service";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);

  const handleSuccess = (updated: Product) => {
    router.push(`/marketplace/${updated.id ?? id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white py-8">
          <div className="max-w-3xl mx-auto px-4">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold">Edit Listing</h1>
              <p className="text-gray-400 mt-2">
                Update your marketplace listing details
              </p>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-[#1a1a2e] rounded-xl" />
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6 text-center">
                <p className="text-red-400 mb-4">Failed to load listing details.</p>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Go Back
                </button>
              </div>
            )}

            {/* Form */}
            {!isLoading && !error && product && (
              <ProductForm
                product={product}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
