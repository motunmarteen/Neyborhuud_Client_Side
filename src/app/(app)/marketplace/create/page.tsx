"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/marketplace";
import { Product } from "@/services/marketplace.service";
import { GlassFormPage } from "@/components/ui/GlassFormPage";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { PostCreationSuccessSheet } from "@/components/shared/PostCreationSuccessSheet";

export default function CreateProductPage() {
  const router = useRouter();
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  const handleSuccess = (product: Product) => {
    setCreatedProduct(product);
  };

  const handleDismiss = () => {
    const id = createdProduct?.id;
    setCreatedProduct(null);
    router.push(id ? `/marketplace?product=${encodeURIComponent(id)}` : "/marketplace");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <LocalHuudSubpageShell hubId="marketplace" maxWidth="920">
      <GlassFormPage
        wide
        title="Create listing"
        subtitle="List your item for sale in your Huud."
        onClose={handleCancel}
      >
        <ProductForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </GlassFormPage>

      {createdProduct && (
        <PostCreationSuccessSheet type="marketplace" onDismiss={handleDismiss} />
      )}
    </LocalHuudSubpageShell>
  );
}
