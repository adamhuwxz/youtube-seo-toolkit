import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getKeywordMetrics } from "@/lib/dataforseo";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type KeywordRequestBody = {
  topic?: string;
  niche?: string;
};

type KeywordType = "core" | "tutorial" | "longtail" | "outcome" | "variation";

type KeywordResponse = {
  keywords: string[];
};

type RankedKeyword = {
  keyword: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
  matched_keyword: string | null;
  keyword_type: KeywordType;
};

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreKeyword(searchVolume: number, competition: number) {
  const volumeWeight = Math.log10(searchVolume + 1) * 25;
  const competitionPenalty = competition * 35;
  return Math.max(0, Math.round(volumeWeight - competitionPenalty));
}

function classifyKeyword(keyword: string): KeywordType {
  const lower = keyword.toLowerCase();

  if (
    lower.includes("how to") ||
    lower.includes("tutorial") ||
    lower.includes("guide")
  ) {
    return "tutorial";
  }

  if (
    lower.includes("best") ||
    lower.includes("easy") ||
    lower.includes("simple") ||
    lower.includes("for beginners")
  ) {
    return "outcome";
  }

  if (lower.split(" ").length >= 4) {
    return "longtail";
  }

  if (
    lower.includes("survival") ||
    lower.includes("base") ||
    lower.includes("version") ||
    lower.includes("edition")
  ) {
    return "variation";
  }

  return "core";
}

function buildTopStack(ranked: RankedKeyword[], limit: number) {
  const buckets: Record<KeywordType, RankedKeyword[]> = {
    core: [],
    tutorial: [],
    longtail: [],
    outcome: [],
    variation: [],
  };

  for (const keyword of ranked) {
    buckets[keyword.keyword_type].push(keyword);
  }

  const stack: RankedKeyword[] = [];
  const seen = new Set<string>();

  const addFromBucket = (items: RankedKeyword[], count: number) => {
    let added = 0;

    for (const item of items) {
      if (stack.length >= limit) break;
      if (seen.has(item.keyword)) continue;

      stack.push(item);
      seen.add(item.keyword);
      added++;

      if (added >= count) break;
    }
  };

  if (limit >= 5) {
    addFromBucket(buckets.core, 2);
    addFromBucket(buckets.tutorial, 2);
    addFromBucket(buckets.longtail, 2);
    addFromBucket(buckets.outcome, 2);
    addFromBucket(buckets.variation, 2);
  }

  for (const item of ranked) {
    if (stack.length >= limit) break;
    if (seen.has(item.keyword)) continue;

    stack.push(item);
    seen.add(item.keyword);
  }

  return stack.slice(0, limit);
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

    const body = (await req.json()) as KeywordRequestBody;

    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const niche = typeof body.niche === "string" ? body.niche.trim() : "";

    if (!topic) {
      return NextResponse.json(
        { error: "A topic is required." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const prompt = `
You are a YouTube SEO keyword research expert.

A creator gives a broad video topic.
Generate 25 highly relevant keyword ideas they could target on YouTube.

Return ONLY valid JSON.
Use this exact shape:
{
  "keywords": ["string", "string"]
}

Rules:
- Return exactly 25 keywords.
- Keep them tightly relevant to the main topic.
- Include a balanced mix of:
  1. core keywords
  2. close variations
  3. tutorial / how-to intent
  4. beginner intent
  5. long-tail lower-competition opportunities
  6. outcome / result-driven phrases
- Keep them realistic search phrases.
- No hashtags.
- No duplicates.
- No commas inside a single keyword.
- Do not include brand-new dates unless clearly necessary.
- Prioritize discoverability and strong YouTube search intent.

Main topic: ${topic}
Optional niche/context: ${niche || "None provided"}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality YouTube keyword ideas and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: KeywordResponse;

    try {
      parsed = JSON.parse(raw) as KeywordResponse;
    } catch {
      console.error("Failed to parse keyword finder JSON:", raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleanedKeywords = Array.isArray(parsed.keywords)
      ? Array.from(
          new Set(
            parsed.keywords
              .map((keyword) =>
                typeof keyword === "string" ? keyword.trim() : ""
              )
              .filter(Boolean)
          )
        ).slice(0, 25)
      : [];

    if (cleanedKeywords.length === 0) {
      return NextResponse.json(
        { error: "No keywords were generated." },
        { status: 500 }
      );
    }

    const lookupKeywords = Array.from(
      new Set(cleanedKeywords.map((keyword) => normalizeKeyword(keyword)))
    ).filter(Boolean);

    const metrics = await getKeywordMetrics(lookupKeywords);

    const metricsByNormalizedKeyword = new Map<string, (typeof metrics)[number]>(
      metrics.map((metric) => [normalizeKeyword(metric.keyword), metric])
    );

    const rankedKeywords: RankedKeyword[] = cleanedKeywords.map((keyword) => {
      const normalized = normalizeKeyword(keyword);
      const metric = metricsByNormalizedKeyword.get(normalized) ?? null;

      const searchVolume = metric?.search_volume ?? 0;
      const competition = metric?.competition ?? 1;
      const competitionLevel = metric?.competition_level ?? "UNKNOWN";

      return {
        keyword,
        search_volume: searchVolume,
        competition,
        competition_level: competitionLevel,
        score: scoreKeyword(searchVolume, competition),
        matched_keyword: metric?.keyword ?? null,
        keyword_type: classifyKeyword(keyword),
      };
    });

    const ranked = [...rankedKeywords].sort((a, b) => b.score - a.score);
    const top5 = buildTopStack(ranked, 5);
    const top10 = buildTopStack(ranked, 10);

    return NextResponse.json({
      rankedKeywords: ranked,
      bestKeyword: ranked[0] ?? null,
      top5,
      top10,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Keyword finder failed:", error);

    const message =
      error instanceof Error ? error.message : "Keyword finder failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}