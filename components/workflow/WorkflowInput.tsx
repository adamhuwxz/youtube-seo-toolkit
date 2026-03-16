"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export type WorkflowInputPayload = {
  videoIdea: string;
  seedKeyword1: string;
  seedKeyword2: string;
  niche: string;
  audience: string;
};

export default function WorkflowInput({
  onSubmit,
}: {
  onSubmit: (payload: WorkflowInputPayload) => void;
}) {
  const [videoIdea, setVideoIdea] = useState("");
  const [seedKeyword1, setSeedKeyword1] = useState("");
  const [seedKeyword2, setSeedKeyword2] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!videoIdea.trim() || !seedKeyword1.trim() || !seedKeyword2.trim()) {
      return;
    }

    onSubmit({
      videoIdea: videoIdea.trim(),
      seedKeyword1: seedKeyword1.trim(),
      seedKeyword2: seedKeyword2.trim(),
      niche: niche.trim(),
      audience: audience.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
    >
      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-medium text-white/75">
            Video idea
          </label>
          <textarea
            placeholder="Example: Best beginner tips for starting a Roblox survival base"
            value={videoIdea}
            onChange={(e) => setVideoIdea(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
          />
          <p className="mt-2 text-xs text-white/45">
            Keep this short and specific. This is the main source of truth for the SEO package.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white/75">
              Seed keyword 1
            </label>
            <input
              type="text"
              placeholder="Example: roblox survival"
              value={seedKeyword1}
              onChange={(e) => setSeedKeyword1(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/75">
              Seed keyword 2
            </label>
            <input
              type="text"
              placeholder="Example: build to survive"
              value={seedKeyword2}
              onChange={(e) => setSeedKeyword2(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-white/75">
              Niche <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Example: Roblox gaming"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/75">
              Target audience <span className="text-white/40">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Example: beginner Roblox players"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
          This workflow uses <span className="font-medium">AI + keyword data</span> to build
          a complete YouTube SEO package from your idea. The final titles, description,
          tags, and script outline are generated from the best validated keywords.
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300"
          >
            Generate SEO Package
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
}