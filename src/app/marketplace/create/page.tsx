"use client";

/**
 * Create Product Page
 * Form to create a new marketplace listing
 */

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/marketplace";
import { Product } from "@/services/marketplace.service";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

export default function CreateProductPage() {
  const router = useRouter();

  const handleSuccess = (product: Product) => {
    router.push(`/marketplace/${product.id}`);
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
          <h1 className="text-3xl font-bold">Create New Listing</h1>
          <p className="text-gray-400 mt-2">
            List your item for sale in your neighborhood
          </p>
        </div>

        {/* Form */}
        <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
