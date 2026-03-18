import { NextResponse } from "next/server";
import {
  stripe,
  getStripePlanByPriceId,
  STRIPE_PLAN_CONFIGS,
} from "@/lib/stripe";

type CheckoutRequestBody = {
  priceId?: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;

    const priceId =
      typeof body.priceId === "string" ? body.priceId.trim() : "";
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "Missing priceId or userId." },
        { status: 400 }
      );
    }

    const matchedPlan = getStripePlanByPriceId(priceId);

    if (!matchedPlan) {
      return NextResponse.json(
        {
          error:
            "Invalid Stripe price ID. Check your pricing page env vars and server plan config.",
        },
        { status: 400 }
      );
    }

    if (STRIPE_PLAN_CONFIGS.length === 0) {
      return NextResponse.json(
        { error: "No Stripe plans are configured on the server." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

    if (!siteUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SITE_URL." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: matchedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/tools?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: {
        userId,
        priceId: matchedPlan.priceId,
        plan: matchedPlan.key,
      },
      subscription_data: {
        metadata: {
          userId,
          priceId: matchedPlan.priceId,
          plan: matchedPlan.key,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checkout failed.",
      },
      { status: 500 }
    );
  }
}