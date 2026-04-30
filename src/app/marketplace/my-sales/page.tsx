"use client";

/**
 * My Sales Page
 * View all sales (orders where user is seller)
 */

import { useMySales } from "@/hooks/useMarketplace";
import { useRouter } from "next/navigation";
import { Order } from "@/types/api";

export default function MySalesPage() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMySales();

  const sales = data?.pages.flatMap((page: any) => 
    page?.data?.orders || page?.orders || []
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      accepted: "bg-blue-500",
      payment_pending: "bg-orange-500",
      paid: "bg-purple-500",
      in_transit: "bg-indigo-500",
      delivered: "bg-teal-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-[#0f0f1e] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-green-400 text-3xl">sell</span>
            <h1 className="text-3xl font-bold">My Sales</h1>
          </div>
          <p className="text-gray-400 mt-2">Items you're selling</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push("/marketplace/my-orders")}
            className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all border border-gray-700"
          >
            My Orders
          </button>
          <button
            onClick={() => router.push("/marketplace/my-sales")}
            className="px-5 py-2.5 bg-green-500 text-white rounded-full font-semibold"
          >
            My Sales
          </button>
          <button
            onClick={() => router.push("/marketplace/my-offers")}
            className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all border border-gray-700"
          >
            My Offers
          </button>
        </div>

        {/* Sales List */}
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-500 text-[48px]">payments</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Sales Yet</h3>
            <p className="text-gray-400 mb-6">You haven't received any purchase requests</p>
            <button
              onClick={() => router.push("/marketplace/create")}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all text-white"
            >
              List an Item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((order: Order) => (
              <div
                key={order.id}
                onClick={() => router.push(`/marketplace/orders/${order.id}`)}
                className="bg-gray-900 rounded-2xl p-5 hover:bg-gray-800 transition-all cursor-pointer border border-gray-800/50"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-800/50 flex-shrink-0">
                    {order.product?.images?.[0] ? (
                      <img
                        src={order.product.images[0]}
                        alt={order.product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-600 text-[32px]">inventory_2</span>
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
                      {order.buyer?.username || order.buyer?.firstName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-green-400 font-semibold">
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
                        router.push(`/messages/${order.conversationId}`);
                      }}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-sm font-semibold transition-all self-center flex items-center gap-2"
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
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
