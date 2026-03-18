import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getStripePlanByPriceId } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";

type UserRecord = {
  plan?: string;
  credits?: number;
  monthlyCredits?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: number | null;
};

function getStripeCustomerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function getStripeSubscriptionId(
  value: string | Stripe.Subscription | null
) {
  return typeof value === "string" ? value : value?.id ?? null;
}

async function findUserByStripeCustomerId(customerId: string): Promise<{
  docId: string;
  data: UserRecord;
} | null> {
  const snap = await adminDb
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const firstDoc = snap.docs[0];
  const data = firstDoc.data() as UserRecord;

  return {
    docId: firstDoc.id,
    data,
  };
}

async function getSubscriptionPriceId(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.items.data[0]?.price?.id ?? null;
}

async function updateUserFromPlan(args: {
  userId: string;
  priceId: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: number | null;
}) {
  const matchedPlan = getStripePlanByPriceId(args.priceId);

  if (!matchedPlan) {
    throw new Error(
      `No Stripe plan config found for priceId: ${args.priceId ?? "null"}`
    );
  }

  const userRef = adminDb.collection("users").doc(args.userId);

  await userRef.set(
    {
      plan: matchedPlan.key,
      credits: matchedPlan.credits,
      monthlyCredits: matchedPlan.credits,
      stripeCustomerId: args.customerId ?? "",
      stripeSubscriptionId: args.subscriptionId ?? "",
      subscriptionStatus: args.subscriptionStatus ?? "active",
      currentPeriodEnd: args.currentPeriodEnd ?? null,
    },
    { merge: true }
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature." },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId =
        typeof session.metadata?.userId === "string"
          ? session.metadata.userId
          : typeof session.client_reference_id === "string"
            ? session.client_reference_id
            : "";

      const customerId = getStripeCustomerId(session.customer ?? null);
      const subscriptionId = getStripeSubscriptionId(session.subscription ?? null);

      let priceId =
        typeof session.metadata?.priceId === "string"
          ? session.metadata.priceId
          : null;

      if (!priceId && subscriptionId) {
        priceId = await getSubscriptionPriceId(subscriptionId);
      }

      if (userId) {
        await updateUserFromPlan({
          userId,
          priceId,
          customerId,
          subscriptionId,
          subscriptionStatus: "active",
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;

      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : null;

      if (customerId && subscriptionId) {
        const matchedUser = await findUserByStripeCustomerId(customerId);

        if (matchedUser) {
          const priceId = await getSubscriptionPriceId(subscriptionId);

          await updateUserFromPlan({
            userId: matchedUser.docId,
            priceId,
            customerId,
            subscriptionId,
            subscriptionStatus: "active",
          });
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      const subscriptionId = subscription.id;
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const status = subscription.status;
      const currentPeriodEnd =
        typeof subscription.current_period_end === "number"
          ? subscription.current_period_end
          : null;

      if (customerId) {
        const matchedUser = await findUserByStripeCustomerId(customerId);

        if (matchedUser) {
          await adminDb.collection("users").doc(matchedUser.docId).set(
            {
              plan: getStripePlanByPriceId(priceId)?.key ?? matchedUser.data.plan ?? "starter",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: status,
              currentPeriodEnd,
            },
            { merge: true }
          );
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;

      if (customerId) {
        const matchedUser = await findUserByStripeCustomerId(customerId);

        if (matchedUser) {
          await adminDb.collection("users").doc(matchedUser.docId).set(
            {
              subscriptionStatus: "cancelled",
              stripeSubscriptionId: subscription.id,
            },
            { merge: true }
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Webhook handler failed.",
      },
      { status: 500 }
    );
  }
}