import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function consumeCredit(uid: string) {
  const ref = doc(db, "users", uid);

  await updateDoc(ref, {
    credits: increment(-1),
  });
}