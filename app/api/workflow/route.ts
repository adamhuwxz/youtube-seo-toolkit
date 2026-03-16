import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getKeywordSuggestions } from "@/lib/dataforseo";
import { expandKeywordPool } from "@/lib/keywordExpansion";
import { clusterKeywords } from "@/lib/keywordCluster";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type CandidateKeyword = {
  keyword: string;
  intent_type: string;
  relevance_score: number;
  specificity_score: number;
  reason: string;
};

type KeywordMetric = {
  keyword: string;
  search_volume: number;
  competition: number;
  competition_level: string;
};

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

type FinalGenerationResponse = {
  titles: string[];
  description: string;
  finalTags: string[];
  scriptOutline: string;
};

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampTen(value: number) {
  return Math.max(0, Math.min(10, value));
}

function getIntentMatchScore(intentType: string) {
  const value = intentType.toLowerCase();

  if (value.includes("how to")) return 9;
  if (value.includes("tutorial")) return 9;
  if (value.includes("guide")) return 8;
  if (value.includes("tips")) return 8;
  if (value.includes("strategy")) return 8;
  if (value.includes("beginner")) return 8;
  if (value.includes("best")) return 7;

  return 6;
}

function scoreTag(tag: string, approvedKeywords: ApprovedKeyword[]): RankedTag {
  const lowerTag = tag.toLowerCase();

  const matched =
    approvedKeywords.find((k) => lowerTag.includes(k.keyword.toLowerCase())) ??
    approvedKeywords[0];

  return {
    text: tag,
    basedOnKeyword: matched?.keyword ?? "General relevance",
    score: matched ? Math.max(1, Math.round(matched.final_score - 0.5)) : 1,
  };
}

function scoreTitle(
  title: string,
  approvedKeywords: ApprovedKeyword[]
): RankedTitle {
  const lowerTitle = title.toLowerCase();

  const matched =
    approvedKeywords.find((k) =>
      lowerTitle.includes(k.keyword.toLowerCase())
    ) ?? approvedKeywords[0];

  let score = matched ? matched.final_score : 1;

  if (matched && lowerTitle.startsWith(matched.keyword.toLowerCase())) {
    score += 1;
  }

  if (title.length >= 40 && title.length <= 70) {
    score += 0.5;
  }

  return {
    text: title,
    basedOnKeyword: matched?.keyword ?? "General relevance",
    score: Math.round(score * 10) / 10,
  };
}

