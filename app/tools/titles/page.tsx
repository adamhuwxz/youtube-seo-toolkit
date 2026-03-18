"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Copy, CheckCircle, Type, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { readToolFlow, saveToolFlow } from "@/lib/tool-flow";

type RankedTitle = {
  title: string;
  keyword: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  seo_score: number;
  quality_score: number;
  score: number;
};

type GenerateResponse = {
  titles?: string[];
  error?: string;
};

type ValidateResponse = {
  rankedTitles?: RankedTitle[];
  bestTitle?: RankedTitle | null;
  top3?: RankedTitle[];
  creditsRemaining?: number;
  error?: string;
};

export default function TitleToolPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [validated, setValidated] = useState<RankedTitle[]>([]);
  const [top3, setTop3] = useState<RankedTitle[]>([]);

  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingValidate, setLoadingValidate] = useState(false);

  useEffect(() => {
    const flow = readToolFlow();

    if (flow.keyword) {
      setKeyword(flow.keyword);
    }
  }, []);

  async function generateTitles() {
    if (!keyword.trim()) {
      alert("Please enter your top keyword.");
      return;
    }

    try {
      setLoadingGenerate(true);

      const res = await fetch("/api/tools/titles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!res.ok) {
        alert(data.error || "Generation failed.");
        return;
      }

      setTitles(Array.isArray(data.titles) ? data.titles : []);
      setValidated([]);
      setTop3([]);
    } catch (error) {
      console.error("generateTitles error:", error);
      alert("Something went wrong generating titles.");
    } finally {
      setLoadingGenerate(false);
    }
  }

  async function validateTitles() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (titles.length === 0) {
      alert("Generate titles first.");
      return;
    }

    try {
      setLoadingValidate(true);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/titles/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          titles,
        }),
      });

      const data = (await res.json()) as ValidateResponse;

      if (!res.ok) {
        alert(data.error || "Validation failed.");
        return;
      }

      setValidated(Array.isArray(data.rankedTitles) ? data.rankedTitles : []);
      setTop3(Array.isArray(data.top3) ? data.top3 : []);

      if (data.bestTitle?.keyword) {
        saveToolFlow({
          keyword: data.bestTitle.keyword,
        });
      }
    } catch (error) {
      console.error("validateTitles error:", error);
      alert("Validation failed.");
    } finally {
      setLoadingValidate(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  function copyAllTitles(list: string[]) {
    void navigator.clipboard.writeText(list.join("\n"));
  }

  function copyRankedTitles(list: RankedTitle[]) {
    void navigator.clipboard.writeText(list.map((item) => item.title).join("\n"));
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            <Type className="h-3.5 w-3.5" />
            Title Tool
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            YouTube Title Generator
          </h1>

          <p className="max-w-3xl text-sm text-white/60 md:text-base">
            Enter your top keyword and generate stronger YouTube title ideas,
            then validate them with real keyword data to identify the best title.
          </p>

          <p className="text-sm text-red-300/80">
            Tip: Use the Tag Tool first to find your strongest ranking keyword,
            then paste it here.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Type className="h-4 w-4 text-red-400" />
                <h2 className="text-base font-semibold">
                  Generate from one keyword
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Enter your top keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500/50"
                />

                <button
                  onClick={generateTitles}
                  disabled={loadingGenerate}
                  className="w-full rounded-xl bg-[#ff0033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
                >
                  {loadingGenerate ? "Generating..." : "Generate Titles"}
                </button>

                <button
                  onClick={validateTitles}
                  disabled={loadingValidate || titles.length === 0}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loadingValidate ? "Validating..." : "Validate Titles (1 Credit)"}
                </button>
              </div>
            </div>

            {top3.length > 0 && (
              <div className="rounded-2xl border border-red-500/20 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-red-400" />
                  <h2 className="text-base font-semibold">Recommended Top 3</h2>
                </div>

                <div className="mb-3 flex justify-end">
                  <button
                    onClick={() => copyRankedTitles(top3)}
                    className="text-xs font-medium text-red-300 hover:text-red-200"
                  >
                    Copy Top 3
                  </button>
                </div>

                <div className="space-y-3">
                  {top3.map((item, i) => (
                    <div
                      key={`${item.title}-${i}`}
                      className="rounded-xl border border-red-500/15 bg-red-500/5 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {item.keyword} • SEO {item.seo_score} • Quality{" "}
                            {item.quality_score} • Total {item.score}
                          </p>
                        </div>

                        {i === 0 && (
                          <CheckCircle
                            className="mt-0.5 shrink-0 text-red-400"
                            size={18}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Link
                    href="/tools/descriptions"
                    onClick={() =>
                      saveToolFlow({
                        keyword: top3[0]?.keyword ?? keyword,
                      })
                    }
                    className="inline-flex rounded-xl bg-[#ff0033] px-4 py-2 text-sm font-medium text-white hover:bg-[#e0002d]"
                  >
                    Use Keyword in Description
                  </Link>
                </div>
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {titles.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Generated Titles</h2>

                  <button
                    onClick={() => copyAllTitles(titles)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy All
                  </button>
                </div>

                <div className="grid gap-3">
                  {titles.map((title, i) => (
                    <div
                      key={`${title}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#121212] px-4 py-3"
                    >
                      <p className="pr-3 text-sm text-white/90">{title}</p>

                      <button
                        onClick={() => copy(title)}
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
                  <h2 className="text-lg font-semibold">All Ranked Titles</h2>

                  <button
                    onClick={() => copyRankedTitles(validated)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy All Ranked
                  </button>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {validated.map((item, i) => (
                    <div
                      key={`${item.title}-${i}`}
                      className="flex items-start justify-between rounded-xl border border-white/10 bg-[#121212] p-4"
                    >
                      <div className="pr-3">
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-white/45">
                          Keyword: {item.keyword} • Volume: {item.search_volume} •
                          Competition: {item.competition_level}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          SEO: {item.seo_score} • Quality: {item.quality_score} •
                          Total: {item.score}
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