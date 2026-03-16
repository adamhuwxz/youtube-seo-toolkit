"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WorkflowInput, {
  type WorkflowInputPayload,
} from "@/components/workflow/WorkflowInput";
import WorkflowProgress from "@/components/workflow/WorkflowProgress";
import WorkflowResults from "@/components/workflow/WorkflowResults";
import { useAuth } from "@/components/providers/AuthProvider";

type ApprovedKeyword = {
  keyword: string;
  intent_type: string;
  relevance_score: number;
  specificity_score: number;
  ai_relevance_score: number;
  search_volume: number;
  competition: number;
  competition_level: string;
  low_competition_score: number;
  search_volume_score: number;
  intent_match_score: number;
  final_score: number;
  role: "primary" | "secondary" | "tag";
  reason: string;
};

type RankedTag = {
  text: string;
  basedOnKeyword: string;
  score: number;
};

type RankedTitle = {
  text: string;
  basedOnKeyword: string;
  score: number;
};

type WorkflowData = {
  videoIdea: string;
  primaryKeyword: string;
  approvedKeywords: ApprovedKeyword[];
  secondaryKeywords: string[];
  finalTags: RankedTag[];
  titles: RankedTitle[];
  description: string;
  scriptOutline: string;
  debug?: {
    candidateKeywordCount: number;
    autocompleteKeywordCount?: number;
    keywordLookupSeedCount?: number;
    approvedKeywordCount: number;
    primaryKeyword: string;
    clusters?: {
      primary: string[];
      beginner: string[];
      tips: string[];
      mistakes: string[];
      comparison: string[];
      general: string[];
    };
  };
};

export default function WorkflowPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<WorkflowData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(payload: WorkflowInputPayload) {
    if (!user) {
      router.push("/login");
      return;
    }

    setStarted(true);
    setProgress(15);
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setProgress(70);

      const result = (await res.json()) as WorkflowData | { error?: string };

      if (!res.ok) {
        setError(
          "error" in result && result.error
            ? result.error
            : "Something went wrong."
        );
        setProgress(0);
        return;
      }

      setData(result as WorkflowData);
      setProgress(100);
    } catch {
      setError("Something went wrong while generating results.");
      setProgress(0);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <Navbar />
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-white/70">
            Checking account...
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#050816] text-white">
        <Navbar />
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 text-white/70">
            Redirecting to login...
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-24">
        <h1 className="text-4xl font-semibold">AI YouTube SEO Workflow</h1>

        <p className="mt-4 text-white/65">
          Enter a video idea and two seed keywords. The system expands a keyword
          pool, checks keyword data, ranks the opportunities, and builds a full SEO
          package.
        </p>

        <div className="mt-8 rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Data-backed workflow
          </p>
          <p className="mt-3 text-sm leading-7 text-cyan-100/85">
            This workflow does <span className="font-medium">not</span> rely on AI
            guessing final keywords blindly. It builds a candidate keyword pool,
            checks keyword data, ranks it, then generates titles, description, tags,
            and a script outline from the approved set.
          </p>
        </div>

        <div className="mt-10">
          <WorkflowInput onSubmit={handleSubmit} />
        </div>

        {started && progress > 0 && progress < 100 && (
          <div className="mt-8">
            <WorkflowProgress progress={progress} />
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-[24px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {data?.debug && (
          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            Candidate keywords: {data.debug.candidateKeywordCount} | Autocomplete:{" "}
            {data.debug.autocompleteKeywordCount ?? 0} | Lookup seeds:{" "}
            {data.debug.keywordLookupSeedCount ?? 0} | Approved:{" "}
            {data.debug.approvedKeywordCount} | Primary keyword:{" "}
            {data.debug.primaryKeyword}
          </div>
        )}

        {data && (
          <div className="mt-8">
            <WorkflowResults
              videoIdea={data.videoIdea}
              primaryKeyword={data.primaryKeyword}
              approvedKeywords={data.approvedKeywords}
              secondaryKeywords={data.secondaryKeywords}
              finalTags={data.finalTags}
              titles={data.titles}
              description={data.description}
              scriptOutline={data.scriptOutline}
            />
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}