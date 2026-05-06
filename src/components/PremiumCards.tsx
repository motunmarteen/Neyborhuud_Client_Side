"use client";

import { toast } from "sonner";
import { useInitiatePayment } from "@/hooks/usePayments";

const TIERS = [
  {
    id: "free" as const,
    name: "Free",
    price: 0,
    borderColor: "border-gray-600",
    badgeClass: "bg-gray-700 text-gray-300",
    features: [
      "Basic feed access",
      "3 marketplace listings",
      "1 active job post",
      "Community chat",
    ],
    cta: null,
  },
  {
    id: "bronze" as const,
    name: "Bronze",
    price: 500,
    period: "/month",
    borderColor: "border-amber-700",
    badgeClass: "bg-amber-900/40 text-amber-400",
    btnClass: "bg-amber-700 hover:bg-amber-600 text-white",
    features: [
      "Everything in Free",
      "10 marketplace listings",
      "5 active job posts",
      "Priority feed placement",
      "Verified badge",
    ],
    cta: "Upgrade to Bronze",
  },
  {
    id: "silver" as const,
    name: "Silver",
    price: 1500,
    period: "/month",
    borderColor: "border-slate-400",
    badgeClass: "bg-slate-700/40 text-slate-300",
    btnClass: "bg-blue-500 hover:bg-blue-400 text-white",
    popular: true,
    features: [
      "Everything in Bronze",
      "25 marketplace listings",
      "15 active job posts",
      "2× HuudCoins earn rate",
      "Analytics dashboard",
      "Promoted profile",
    ],
    cta: "Upgrade to Silver",
  },
  {
    id: "gold" as const,
    name: "Gold",
    price: 3000,
    period: "/month",
    borderColor: "border-yellow-400",
    badgeClass: "bg-yellow-900/40 text-yellow-400",
    btnClass: "bg-yellow-500 hover:bg-yellow-400 text-black",
    features: [
      "Everything in Silver",
      "Unlimited listings",
      "Unlimited job posts",
      "3× HuudCoins earn rate",
      "Featured seller badge",
      "Early feature access",
      "Dedicated support",
    ],
    cta: "Upgrade to Gold",
  },
  {
    id: "platinum" as const,
    name: "Platinum",
    price: 7500,
    period: "/month",
    borderColor: "border-purple-400",
    badgeClass: "bg-purple-900/40 text-purple-400",
    btnClass: "bg-purple-500 hover:bg-purple-400 text-white",
    features: [
      "Everything in Gold",
      "Business profile page",
      "API access",
      "5× HuudCoins earn rate",
      "White-glove onboarding",
      "Custom community branding",
    ],
    cta: "Upgrade to Platinum",
  },
];

interface Props {
  currentTier?: string;
}

export function PremiumCards({ currentTier }: Props) {
  const { mutate: initiatePayment, isPending } = useInitiatePayment();

  function handleUpgrade(tier: (typeof TIERS)[number]) {
    if (!tier.cta) return;
    initiatePayment(
      {
        type: "premium_subscription",
        amount: tier.price,
        currency: "NGN",
        metadata: { plan: tier.id },
      },
      {
        onError: () =>
          toast.error("Failed to initiate payment. Please try again."),
      },
    );
  }

  const activeTier = currentTier ?? "free";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {TIERS.map((tier) => {
        const isCurrent = activeTier === tier.id;
        return (
          <div
            key={tier.id}
            className={`relative flex flex-col rounded-2xl border-2 bg-[#1a1a2e] p-5 ${tier.borderColor} ${
              tier.popular
                ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0f0f1e]"
                : ""
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-xs font-bold text-white whitespace-nowrap">
                Most Popular
              </div>
            )}

            {/* Tier badge */}
            <div
              className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${tier.badgeClass}`}
            >
              {tier.name}
            </div>

            {/* Price */}
            <div className="mb-4">
              {tier.price === 0 ? (
                <span className="text-2xl font-bold text-white">Free</span>
              ) : (
                <span className="text-2xl font-bold text-white">
                  ₦{tier.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-400">
                    {tier.period}
                  </span>
                </span>
              )}
            </div>

            {/* Features list */}
            <ul className="space-y-2 flex-1 mb-5">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="material-symbols-outlined text-green-400 text-base mt-0.5">
                    check_circle
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            {isCurrent ? (
              <div className="text-center py-2.5 rounded-xl bg-gray-700/40 text-gray-400 text-sm font-semibold">
                Current Plan
              </div>
            ) : tier.cta && "btnClass" in tier ? (
              <button
                onClick={() => handleUpgrade(tier)}
                disabled={isPending}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${tier.btnClass}`}
              >
                {isPending ? "Processing…" : tier.cta}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
