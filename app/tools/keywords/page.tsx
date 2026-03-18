"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/components/providers/AuthProvider";

type RankedKeyword = {
  keyword: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
  matched_keyword: string | null;
  keyword_type:
    | "core"
    | "tutorial"
    | "longtail"
    | "outcome"
    | "variation";
};

export default function KeywordsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [loadingGen, setLoadingGen] = useState(false);
  const [error, setError] = useState("");
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const [bestKeyword, setBestKeyword] = useState<RankedKeyword | null>(null);
  const [top5, setTop5] = useState<RankedKeyword[]>([]);
  const [top10, setTop10] = useState<RankedKeyword[]>([]);
  const [rankedKeywords, setRankedKeywords] = useState<RankedKeyword[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  async function findKeywords() {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    try {
      setLoadingGen(true);
      setError("");
      setBestKeyword(null);
      setTop5([]);
      setTop10([]);
      setRankedKeywords([]);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          topic,
          niche,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to find keywords.");
      }

      setBestKeyword(data.bestKeyword ?? null);
      setTop5(Array.isArray(data.top5) ? data.top5 : []);
      setTop10(Array.isArray(data.top10) ? data.top10 : []);
      setRankedKeywords(
        Array.isArray(data.rankedKeywords) ? data.rankedKeywords : []
      );
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

  function getKeywordTypeLabel(type: RankedKeyword["keyword_type"]) {
    switch (type) {
      case "core":
        return "Core";
      case "tutorial":
        return "Tutorial";
      case "longtail":
        return "Long-tail";
      case "outcome":
        return "Outcome";
      case "variation":
        return "Variation";
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

      <section className="relative mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
        </div>

        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold md:text-4xl">
            Keyword Finder
          </h1>

          <p className="mt-3 text-white/60">
            Start with a broad topic and find strong keyword opportunities to
            use in your tags, titles and descriptions.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Main topic or seed phrase"
            className="w-full rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Optional niche or context"
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
            onClick={findKeywords}
            disabled={loadingGen}
            className="w-full rounded-2xl bg-[#ff0033] px-4 py-3 font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
          >
            {loadingGen ? "Finding keywords..." : "Find Keywords (1 token)"}
          </button>

          {creditsRemaining !== null && (
            <p className="text-sm text-white/50">
              Credits remaining: {creditsRemaining}
            </p>
          )}
        </div>

        {bestKeyword && (
          <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-300">
              Best keyword
            </p>

            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {bestKeyword.keyword}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Search volume: {bestKeyword.search_volume} · Competition:{" "}
                  {bestKeyword.competition_level} · Score: {bestKeyword.score}
                </p>
              </div>

              <button
                onClick={() => copy(bestKeyword.keyword)}
                className="rounded-2xl border border-white/10 bg-[#1f1f1f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#242424]"
              >
                Copy keyword
              </button>
            </div>
          </div>
        )}

        {top5.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold">Top 5 opportunities</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {top5.map((item) => (
                <div
                  key={item.keyword}
                  className="rounded-3xl border border-white/10 bg-[#1f1f1f] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {item.keyword}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-[#121212] px-3 py-1 text-xs text-white/50">
                      {getKeywordTypeLabel(item.keyword_type)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-white/65">
                    <p>Search volume: {item.search_volume}</p>
                    <p>Competition: {item.competition_level}</p>
                    <p>Score: {item.score}</p>
                  </div>

                  <button
                    onClick={() => copy(item.keyword)}
                    className="mt-4 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {rankedKeywords.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold">All ranked keywords</h2>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#1f1f1f]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-[#121212] text-white/60">
                    <tr>
                      <th className="px-4 py-3 font-medium">Keyword</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Volume</th>
                      <th className="px-4 py-3 font-medium">Competition</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedKeywords.map((item) => (
                      <tr
                        key={item.keyword}
                        className="border-t border-white/10 text-white/80"
                      >
                        <td className="px-4 py-3">{item.keyword}</td>
                        <td className="px-4 py-3">
                          {getKeywordTypeLabel(item.keyword_type)}
                        </td>
                        <td className="px-4 py-3">{item.search_volume}</td>
                        <td className="px-4 py-3">
                          {item.competition_level}
                        </td>
                        <td className="px-4 py-3">{item.score}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copy(item.keyword)}
                            className="text-red-300 hover:text-red-200"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}