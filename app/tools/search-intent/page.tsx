"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Copy,
  Search,
  Layers3,
  Sparkles,
  Trophy,
  Target,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { readToolFlow, saveToolFlow } from "@/lib/tool-flow";

type IntentType =
  | "beginner"
  | "tutorial"
  | "mistakes"
  | "comparison"
  | "fastest"
  | "advanced"
  | "tools"
  | "results";

type IntentBucket = {
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  keywords: string[];
};

type RankedKeyword = {
  keyword: string;
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
};

type RankedBucket = {
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  keywords: RankedKeyword[];
};

type GenerateResponse = {
  buckets?: IntentBucket[];
  error?: string;
};

type ValidateResponse = {
  rankedBuckets?: RankedBucket[];
  bestOverall?: RankedKeyword[];
  easiestWins?: RankedKeyword[];
  bestByIntent?: {
    intent: IntentType;
    bestKeyword: RankedKeyword | null;
    user_goal: string;
    video_angle: string;
  }[];
  missingAngles?: string[];
  creditsRemaining?: number;
  error?: string;
};

export default function SearchIntentToolPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [buckets, setBuckets] = useState<IntentBucket[]>([]);
  const [rankedBuckets, setRankedBuckets] = useState<RankedBucket[]>([]);
  const [bestOverall, setBestOverall] = useState<RankedKeyword[]>([]);
  const [easiestWins, setEasiestWins] = useState<RankedKeyword[]>([]);
  const [missingAngles, setMissingAngles] = useState<string[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);

  useEffect(() => {
    const flow = readToolFlow();

    if (flow.keyword) {
      setKeyword(flow.keyword);
    }
  }, []);

  async function generateIntentCoverage() {
    if (!keyword.trim()) {
      alert("Please enter a keyword.");
      return;
    }

    try {
      setLoadingGenerate(true);

      const res = await fetch("/api/tools/search-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seedKeyword: keyword,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!res.ok) {
        alert(data.error || "Generation failed.");
        return;
      }

      setBuckets(Array.isArray(data.buckets) ? data.buckets : []);
      setRankedBuckets([]);
      setBestOverall([]);
      setEasiestWins([]);
      setMissingAngles([]);
    } catch (error) {
      console.error("generateIntentCoverage error:", error);
      alert("Something went wrong generating search intent coverage.");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function validateIntentCoverage() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (buckets.length === 0) {
      alert("Generate intent coverage first.");
      return;
    }

    try {
      setLoadingValidate(true);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/search-intent/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          buckets,
        }),
      });

      const data = (await res.json()) as ValidateResponse;

      if (!res.ok) {
        alert(data.error || "Validation failed.");
        return;
      }

      const ranked = Array.isArray(data.rankedBuckets) ? data.rankedBuckets : [];
      const overall = Array.isArray(data.bestOverall) ? data.bestOverall : [];
      const easy = Array.isArray(data.easiestWins) ? data.easiestWins : [];
      const missing = Array.isArray(data.missingAngles)
        ? data.missingAngles
        : [];

      setRankedBuckets(ranked);
      setBestOverall(overall);
      setEasiestWins(easy);
      setMissingAngles(missing);

      if (overall[0]?.keyword) {
        saveToolFlow({
          keyword: overall[0].keyword,
          secondaryKeywords: overall.slice(0, 5).map((item) => item.keyword),
        });
      }
    } catch (error) {
      console.error("validateIntentCoverage error:", error);
      alert("Validation failed.");
    } finally {
      setLoadingValidate(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  function copyKeywords(list: string[]) {
    void navigator.clipboard.writeText(list.join(", "));
  }

  function copyRankedKeywords(list: RankedKeyword[]) {
    void navigator.clipboard.writeText(list.map((item) => item.keyword).join(", "));
  }

  function labelForIntent(intent: IntentType) {
    switch (intent) {
      case "beginner":
        return "Beginner";
      case "tutorial":
        return "Tutorial";
      case "mistakes":
        return "Mistakes";
      case "comparison":
        return "Comparison";
      case "fastest":
        return "Fastest";
      case "advanced":
        return "Advanced";
      case "tools":
        return "Tools";
      case "results":
        return "Results";
      default:
        return "Intent";
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            <Layers3 className="h-3.5 w-3.5" />
            Search Intent Tool
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            YouTube Search Intent Coverage
          </h1>

          <p className="max-w-3xl text-sm text-white/60 md:text-base">
            Enter one keyword to map the main YouTube search intents around it,
            then validate the best keyword opportunities inside each angle.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-red-400" />
                <h2 className="text-base font-semibold">
                  Start with one keyword
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Enter one keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500/50"
                />

                <button
                  onClick={generateIntentCoverage}
                  disabled={loadingGenerate}
                  className="w-full rounded-xl bg-[#ff0033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
                >
                  {loadingGenerate ? "Generating..." : "Generate Intent Coverage"}
                </button>

                <button
                  onClick={validateIntentCoverage}
                  disabled={loadingValidate || buckets.length === 0}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loadingValidate
                    ? "Validating..."
                    : "Validate Opportunities (1 Credit)"}
                </button>
              </div>
            </div>

            {(bestOverall.length > 0 || easiestWins.length > 0 || missingAngles.length > 0) && (
              <div className="rounded-2xl border border-red-500/20 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-red-400" />
                  <h2 className="text-base font-semibold">
                    Best opportunities
                  </h2>
                </div>

                {bestOverall.length > 0 && (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white/80">
                        Best Overall
                      </h3>
                      <button
                        onClick={() => copyRankedKeywords(bestOverall)}
                        className="text-xs font-medium text-red-300 hover:text-red-200"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="space-y-2">
                      {bestOverall.slice(0, 5).map((item, i) => (
                        <div
                          key={`${item.keyword}-best-${i}`}
                          className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2"
                        >
                          <p className="text-sm font-medium">{item.keyword}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {labelForIntent(item.intent)} • Volume {item.search_volume} • Score{" "}
                            {item.score}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/tools/titles"
                        onClick={() =>
                          saveToolFlow({
                            keyword: bestOverall[0]?.keyword ?? keyword,
                            secondaryKeywords: bestOverall
                              .slice(0, 5)
                              .map((item) => item.keyword),
                          })
                        }
                        className="rounded-xl bg-[#ff0033] px-4 py-2 text-sm font-medium text-white hover:bg-[#e0002d]"
                      >
                        Use in Titles
                      </Link>

                      <Link
                        href="/tools/descriptions"
                        onClick={() =>
                          saveToolFlow({
                            keyword: bestOverall[0]?.keyword ?? keyword,
                            secondaryKeywords: bestOverall
                              .slice(0, 5)
                              .map((item) => item.keyword),
                          })
                        }
                        className="rounded-xl border border-white/10 bg-[#121212] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]"
                      >
                        Use in Description
                      </Link>
                    </div>
                  </div>
                )}

                {easiestWins.length > 0 && (
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white/80">
                        Easiest Wins
                      </h3>
                      <button
                        onClick={() => copyRankedKeywords(easiestWins)}
                        className="text-xs font-medium text-red-300 hover:text-red-200"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="space-y-2">
                      {easiestWins.slice(0, 5).map((item, i) => (
                        <div
                          key={`${item.keyword}-easy-${i}`}
                          className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2"
                        >
                          <p className="text-sm font-medium">{item.keyword}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {labelForIntent(item.intent)} • Competition{" "}
                            {item.competition_level} • Volume {item.search_volume}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {missingAngles.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-red-400" />
                      <h3 className="text-sm font-medium text-white/80">
                        Missing Angles
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {missingAngles.map((item, i) => (
                        <div
                          key={`${item}-${i}`}
                          className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2"
                        >
                          <p className="text-sm text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {buckets.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Generated Intent Map</h2>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {buckets.map((bucket, i) => (
                    <div
                      key={`${bucket.intent}-${i}`}
                      className="rounded-2xl border border-white/10 bg-[#121212] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {labelForIntent(bucket.intent)}
                          </p>
                          <p className="mt-1 text-xs text-white/45">
                            {bucket.user_goal}
                          </p>
                        </div>

                        <button
                          onClick={() => copyKeywords(bucket.keywords)}
                          className="shrink-0 text-red-300 hover:text-red-200"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <div className="mb-3 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-red-300">
                          Video Angle
                        </p>
                        <p className="mt-1 text-sm text-white/85">
                          {bucket.video_angle}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {bucket.keywords.map((item, index) => (
                          <span
                            key={`${item}-${index}`}
                            className="rounded-full border border-white/10 bg-[#1a1a1a] px-3 py-1.5 text-xs text-white/80"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rankedBuckets.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-red-400" />
                  <h2 className="text-lg font-semibold">Validated Intent Buckets</h2>
                </div>

                <div className="space-y-4">
                  {rankedBuckets.map((bucket, i) => (
                    <div
                      key={`${bucket.intent}-ranked-${i}`}
                      className="rounded-2xl border border-white/10 bg-[#121212] p-4"
                    >
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-white">
                          {labelForIntent(bucket.intent)}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {bucket.user_goal}
                        </p>
                      </div>

                      <div className="mb-4 rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.14em] text-red-300">
                          Video Angle
                        </p>
                        <p className="mt-1 text-sm text-white/85">
                          {bucket.video_angle}
                        </p>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        {bucket.keywords.map((item, index) => (
                          <div
                            key={`${item.keyword}-${index}`}
                            className="rounded-xl border border-white/10 bg-[#181818] p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {item.keyword}
                                </p>
                                <p className="mt-1 text-xs text-white/45">
                                  Volume {item.search_volume} • Competition{" "}
                                  {item.competition_level} • Score {item.score}
                                </p>
                              </div>

                              <button
                                onClick={() => copy(item.keyword)}
                                className="shrink-0 text-red-300 hover:text-red-200"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}