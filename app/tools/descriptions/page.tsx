"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/components/providers/AuthProvider";
import { readToolFlow } from "@/lib/tool-flow";

export default function DescriptionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [context, setContext] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loadingGen, setLoadingGen] = useState(false);
  const [error, setError] = useState("");
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    const flow = readToolFlow();

    if (flow.keyword) {
      setPrimaryKeyword(flow.keyword);
    }

    if (flow.secondaryKeywords?.length) {
      setSecondaryKeywords(flow.secondaryKeywords.join(", "));
    }
  }, [loading, user, router]);

  async function generateDescriptions() {
    if (!primaryKeyword.trim() || !context.trim()) {
      setError("Please fill in keyword and context.");
      return;
    }

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    try {
      setLoadingGen(true);
      setError("");
      setResults([]);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          primaryKeyword,
          context,
          secondaryKeywords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }

      setResults(Array.isArray(data.descriptions) ? data.descriptions : []);
      setCreditsRemaining(
        typeof data.creditsRemaining === "number" ? data.creditsRemaining : null
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoadingGen(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Failed to copy text.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] text-white">
        <Navbar />
        <div className="px-4 py-12 md:px-6">Checking account...</div>
        <Footer />
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="relative mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
        </div>

        <h1 className="text-3xl font-semibold md:text-4xl">
          Description Generator
        </h1>

        <p className="mt-3 text-white/60">
          Use your top keyword from the Tags tool, then paste your transcript or
          explain your video to generate accurate descriptions.
        </p>

        <div className="mt-8 space-y-5">
          <input
            type="text"
            value={primaryKeyword}
            onChange={(e) => setPrimaryKeyword(e.target.value)}
            placeholder="Primary keyword (from tags tool)"
            className="w-full rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste transcript or describe your video..."
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <input
            type="text"
            value={secondaryKeywords}
            onChange={(e) => setSecondaryKeywords(e.target.value)}
            placeholder="Optional secondary keywords (comma separated)"
            className="w-full rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error === "Not enough credits."
                ? "You don’t have enough tokens. Upgrade your plan to continue."
                : error}
            </div>
          )}

          <button
            onClick={generateDescriptions}
            disabled={loadingGen}
            className="w-full rounded-2xl bg-[#ff0033] px-4 py-3 font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
          >
            {loadingGen
              ? "Generating..."
              : "Generate Descriptions (1 token)"}
          </button>

          {creditsRemaining !== null && (
            <p className="text-sm text-white/50">
              Credits remaining: {creditsRemaining}
            </p>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-10 space-y-6">
            {results.map((desc, i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-5"
              >
                <p className="text-sm text-white/50">Option {i + 1}</p>

                <p className="mt-3 whitespace-pre-wrap text-white/90">
                  {desc}
                </p>

                <button
                  onClick={() => copy(desc)}
                  className="mt-4 text-sm font-medium text-red-300 hover:text-red-200"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}