import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  UserCredential,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, googleProvider, db } from "@/lib/firebase";

async function createUserDocument(uid: string, email: string | null) {
  const userRef = doc(db, "users", uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      email: email ?? "",
      plan: "starter",
      credits: 30,
      createdAt: serverTimestamp(),
      monthlyCredits: 30,
    });
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);

  await createUserDocument(userCred.user.uid, userCred.user.email);

  return userCred;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  await createUserDocument(userCred.user.uid, userCred.user.email);

  return userCred;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const result = await signInWithPopup(auth, googleProvider);

  await createUserDocument(result.user.uid, result.user.email);

  return result;
}

export async function logOut() {
  return signOut(auth);
}