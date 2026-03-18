"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

type Plan = {
  name: string;
  price: string;
  tokens: number;
  priceId: string;
  popular?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$19",
    tokens: 40,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
    features: [
      "40 tokens per month",
      "AI title & tag tools",
      "Keyword opportunity scoring",
      "SEO titles, descriptions & tags",
    ],
  },
  {
    name: "Growth",
    price: "$39",
    tokens: 120,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH ?? "",
    popular: true,
    features: [
      "120 tokens per month",
      "Advanced keyword research",
      "Priority generation speed",
      "Best value for creators",
    ],
  },
  {
    name: "Pro",
    price: "$69",
    tokens: 300,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    features: [
      "300 tokens per month",
      "Unlimited tool usage within tokens",
      "Bulk SEO workflows",
      "Priority support",
    ],
  },
];

function PricingPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const checkoutStatus = searchParams.get("checkout");

  async function handleCheckout(priceId: string, planName: string) {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!priceId) {
      alert(`Missing Stripe price ID for ${planName}.`);
      return;
    }

    try {
      setLoadingPlan(planName);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Checkout failed.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Stripe did not return a checkout URL.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            <CreditCard className="h-3.5 w-3.5" />
            Pricing
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Simple pricing for creators
          </h1>

          <p className="mt-4 text-sm text-white/60 md:text-base">
            Pay only for the AI usage you need. Tokens reset every month and can
            be used across your SEO tools.
          </p>
        </div>

        {checkoutStatus === "cancelled" && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Payment was cancelled. No subscription was created.
          </div>
        )}

        {checkoutStatus === "success" && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            Payment successful. Your subscription is being activated.
          </div>
        )}

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {plans.map((plan) => {
            const isPopular = Boolean(plan.popular);
            const hasValidPriceId = Boolean(plan.priceId);

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-6 ${
                  isPopular
                    ? "border-red-500/30 bg-[#1f1f1f] shadow-[0_0_0_1px_rgba(255,0,51,0.08)]"
                    : "border-white/10 bg-[#1f1f1f]"
                }`}
              >
                {isPopular && (
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-red-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most Popular
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {plan.name}
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                      {plan.tokens} tokens / month
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2 text-right ${
                      isPopular
                        ? "bg-red-500/10 text-red-200"
                        : "bg-[#121212] text-white"
                    }`}
                  >
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <p className="text-xs text-white/45">per month</p>
                  </div>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-white/80"
                    >
                      <span className="mt-0.5 rounded-full bg-red-500/10 p-1 text-red-300">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.priceId, plan.name)}
                  disabled={loadingPlan === plan.name || !hasValidPriceId}
                  className={`mt-8 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isPopular
                      ? "bg-[#ff0033] text-white hover:bg-[#e0002d]"
                      : "border border-white/10 bg-white text-black hover:bg-white/90"
                  }`}
                >
                  {loadingPlan === plan.name
                    ? "Redirecting..."
                    : hasValidPriceId
                      ? "Subscribe"
                      : "Plan unavailable"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#1a1a1a] px-5 py-4 text-center text-sm text-white/55">
          All plans include access to your creator dashboard and monthly token
          resets. Upgrade any time as your channel grows.
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0f0f0f] text-white">
          <Navbar />
          <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 text-white/70">
              Loading pricing...
            </div>
          </section>
          <Footer />
        </main>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}