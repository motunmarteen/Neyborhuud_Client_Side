"use client";

/**
 * Product Detail Page
 * View full product details, like, comment, and interact with seller
 */

import { useParams, useRouter } from "next/navigation";
import { useProductRoom } from "@/hooks/useMarketplaceSocket";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { ProductDetails } from "@/components/marketplace";
import { useProductMutations } from "@/hooks/useMarketplace";
import { toast } from "sonner";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { location } = useGeolocation();
  const { user } = useAuth();
  const { deleteProduct } = useProductMutations();

  // Join product room for real-time updates
  useProductRoom(productId);

  const handleEdit = (productId: string) => {
    router.push(`/marketplace/${productId}/edit`);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted successfully");
      router.push("/marketplace");
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          <ProductDetails
            productId={productId}
            currentUserId={user?.id}
            userLocation={
              location
          ? {
              lat: location.latitude,
              lng: location.longitude,
            }
          : null
      }
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
