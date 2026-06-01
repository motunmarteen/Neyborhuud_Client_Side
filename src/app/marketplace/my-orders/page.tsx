"use client";

/**
 * My Orders Page
 * View all purchases (orders where user is buyer)
 */

import { useMyOrders } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { Order } from "@/types/api";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

export default function MyOrdersPage() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyOrders();

  const orders = data?.pages.flatMap((page: any) => 
    page?.data?.orders || page?.orders || []
  ) || [];

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-brand-black text-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-brand-black rounded-lg" />
                ))}
              </div>
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-primary",
      accepted: "bg-brand-blue",
      payment_pending: "bg-brand-red",
      paid: "bg-brand-blue",
      in_transit: "bg-brand-blue500",
      delivered: "bg-brand-green-dark",
      completed: "bg-primary",
      cancelled: "bg-brand-red",
    };
    return colors[status] || "bg-brand-surface";
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-brand-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--neu-text-muted)] hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary text-3xl">shopping_bag</span>
            <h1 className="text-3xl font-bold">My Orders</h1>
          </div>
          <p className="text-[var(--neu-text-muted)] mt-2">Your purchases</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push("/marketplace/my-orders")}
            className="px-5 py-2.5 bg-primary text-white rounded-full font-semibold"
          >
            My Orders
          </button>
          <button
            onClick={() => router.push("/marketplace/my-sales")}
            className="px-5 py-2.5 bg-brand-black/50 hover:bg-brand-black/50 rounded-full transition-all border border-black/[0.08]"
          >
            My Sales
          </button>
          <button
            onClick={() => router.push("/marketplace/my-offers")}
            className="px-5 py-2.5 bg-brand-black/50 hover:bg-brand-black/50 rounded-full transition-all border border-black/[0.08]"
          >
            My Offers
          </button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-black/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--neu-text-muted)] text-[48px]">shopping_bag</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
            <p className="text-[var(--neu-text-muted)] mb-6">You haven't made any purchases</p>
            <button
              onClick={() => router.push("/marketplace")}
              className="px-6 py-3 bg-primary hover:bg-brand-green-dark rounded-full font-semibold transition-all text-white"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/marketplace/orders/${order.id}`)}
                className="bg-brand-black rounded-2xl p-5 hover:bg-brand-black transition-all cursor-pointer border border-black/[0.08]/50"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-brand-black/50 flex-shrink-0">
                    {order.product?.images?.[0] ? (
                      <img
                        src={order.product.images[0]}
                        alt={order.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[var(--neu-text-secondary)] text-[32px]">inventory_2</span>
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate text-white mb-1">
                      {order.product?.title || "Product"}
                    </h3>
                    <p className="text-white/70 text-sm flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {order.seller?.username || order.seller?.firstName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-primary font-semibold">
                        ₦{order.amount.toLocaleString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Chat Link */}
                  {order.conversationId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/chat/${order.conversationId}`);
                      }}
                      className="px-4 py-2 bg-brand-blue hover:bg-blue-600 rounded-full text-sm font-semibold transition-all self-center flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      Chat
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 bg-brand-black hover:bg-brand-black rounded-lg font-semibold transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
