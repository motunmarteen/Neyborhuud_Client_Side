"use client";

/**
 * Edit marketplace listing — same glass shell as create
 */

import { use } from "react";
import { useRouter } from "next/navigation";
import { useProduct } from "@/hooks/useMarketplace";
import { ProductForm } from "@/components/marketplace";
import { Product } from "@/services/marketplace.service";
import { GlassFormPage } from "@/components/ui/GlassFormPage";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(id);

  const handleSuccess = (updated: Product) => {
    const pid = updated.id ?? id;
    router.push(`/marketplace?product=${encodeURIComponent(pid)}`);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <GlassFormPage
      wide
      title="Edit listing"
      subtitle="Update your marketplace listing details."
      onClose={handleCancel}
    >
      {isLoading && (
        <div className="space-y-4 animate-pulse py-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-[var(--surface-light)] dark:bg-white/10" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl border border-brand-red/35 bg-brand-red/[0.08] p-6 text-center dark:bg-brand-red/10">
          <p className="mb-4 font-medium text-status-danger dark:text-brand-red">Failed to load listing details.</p>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-[var(--border-light)] bg-white px-5 py-2 text-sm font-bold text-brand-black shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-white"
          >
            Go back
          </button>
        </div>
      )}

      {!isLoading && !error && product && (
        <ProductForm product={product} onSuccess={handleSuccess} onCancel={handleCancel} />
      )}
    </GlassFormPage>
  );
}
