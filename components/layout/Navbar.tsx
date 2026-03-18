"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  LogOut,
  CreditCard,
  Coins,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/AuthProvider";
import { logOut } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";

type UserDoc = {
  credits?: number;
};

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setCredits(null);
      return;
    }

    const userPath = `users/${user.uid}`;
    const ref = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setCredits(0);
          return;
        }

        const data = snap.data() as UserDoc;
        setCredits(data.credits ?? 0);
      },
      (error) => {
        console.error("Failed to listen for credits:", {
          code: error.code,
          message: error.message,
          path: userPath,
          userUid: user.uid,
          currentAuthUid: auth.currentUser?.uid ?? null,
          projectId: db.app.options.projectId,
        });
      }
    );

    return () => unsubscribe();
  }, [user, loading]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <motion.header
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/95 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff0033] text-white shadow-lg shadow-red-950/40">
            <Wand2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
              Creator Tools
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
              SEOTube
            </h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link
            href="/"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Home
          </Link>

          {user && (
            <Link
              href="/tools"
              className="text-sm text-white/70 transition hover:text-white"
            >
              Tools
            </Link>
          )}

          <Link
            href="/pricing"
            className="text-sm text-white/70 transition hover:text-white"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {loading ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55 md:px-4 md:text-sm">
              Loading...
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#1f1f1f] px-4 py-2 text-sm text-white/75">
                <span className="max-w-[180px] truncate">
                  {user.displayName || user.email}
                </span>

                <span className="h-4 w-px bg-white/10" />

                <span className="flex items-center gap-1 font-medium text-[#ff4d6d]">
                  <Coins className="h-4 w-4" />
                  {credits ?? "--"}
                </span>
              </div>

              <Link
                href="/tools"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a] md:px-4"
              >
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Tools</span>
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a] md:px-4"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Plans</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1f1f1f] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-60 md:px-4"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {loggingOut ? "Logging out..." : "Logout"}
                </span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/pricing"
                className="hidden rounded-full border border-white/10 bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2a2a2a] sm:inline-flex"
              >
                Pricing
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e0002d]"
              >
                <Sparkles className="h-4 w-4" />
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}