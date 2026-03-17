"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Chrome, Lock, Mail, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      await signInWithGoogle();
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google sign-in failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <Navbar />
        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#1f1f1f] p-8 text-center text-white/70">
            Checking account...
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="relative px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_460px] lg:items-center">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
              <Sparkles className="h-3.5 w-3.5" />
              Creator Access
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white xl:text-5xl">
              Sign in to access your YouTube SEO tools.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">
              Get access to title ideas, tag generation, descriptions, scripts,
              and other focused creator tools built to save time.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {[
                "AI title generation",
                "Tag and keyword tools",
                "Description and script help",
                "Credits and plan tracking",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-sm text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-6 shadow-2xl md:p-8"
            >
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {mode === "login" ? "Login" : "Sign Up"}
                </h2>

                <p className="mt-2 text-sm leading-7 text-white/60">
                  Sign in to access your creator dashboard and SEO tools.
                </p>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Chrome className="h-4 w-4" />
                Continue with Google
              </button>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-[0.2em] text-white/35">
                  or
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/75">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 focus-within:border-red-500/40">
                    <Mail className="h-4 w-4 text-white/35" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/75">
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#121212] px-4 py-3 focus-within:border-red-500/40">
                    <Lock className="h-4 w-4 text-white/35" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      className="w-full bg-transparent text-white outline-none placeholder:text-white/30"
                      placeholder={
                        mode === "login"
                          ? "Enter your password"
                          : "Create a password"
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#ff0033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                      ? "Login with Email"
                      : "Create Account"}
                </button>
              </form>

              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
                disabled={loading}
                className="mt-5 text-sm font-medium text-red-300 transition hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "login"
                  ? "Need an account? Create one"
                  : "Already have an account? Log in"}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}