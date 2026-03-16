import { NextResponse } from "next/server";
import { getKeywordMetrics } from "@/lib/dataforseo";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

type ValidateRequest = {
  tags?: string[];
};

type TagType = "core" | "tutorial" | "longtail" | "outcome" | "variation";

type RankedTag = {
  tag: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
  matched_keyword: string | null;
  tag_type: TagType;
};

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreTag(searchVolume: number, competition: number) {
  const volumeWeight = Math.log10(searchVolume + 1) * 25;
  const competitionPenalty = competition * 35;
  return Math.max(0, Math.round(volumeWeight - competitionPenalty));
}

function classifyTag(tag: string): TagType {
  const lower = tag.toLowerCase();

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

function buildTopStack(ranked: RankedTag[], limit: number) {
  const buckets: Record<TagType, RankedTag[]> = {
    core: [],
    tutorial: [],
    longtail: [],
    outcome: [],
    variation: [],
  };

  for (const tag of ranked) {
    buckets[tag.tag_type].push(tag);
  }

  const stack: RankedTag[] = [];
  const seen = new Set<string>();

  const addFromBucket = (items: RankedTag[], count: number) => {
    let added = 0;

    for (const item of items) {
      if (stack.length >= limit) break;
      if (seen.has(item.tag)) continue;

      stack.push(item);
      seen.add(item.tag);
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
    if (seen.has(item.tag)) continue;

    stack.push(item);
    seen.add(item.tag);
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

    const body = (await req.json()) as ValidateRequest;

    const tags = Array.isArray(body.tags)
      ? body.tags.filter(
          (tag): tag is string => typeof tag === "string" && !!tag.trim()
        )
      : [];

    if (tags.length === 0) {
      return NextResponse.json(
        { error: "No tags provided." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const lookupKeywords = Array.from(
      new Set(tags.map((tag) => normalizeKeyword(tag)).filter(Boolean))
    ).slice(0, 30);

    const metrics = await getKeywordMetrics(lookupKeywords);

    const metricsByNormalizedKeyword = new Map<string, (typeof metrics)[number]>(
      metrics.map((metric) => [normalizeKeyword(metric.keyword), metric])
    );

    const rankedTags: RankedTag[] = tags.map((tag) => {
      const normalized = normalizeKeyword(tag);
      const metric = metricsByNormalizedKeyword.get(normalized) ?? null;

      const searchVolume = metric?.search_volume ?? 0;
      const competition = metric?.competition ?? 1;
      const competitionLevel = metric?.competition_level ?? "UNKNOWN";

      return {
        tag,
        search_volume: searchVolume,
        competition,
        competition_level: competitionLevel,
        score: scoreTag(searchVolume, competition),
        matched_keyword: metric?.keyword ?? null,
        tag_type: classifyTag(tag),
      };
    });

    const ranked = [...rankedTags].sort((a, b) => b.score - a.score);
    const top5 = buildTopStack(ranked, 5);
    const top10 = buildTopStack(ranked, 10);

    return NextResponse.json({
      rankedTags: ranked,
      bestTag: ranked[0] ?? null,
      top5,
      top10,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Tag validation failed:", error);

    const message =
      error instanceof Error ? error.message : "Tag validation failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}