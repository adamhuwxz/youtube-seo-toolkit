import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripe } from "@/lib/stripe";

type UserRecord = {
  plan?: string;
  credits?: number;
  monthlyCredits?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

function getCreditsFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return 30;

  if (priceId === process.env.STRIPE_PRICE_GROWTH) return 100;
  if (priceId === process.env.STRIPE_PRICE_PRO) return 200;

  return 30;
}

function getPlanFromPriceId(priceId: string | null | undefined) {
  if (priceId === process.env.STRIPE_PRICE_GROWTH) return "growth";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "starter";
}

async function findUserByStripeCustomerId(customerId: string): Promise<{
  docId: string;
  data: UserRecord;
} | null> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("stripeCustomerId", "==", customerId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const firstDoc = snap.docs[0];
  const data = firstDoc.data() as UserRecord;

  return {
    docId: firstDoc.id,
    data,
  };
}

async function getPriceIdFromSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription.items.data[0]?.price?.id ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      let priceId: string | null = session.metadata?.priceId ?? null;

      if (!priceId && subscriptionId) {
        priceId = await getPriceIdFromSubscription(subscriptionId);
      }

      if (userId) {
        const credits = getCreditsFromPriceId(priceId);
        const plan = getPlanFromPriceId(priceId);

        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
          plan,
          credits,
          monthlyCredits: credits,
          stripeCustomerId: customerId ?? "",
          stripeSubscriptionId: subscriptionId ?? "",
        });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;

      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : null;

      if (customerId) {
        const matchedUser = await findUserByStripeCustomerId(customerId);

        if (matchedUser) {
          const subscriptionId = matchedUser.data.stripeSubscriptionId ?? "";

          if (subscriptionId) {
            const priceId = await getPriceIdFromSubscription(subscriptionId);
            const credits = getCreditsFromPriceId(priceId);
            const plan = getPlanFromPriceId(priceId);

            const userRef = doc(db, "users", matchedUser.docId);

            await updateDoc(userRef, {
              credits,
              monthlyCredits: credits,
              plan,
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);

    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }
}