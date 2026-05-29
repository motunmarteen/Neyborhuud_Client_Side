"use client";

/**
 * Create listing — glass sheet on doodle surface (same family as marketplace browse + offer modal)
 */

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/marketplace";
import { Product } from "@/services/marketplace.service";
import { GlassFormPage } from "@/components/ui/GlassFormPage";

export default function CreateProductPage() {
  const router = useRouter();

  const handleSuccess = (product: Product) => {
    const id = product.id;
    router.push(id ? `/marketplace?product=${encodeURIComponent(id)}` : "/marketplace");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <GlassFormPage
      wide
      title="Create listing"
      subtitle="List your item for sale in your Huud."
      onClose={handleCancel}
    >
      <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </GlassFormPage>
  );
}
