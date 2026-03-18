"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Copy, CheckCircle, Search, Tags, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { readToolFlow, saveToolFlow } from "@/lib/tool-flow";

type RankedTag = {
  tag: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
  matched_keyword: string | null;
  tag_type: "core" | "tutorial" | "longtail" | "outcome" | "variation";
};

type ValidateResponse = {
  rankedTags?: RankedTag[];
  bestTag?: RankedTag | null;
  top5?: RankedTag[];
  top10?: RankedTag[];
  creditsRemaining?: number;
  error?: string;
};

type GenerateResponse = {
  tags?: string[];
  error?: string;
};

export default function TagToolPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [validated, setValidated] = useState<RankedTag[]>([]);
  const [top5, setTop5] = useState<RankedTag[]>([]);
  const [top10, setTop10] = useState<RankedTag[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);

  useEffect(() => {
    const flow = readToolFlow();

    if (flow.keyword) {
      setKeyword(flow.keyword);
    }
  }, []);

  async function generateTags() {
    if (!keyword.trim()) {
      alert("Please enter a keyword.");
      return;
    }

    try {
      setLoadingGenerate(true);

      const res = await fetch("/api/tools/tags", {
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

      setTags(Array.isArray(data.tags) ? data.tags : []);
      setValidated([]);
      setTop5([]);
      setTop10([]);
    } catch (error) {
      console.error("generateTags error:", error);
      alert("Something went wrong generating tags.");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function validateTags() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (tags.length === 0) {
      alert("Generate tags first.");
      return;
    }

    try {
      setLoadingValidate(true);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/tags/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          tags,
        }),
      });

      const data = (await res.json()) as ValidateResponse;

      if (!res.ok) {
        alert(data.error || "Validation failed.");
        return;
      }

      setValidated(Array.isArray(data.rankedTags) ? data.rankedTags : []);
      setTop5(Array.isArray(data.top5) ? data.top5 : []);
      setTop10(Array.isArray(data.top10) ? data.top10 : []);

      if (data.bestTag?.tag) {
        saveToolFlow({
          keyword: data.bestTag.tag,
          secondaryKeywords: Array.isArray(data.top5)
            ? data.top5.map((item) => item.tag)
            : [],
        });
      }
    } catch (error) {
      console.error("validateTags error:", error);
      alert("Validation failed.");
    } finally {
      setLoadingValidate(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  function copyTags(list: string[]) {
    void navigator.clipboard.writeText(list.join(", "));
  }

  function copyRankedTags(list: RankedTag[]) {
    void navigator.clipboard.writeText(list.map((item) => item.tag).join(", "));
  }

  function labelForTagType(type: RankedTag["tag_type"]) {
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
      default:
        return "Tag";
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            <Tags className="h-3.5 w-3.5" />
            Tag Tool
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            YouTube Keyword Stacking Tags
          </h1>

          <p className="max-w-3xl text-sm text-white/60 md:text-base">
            Enter one keyword to generate a stacked tag set, then validate it
            with keyword data to build your strongest SEO tag stack.
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
                  onClick={generateTags}
                  disabled={loadingGenerate}
                  className="w-full rounded-xl bg-[#ff0033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
                >
                  {loadingGenerate ? "Generating..." : "Generate Tags"}
                </button>

                <button
                  onClick={validateTags}
                  disabled={loadingValidate || tags.length === 0}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loadingValidate ? "Validating..." : "Validate Tags (1 Credit)"}
                </button>
              </div>
            </div>

            {(top5.length > 0 || top10.length > 0) && (
              <div className="rounded-2xl border border-red-500/20 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-red-400" />
                  <h2 className="text-base font-semibold">
                    Recommended stacks
                  </h2>
                </div>

                {top5.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white/80">Top 5</h3>
                      <button
                        onClick={() => copyRankedTags(top5)}
                        className="text-xs font-medium text-red-300 hover:text-red-200"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="space-y-2">
                      {top5.map((item, i) => (
                        <div
                          key={`${item.tag}-top5-${i}`}
                          className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2"
                        >
                          <p className="text-sm font-medium">{item.tag}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {labelForTagType(item.tag_type)} • Score {item.score}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/tools/titles"
                        onClick={() =>
                          saveToolFlow({
                            keyword: top5[0]?.tag ?? keyword,
                            secondaryKeywords: top5.map((item) => item.tag),
                          })
                        }
                        className="rounded-xl bg-[#ff0033] px-4 py-2 text-sm font-medium text-white hover:bg-[#e0002d]"
                      >
                        Use Top Keyword in Titles
                      </Link>

                      <Link
                        href="/tools/descriptions"
                        onClick={() =>
                          saveToolFlow({
                            keyword: top5[0]?.tag ?? keyword,
                            secondaryKeywords: top5.map((item) => item.tag),
                          })
                        }
                        className="rounded-xl border border-white/10 bg-[#121212] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]"
                      >
                        Use in Description
                      </Link>
                    </div>
                  </div>
                )}

                {top10.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white/80">
                        Top 10
                      </h3>
                      <button
                        onClick={() => copyRankedTags(top10)}
                        className="text-xs font-medium text-red-300 hover:text-red-200"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      {top10.map((item, i) => (
                        <div
                          key={`${item.tag}-top10-${i}`}
                          className="rounded-xl border border-white/10 bg-[#121212] px-3 py-2"
                        >
                          <p className="text-sm font-medium">{item.tag}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {labelForTagType(item.tag_type)} • Score {item.score}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {tags.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Generated Tags</h2>

                  <button
                    onClick={() => copyTags(tags)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy All
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                  {tags.map((tag, i) => (
                    <div
                      key={`${tag}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121212] px-4 py-3"
                    >
                      <p className="pr-3 text-sm text-white/90">{tag}</p>

                      <button
                        onClick={() => copy(tag)}
                        className="shrink-0 text-red-300 hover:text-red-200"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validated.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">All Ranked Tags</h2>

                  <button
                    onClick={() => copyRankedTags(validated)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy All Ranked
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {validated.map((item, i) => (
                    <div
                      key={`${item.tag}-${i}`}
                      className="flex items-start justify-between rounded-xl border border-white/10 bg-[#121212] p-4"
                    >
                      <div className="pr-3">
                        <p className="font-medium text-white">{item.tag}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {labelForTagType(item.tag_type)} • Volume:{" "}
                          {item.search_volume} • Competition:{" "}
                          {item.competition_level} • Score: {item.score}
                        </p>
                      </div>

                      {i === 0 && (
                        <CheckCircle
                          className="mt-0.5 shrink-0 text-red-400"
                          size={18}
                        />
                      )}
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