import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createUserDocument(uid: string, email: string) {
  await setDoc(doc(db, "users", uid), {
    email,
    plan: "starter",
    credits: 30,
    createdAt: new Date(),
  });
}