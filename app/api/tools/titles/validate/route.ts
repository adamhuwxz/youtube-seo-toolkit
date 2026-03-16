import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getKeywordMetrics } from "@/lib/dataforseo";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ValidateRequest = {
  titles?: string[];
};

type KeywordPair = {
  title: string;
  keyword: string;
};

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

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractKeywordsFromTitles(titles: string[]) {
  const prompt = `
You are a YouTube SEO analyst.

Extract the main search keyword phrase from each title.

Return ONLY valid JSON.
Use this exact shape:
{
  "keywords": [
    { "title": "string", "keyword": "string" }
  ]
}

Rules:
- Return one keyword per title.
- The keyword must already exist in the title.
- Prefer phrases between 2 and 5 words where possible.
- Do not invent keywords not already present in the title.
- Keep the keyword tightly relevant to what someone would search.

Titles:
${JSON.stringify(titles)}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "You extract the main search phrase from YouTube titles and return strict JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw) as {
      keywords?: KeywordPair[];
    };

    return Array.isArray(parsed.keywords)
      ? parsed.keywords.filter(
          (item): item is KeywordPair =>
            typeof item?.title === "string" &&
            typeof item?.keyword === "string" &&
            item.title.trim().length > 0 &&
            item.keyword.trim().length > 0
        )
      : [];
  } catch {
    console.error("Keyword extraction failed:", raw);
    return [];
  }
}

function scoreSeo(searchVolume: number, competition: number) {
  const volumeWeight = Math.log10(searchVolume + 1) * 25;
  const competitionPenalty = competition * 35;
  return Math.max(0, Math.round(volumeWeight - competitionPenalty));
}

function scoreTitleQuality(title: string, keyword: string) {
  let score = 0;

  const cleanTitle = title.trim();
  const lowerTitle = cleanTitle.toLowerCase();
  const lowerKeyword = keyword.toLowerCase().trim();

  const words = cleanTitle.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const length = cleanTitle.length;

  /* -----------------------
     TITLE LENGTH OPTIMIZATION
     ----------------------- */

  if (length >= 45 && length <= 65) {
    score += 22; // ideal YouTube length
  } else if (length >= 35 && length <= 75) {
    score += 14;
  } else {
    score += 6;
  }

  /* -----------------------
     KEYWORD PRESENCE
     ----------------------- */

  if (lowerTitle.includes(lowerKeyword)) {
    score += 18;
  }

  if (lowerTitle.startsWith(lowerKeyword)) {
    score += 12;
  }

  /* -----------------------
     SEARCH INTENT WORDS
     ----------------------- */

  if (
    lowerTitle.includes("how to") ||
    lowerTitle.includes("tutorial") ||
    lowerTitle.includes("guide")
  ) {
    score += 10;
  }

  if (
    lowerTitle.includes("best") ||
    lowerTitle.includes("top") ||
    lowerTitle.includes("tips") ||
    lowerTitle.includes("secrets")
  ) {
    score += 8;
  }

  if (
    lowerTitle.includes("easy") ||
    lowerTitle.includes("simple") ||
    lowerTitle.includes("beginner")
  ) {
    score += 6;
  }

  /* -----------------------
     READABILITY
     ----------------------- */

  if (wordCount >= 6 && wordCount <= 11) {
    score += 8;
  }

  if (wordCount >= 5 && wordCount <= 13) {
    score += 5;
  }

  /* -----------------------
     PUNCTUATION
     ----------------------- */

  const punctuationMatches = cleanTitle.match(/[!?]/g);
  const punctuationCount = punctuationMatches ? punctuationMatches.length : 0;

  if (punctuationCount === 1) {
    score += 5; // good emphasis
  }

  if (punctuationCount > 2) {
    score -= 5; // spammy
  }

  /* -----------------------
     TITLE STYLE PENALTIES
     ----------------------- */

  if (cleanTitle === cleanTitle.toUpperCase()) {
    score -= 8;
  }

  if (lowerTitle.includes("2024") || lowerTitle.includes("2025")) {
    score += 3; // freshness bonus
  }

  return Math.max(0, Math.round(score));
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const body = (await req.json()) as ValidateRequest;

    const titles = Array.isArray(body.titles)
      ? body.titles.filter(
          (title): title is string =>
            typeof title === "string" && title.trim().length > 0
        )
      : [];

    if (titles.length === 0) {
      return NextResponse.json(
        { error: "No titles provided." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const keywordPairs = await extractKeywordsFromTitles(titles);

    if (keywordPairs.length === 0) {
      return NextResponse.json(
        { error: "Could not extract keywords from titles." },
        { status: 500 }
      );
    }

    const exactKeywords = Array.from(
      new Set(
        keywordPairs
          .map((pair) => normalizeKeyword(pair.keyword))
          .filter(Boolean)
      )
    ).slice(0, 20);

    const metrics = await getKeywordMetrics(exactKeywords);

    const metricsByNormalizedKeyword = new Map<string, (typeof metrics)[number]>(
      metrics.map((metric) => [normalizeKeyword(metric.keyword), metric])
    );

    const rankedTitles: RankedTitle[] = keywordPairs.map((pair) => {
      const normalizedKeyword = normalizeKeyword(pair.keyword);
      const metric = metricsByNormalizedKeyword.get(normalizedKeyword) ?? null;

      const searchVolume = metric?.search_volume ?? 0;
      const competition = metric?.competition ?? 1;
      const competitionLevel = metric?.competition_level ?? "UNKNOWN";

      const seoScore = scoreSeo(searchVolume, competition);
      const qualityScore = scoreTitleQuality(pair.title, pair.keyword);
      const totalScore = seoScore + qualityScore;

      return {
        title: pair.title,
        keyword: pair.keyword,
        search_volume: searchVolume,
        competition,
        competition_level: competitionLevel,
        seo_score: seoScore,
        quality_score: qualityScore,
        score: totalScore,
      };
    });

    const ranked = [...rankedTitles].sort((a, b) => b.score - a.score);
    const top3 = ranked.slice(0, 3);

    return NextResponse.json({
      rankedTitles: ranked,
      bestTitle: ranked[0] ?? null,
      top3,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Title validation failed:", error);

    const message =
      error instanceof Error ? error.message : "Title validation failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}