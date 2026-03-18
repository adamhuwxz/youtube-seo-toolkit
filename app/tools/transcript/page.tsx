"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Copy, FileText, Sparkles, Youtube } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

type TranscriptResponse = {
  transcript?: string;
  language?: string;
  availableLanguages?: string[];
  wordCount?: number;
  estimatedMinutes?: number;
  error?: string;
};

type RewriteResponse = {
  script?: string;
  creditsRemaining?: number;
  error?: string;
};

export default function TranscriptToolPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [rewrittenScript, setRewrittenScript] = useState("");
  const [language, setLanguage] = useState("");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);

  async function getTranscript() {
    if (!videoUrl.trim()) {
      alert("Please enter a YouTube URL.");
      return;
    }

    try {
      setLoadingTranscript(true);
      setRewrittenScript("");

      const res = await fetch("/api/tools/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
        }),
      });

      const data = (await res.json()) as TranscriptResponse;

      if (!res.ok) {
        alert(data.error || "Failed to fetch transcript.");
        return;
      }

      setTranscript(typeof data.transcript === "string" ? data.transcript : "");
      setLanguage(typeof data.language === "string" ? data.language : "");
      setWordCount(typeof data.wordCount === "number" ? data.wordCount : null);
      setEstimatedMinutes(
        typeof data.estimatedMinutes === "number" ? data.estimatedMinutes : null
      );
    } catch (error) {
      console.error("getTranscript error:", error);
      alert("Something went wrong fetching the transcript.");
    } finally {
      setLoadingTranscript(false);
    }
  }

  async function rewriteTranscript() {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!transcript.trim()) {
      alert("Get a transcript first.");
      return;
    }

    try {
      setLoadingRewrite(true);

      const idToken = await user.getIdToken();

      const res = await fetch("/api/tools/transcript/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          transcript,
        }),
      });

      const data = (await res.json()) as RewriteResponse;

      if (!res.ok) {
        alert(data.error || "Rewrite failed.");
        return;
      }

      setRewrittenScript(typeof data.script === "string" ? data.script : "");
    } catch (error) {
      console.error("rewriteTranscript error:", error);
      alert("Something went wrong rewriting the transcript.");
    } finally {
      setLoadingRewrite(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-red-300">
            <Youtube className="h-3.5 w-3.5" />
            Transcript to Script
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Turn a YouTube transcript into a 2–3 minute script
          </h1>

          <p className="max-w-3xl text-sm text-white/60 md:text-base">
            Paste a YouTube video URL to fetch the transcript, then rewrite it
            into a shorter, cleaner script ready to record.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-400" />
                <h2 className="text-base font-semibold">Paste YouTube URL</h2>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-500/50"
                />

                <button
                  onClick={getTranscript}
                  disabled={loadingTranscript}
                  className="w-full rounded-xl bg-[#ff0033] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e0002d] disabled:opacity-60"
                >
                  {loadingTranscript ? "Getting Transcript..." : "Get Transcript"}
                </button>

                <button
                  onClick={rewriteTranscript}
                  disabled={loadingRewrite || !transcript.trim()}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loadingRewrite
                    ? "Rewriting..."
                    : "Rewrite to 2–3 Minute Script (1 Credit)"}
                </button>
              </div>
            </div>

            {(wordCount !== null || estimatedMinutes !== null || language) && (
              <div className="rounded-2xl border border-red-500/20 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-red-400" />
                  <h2 className="text-base font-semibold">Transcript Details</h2>
                </div>

                <div className="space-y-2 text-sm text-white/75">
                  {language ? (
                    <p>
                      <span className="text-white/45">Language:</span> {language}
                    </p>
                  ) : null}

                  {wordCount !== null ? (
                    <p>
                      <span className="text-white/45">Words:</span> {wordCount}
                    </p>
                  ) : null}

                  {estimatedMinutes !== null ? (
                    <p>
                      <span className="text-white/45">Estimated length:</span>{" "}
                      {estimatedMinutes} min
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {transcript && (
              <div className="rounded-2xl border border-white/10 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Transcript</h2>

                  <button
                    onClick={() => copy(transcript)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>

                <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-white/10 bg-[#121212] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/85">
                    {transcript}
                  </p>
                </div>
              </div>
            )}

            {rewrittenScript && (
              <div className="rounded-2xl border border-red-500/20 bg-[#1f1f1f] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">2–3 Minute Script</h2>

                  <button
                    onClick={() => copy(rewrittenScript)}
                    className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>

                <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/90">
                    {rewrittenScript}
                  </p>
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