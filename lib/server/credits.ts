import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export async function consumeCredits(uid: string, amount: number) {
  const userRef = adminDb.collection("users").doc(uid);

  const result = await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(userRef);

    if (!snap.exists) {
      throw new Error("User record not found.");
    }

    const data = snap.data() as {
      credits?: number;
    };

    const currentCredits = data.credits ?? 0;

    if (currentCredits < amount) {
      throw new Error("Not enough credits.");
    }

    transaction.update(userRef, {
      credits: FieldValue.increment(-amount),
    });

    return {
      remainingCredits: currentCredits - amount,
    };
  });

  return result;
}