async function getCandidateKeywords(input: {
  videoIdea: string;
  seedKeyword1: string;
  seedKeyword2: string;
  niche: string;
  audience: string;
}): Promise<CandidateKeyword[]> {
  const prompt = `
You are a YouTube SEO keyword strategist.

Your job is to generate candidate long-tail keyword phrases for one specific YouTube video idea.

You are NOT generating final tags yet. You are generating a keyword pool that will later be checked against keyword search data.

Use the user's video idea as the primary source of truth.
Use the seed keywords only as supporting signals.

Return ONLY valid JSON.
Use this exact shape:
{
  "keywords": [
    {
      "keyword": "string",
      "intent_type": "string",
      "relevance_score": 1,
      "specificity_score": 1,
      "reason": "string"
    }
  ]
}

Rules:
- Return exactly 60 candidate keyword phrases.
- Make each phrase sound like a real YouTube search query.
- Prioritize phrases tightly aligned to the video idea.
- Include a mix of beginner, tutorial, guide, strategy, tips, best, fast, easy, how to, mistakes to avoid when relevant.
- Avoid broad phrases unless central to the topic.
- Avoid duplicates or near duplicates.
- Do not force both seed keywords into every phrase.
- Avoid phrases that do not clearly match the video idea.

Video idea: ${input.videoIdea}
Seed keyword 1: ${input.seedKeyword1}
Seed keyword 2: ${input.seedKeyword2}
Niche: ${input.niche || "Not provided"}
Target audience: ${input.audience || "Not provided"}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You generate candidate YouTube keyword pools for SEO validation.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw) as { keywords?: CandidateKeyword[] };

    return Array.isArray(parsed.keywords)
      ? parsed.keywords
          .filter((item) => item && typeof item.keyword === "string")
          .slice(0, 60)
      : [];
  } catch {
    console.error("Failed to parse candidate keyword JSON:", raw);
    return [];
  }
}

function buildApprovedKeywords(
  candidates: CandidateKeyword[],
  metrics: KeywordMetric[]
): ApprovedKeyword[] {
  const metricsMap = new Map<string, KeywordMetric>();

  for (const metric of metrics) {
    metricsMap.set(normalizeKeyword(metric.keyword), metric);
  }

  const matched = candidates.map((candidate) => {
    const normalizedCandidate = normalizeKeyword(candidate.keyword);

    const metric =
      metricsMap.get(normalizedCandidate) ??
      metrics.find(
        (item) =>
          normalizeKeyword(item.keyword) === normalizedCandidate ||
          normalizeKeyword(item.keyword).includes(normalizedCandidate) ||
          normalizedCandidate.includes(normalizeKeyword(item.keyword))
      );

    return {
      candidate,
      metric: metric ?? null,
    };
  });

  const maxSearchVolume = Math.max(
    1,
    ...matched.map((item) => item.metric?.search_volume ?? 0)
  );

  const approved = matched.map(({ candidate, metric }) => {
    const aiRelevanceScore = clampTen(candidate.relevance_score);
    const searchVolume = metric?.search_volume ?? 0;
    const competition = metric?.competition ?? 1;
    const competitionLevel = metric?.competition_level ?? "UNKNOWN";
    const searchVolumeScore = clampTen((searchVolume / maxSearchVolume) * 10);
    const lowCompetitionScore = clampTen((1 - competition) * 10);
    const intentMatchScore = clampTen(getIntentMatchScore(candidate.intent_type));

    const finalScore =
      0.45 * aiRelevanceScore +
      0.3 * searchVolumeScore +
      0.15 * lowCompetitionScore +
      0.1 * intentMatchScore;

    return {
      keyword: candidate.keyword,
      intent_type: candidate.intent_type,
      relevance_score: candidate.relevance_score,
      specificity_score: candidate.specificity_score,
      ai_relevance_score: aiRelevanceScore,
      search_volume: searchVolume,
      competition,
      competition_level: competitionLevel,
      low_competition_score: Math.round(lowCompetitionScore * 10) / 10,
      search_volume_score: Math.round(searchVolumeScore * 10) / 10,
      intent_match_score: Math.round(intentMatchScore * 10) / 10,
      final_score: Math.round(finalScore * 100) / 100,
      role: "tag" as const,
      reason: candidate.reason,
    };
  });

  const ranked = approved.sort((a, b) => b.final_score - a.final_score);

  return ranked.map((item, index) => ({
    ...item,
    role: index === 0 ? "primary" : index <= 8 ? "secondary" : "tag",
  }));
}

async function generateFinalSeoPackage(input: {
  videoIdea: string;
  audience: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  finalTags: string[];
  keywordClusters: {
    primary: string[];
    beginner: string[];
    tips: string[];
    mistakes: string[];
    comparison: string[];
    general: string[];
  };
}): Promise<FinalGenerationResponse | null> {
  const prompt = `
You are a YouTube SEO content optimizer.

Create a complete SEO package for one YouTube video using the approved keyword set below.

Use the highest scoring keyword as the primary keyword.
Use the remaining approved keywords naturally as secondary support.

Return ONLY valid JSON.
Use this exact shape:
{
  "titles": ["string", "string", "string"],
  "description": "string",
  "finalTags": ["string"],
  "scriptOutline": "string"
}

Rules:
- Titles must be clickable but natural.
- The description must read naturally, not like a keyword dump.
- Tags must be highly relevant to the exact video topic.
- The script outline must match the topic promised in the title.
- Do not include any keyword unless it exists in the approved keyword list or is a very close variation.
- Avoid keyword stuffing.
- Prioritize relevance and viewer search intent over raw volume.
- Use the keyword clusters to make the package feel well-structured and search-intent aware.
- Return exactly 3 title options.
- Return 30 final tags.

Video idea: ${input.videoIdea}
Primary keyword: ${input.primaryKeyword}
Approved secondary keywords: ${JSON.stringify(input.secondaryKeywords)}
Final tag keywords: ${JSON.stringify(input.finalTags)}
Target audience: ${input.audience || "Not provided"}

Keyword clusters:
Primary cluster: ${JSON.stringify(input.keywordClusters.primary)}
Beginner cluster: ${JSON.stringify(input.keywordClusters.beginner)}
Tips cluster: ${JSON.stringify(input.keywordClusters.tips)}
Mistakes cluster: ${JSON.stringify(input.keywordClusters.mistakes)}
Comparison cluster: ${JSON.stringify(input.keywordClusters.comparison)}
General cluster: ${JSON.stringify(input.keywordClusters.general)}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "You generate final YouTube SEO packages from approved keyword sets only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(raw) as FinalGenerationResponse;
  } catch {
    console.error("Failed to parse final SEO package JSON:", raw);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const videoIdea =
      typeof body.videoIdea === "string" ? body.videoIdea.trim() : "";
    const seedKeyword1 =
      typeof body.seedKeyword1 === "string" ? body.seedKeyword1.trim() : "";
    const seedKeyword2 =
      typeof body.seedKeyword2 === "string" ? body.seedKeyword2.trim() : "";
    const niche = typeof body.niche === "string" ? body.niche.trim() : "";
    const audience =
      typeof body.audience === "string" ? body.audience.trim() : "";

    if (!videoIdea || !seedKeyword1 || !seedKeyword2) {
      return NextResponse.json(
        { error: "Video idea and both seed keywords are required." },
        { status: 400 }
      );
    }

    const candidateKeywords = await getCandidateKeywords({
      videoIdea,
      seedKeyword1,
      seedKeyword2,
      niche,
      audience,
    });

    if (candidateKeywords.length === 0) {
      return NextResponse.json(
        { error: "Could not generate candidate keywords." },
        { status: 500 }
      );
    }

    const autocompleteKeywords = await expandKeywordPool(
      candidateKeywords.map((item) => item.keyword)
    );

    const keywordLookupSeeds = Array.from(
      new Set([
        seedKeyword1,
        seedKeyword2,
        ...candidateKeywords.map((item) => item.keyword),
        ...autocompleteKeywords,
      ])
    ).slice(0, 80);

    let keywordMetrics: KeywordMetric[] = [];

    try {
      keywordMetrics = await getKeywordSuggestions(keywordLookupSeeds);
    } catch (error) {
      console.error("Keyword data lookup error:", error);
    }

    const approvedKeywords = buildApprovedKeywords(
      candidateKeywords,
      keywordMetrics
    );

    const keywordClusters = clusterKeywords(
      approvedKeywords.slice(0, 40).map((item) => item.keyword)
    );

    const primaryKeyword = approvedKeywords[0]?.keyword ?? "";
    const secondaryKeywords = approvedKeywords
      .filter((item) => item.role === "secondary")
      .slice(0, 8)
      .map((item) => item.keyword);

    const finalTagKeywords = approvedKeywords
      .slice(0, 30)
      .map((item) => item.keyword);

    const finalPackage = await generateFinalSeoPackage({
      videoIdea,
      audience,
      primaryKeyword,
      secondaryKeywords,
      finalTags: finalTagKeywords,
      keywordClusters,
    });

    if (!finalPackage) {
      return NextResponse.json(
        { error: "Could not generate final SEO package." },
        { status: 500 }
      );
    }

    const rankedTags = finalPackage.finalTags.map((tag) =>
      scoreTag(tag, approvedKeywords)
    );

    const rankedTitles = finalPackage.titles.map((title) =>
      scoreTitle(title, approvedKeywords)
    );

    return NextResponse.json({
      videoIdea,
      primaryKeyword,
      approvedKeywords: approvedKeywords.slice(0, 20),
      secondaryKeywords,
      finalTags: rankedTags,
      titles: rankedTitles,
      description: finalPackage.description,
      scriptOutline: finalPackage.scriptOutline,
      debug: {
        candidateKeywordCount: candidateKeywords.length,
        autocompleteKeywordCount: autocompleteKeywords.length,
        keywordLookupSeedCount: keywordLookupSeeds.length,
        approvedKeywordCount: approvedKeywords.length,
        primaryKeyword,
        clusters: keywordClusters,
      },
    });
  } catch (error) {
    console.error("Workflow failed:", error);

    return NextResponse.json(
      { error: "Workflow failed" },
      { status: 500 }
    );
  }
}