import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export type StripePlanKey = "starter" | "growth" | "pro";

export type StripePlanConfig = {
  key: StripePlanKey;
  name: string;
  credits: number;
  priceId: string;
};

const starterPriceId = process.env.STRIPE_PRICE_STARTER?.trim();
const growthPriceId = process.env.STRIPE_PRICE_GROWTH?.trim();
const proPriceId = process.env.STRIPE_PRICE_PRO?.trim();

export const STRIPE_PLAN_CONFIGS: StripePlanConfig[] = [
  starterPriceId
    ? {
        key: "starter",
        name: "Starter",
        credits: 40,
        priceId: starterPriceId,
      }
    : null,
  growthPriceId
    ? {
        key: "growth",
        name: "Growth",
        credits: 120,
        priceId: growthPriceId,
      }
    : null,
  proPriceId
    ? {
        key: "pro",
        name: "Pro",
        credits: 300,
        priceId: proPriceId,
      }
    : null,
].filter((plan): plan is StripePlanConfig => Boolean(plan));

export function getStripePlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
  return STRIPE_PLAN_CONFIGS.find((plan) => plan.priceId === priceId) ?? null;
}

export function isAllowedStripePriceId(priceId: string | null | undefined) {
  return Boolean(getStripePlanByPriceId(priceId));
}