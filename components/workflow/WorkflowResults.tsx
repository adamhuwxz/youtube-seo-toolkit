"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";

const tabs = [
  "Top Picks",
  "Titles",
  "Description",
  "Tags",
  "Script Outline",
  "Keyword Insights",
] as const;

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

type WorkflowResultsProps = {
  videoIdea: string;
  primaryKeyword: string;
  approvedKeywords: ApprovedKeyword[];
  secondaryKeywords: string[];
  finalTags: RankedTag[];
  titles: RankedTitle[];
  description: string;
  scriptOutline: string;
};

type CopyButtonProps = {
  text: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  label?: string;
  small?: boolean;
};

function CopyButton({
  text,
  copyKey,
  copied,
  onCopy,
  label = "Copy",
  small = false,
}: CopyButtonProps) {
  const isCopied = copied === copyKey;

  return (
    <button
      onClick={() => onCopy(text, copyKey)}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 font-medium text-white/80 transition hover:bg-white/10 ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {isCopied ? "Copied" : label}
    </button>
  );
}

export default function WorkflowResults({
  videoIdea,
  primaryKeyword,
  approvedKeywords,
  secondaryKeywords,
  finalTags,
  titles,
  description,
  scriptOutline,
}: WorkflowResultsProps) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Top Picks");
  const [copied, setCopied] = useState<string | null>(null);

  const bestTitle = useMemo(() => {
    return [...titles].sort((a, b) => b.score - a.score)[0] ?? null;
  }, [titles]);

  const bestTagsText = useMemo(() => {
    return finalTags.map((tag) => tag.text).join(", ");
  }, [finalTags]);

  const topKeywordInsights = useMemo(() => {
    return approvedKeywords.slice(0, 8);
  }, [approvedKeywords]);

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  }

  function renderContent() {
    switch (active) {
      case "Top Picks":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Quick Results
              </div>

              <p className="text-sm leading-7 text-cyan-100/85">
                Here are the main outputs most users actually need. Copy what you
                want and move on.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                Video idea
              </p>
              <p className="mt-2 text-white">{videoIdea}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                    Best Title
                  </p>
                  <p className="mt-2 text-white">
                    {bestTitle?.text || "No title generated"}
                  </p>
                </div>

                {bestTitle && (
                  <CopyButton
                    text={bestTitle.text}
                    copyKey="best-title"
                    copied={copied}
                    onCopy={copyToClipboard}
                    label="Copy"
                    small
                  />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                    Description
                  </p>
                  <p className="mt-2 line-clamp-6 text-white/80">{description}</p>
                </div>

                <CopyButton
                  text={description}
                  copyKey="best-description"
                  copied={copied}
                  onCopy={copyToClipboard}
                  label="Copy"
                  small
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                    Tags
                  </p>
                  <p className="mt-2 line-clamp-6 text-white/80">{bestTagsText}</p>
                </div>

                <CopyButton
                  text={bestTagsText}
                  copyKey="best-tags"
                  copied={copied}
                  onCopy={copyToClipboard}
                  label="Copy"
                  small
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                    Script Outline
                  </p>
                  <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-white/80">
                    {scriptOutline}
                  </p>
                </div>

                <CopyButton
                  text={scriptOutline}
                  copyKey="best-script-outline"
                  copied={copied}
                  onCopy={copyToClipboard}
                  label="Copy"
                  small
                />
              </div>
            </div>
          </div>
        );

      case "Titles":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <CopyButton
                text={titles.map((title) => title.text).join("\n")}
                copyKey="titles"
                copied={copied}
                onCopy={copyToClipboard}
                label="Copy All Titles"
              />
            </div>

            {titles.map((title, index) => (
              <div
                key={`${title.text}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-white">{title.text}</p>
                    <p className="mt-2 text-sm text-white/50">
                      Based on: {title.basedOnKeyword}
                    </p>
                  </div>

                  <CopyButton
                    text={title.text}
                    copyKey={`title-${index}`}
                    copied={copied}
                    onCopy={copyToClipboard}
                    label="Copy"
                    small
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case "Description":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <CopyButton
                text={description}
                copyKey="description"
                copied={copied}
                onCopy={copyToClipboard}
                label="Copy Description"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <pre className="whitespace-pre-wrap text-white/80">
                {description}
              </pre>
            </div>
          </div>
        );

      case "Tags":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <CopyButton
                text={finalTags.map((tag) => tag.text).join(", ")}
                copyKey="tags"
                copied={copied}
                onCopy={copyToClipboard}
                label="Copy Tags"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="whitespace-pre-wrap text-white/80">{bestTagsText}</p>
            </div>
          </div>
        );

      case "Script Outline":
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <CopyButton
                text={scriptOutline}
                copyKey="script-outline"
                copied={copied}
                onCopy={copyToClipboard}
                label="Copy Script Outline"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <pre className="whitespace-pre-wrap text-white/80">
                {scriptOutline}
              </pre>
            </div>
          </div>
        );

      case "Keyword Insights":
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <p className="font-semibold">Keyword insights</p>
              <p className="mt-2 leading-6 text-cyan-100/85">
                This is the advanced view. Most users won’t need this, but it’s
                here if you want to understand which keywords led to the results.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                Primary Keyword
              </p>
              <p className="mt-2 text-white">{primaryKeyword}</p>
            </div>

            {secondaryKeywords.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-white/40">
                  Secondary Keywords
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {secondaryKeywords.map((keyword, index) => (
                    <span
                      key={`${keyword}-${index}`}
                      className="rounded-full bg-cyan-400/15 px-3 py-2 text-sm text-cyan-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topKeywordInsights.map((item, index) => (
              <div
                key={`${item.keyword}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">
                        {item.keyword}
                      </h3>
                      <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                        {item.role}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-white/50">
                      {item.intent_type}
                    </p>
                  </div>

                  <div className="inline-flex rounded-full bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-200">
                    Score: {item.final_score}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Avg Monthly Searches
                    </p>
                    <p className="mt-2 text-lg font-medium text-white">
                      {item.search_volume.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Competition
                    </p>
                    <p className="mt-2 text-lg font-medium text-white">
                      {item.competition}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                      Competition Level
                    </p>
                    <p className="mt-2 text-lg font-medium text-white">
                      {item.competition_level}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          Simple Output
        </div>

        <p className="text-sm leading-7 text-cyan-100/85">
          The goal is speed. Use the main results first, and only open keyword
          insights if you want the deeper data.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-xl px-4 py-2 text-sm transition ${
              active === tab
                ? "bg-cyan-400 text-black"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">{renderContent()}</div>
    </div>
  );
}