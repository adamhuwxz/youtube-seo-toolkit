import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/tools?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      metadata: {
        userId,
        priceId,
      },
      allow_promotion_codes: true,
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
      { error: "Checkout failed." },
      { status: 500 }
    );
  }
}