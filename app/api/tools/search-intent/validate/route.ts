import { NextResponse } from "next/server";
import { getKeywordMetrics } from "@/lib/dataforseo";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

type IntentType =
  | "beginner"
  | "tutorial"
  | "mistakes"
  | "comparison"
  | "fastest"
  | "advanced"
  | "tools"
  | "results";

type IntentBucket = {
  intent?: IntentType;
  user_goal?: string;
  video_angle?: string;
  keywords?: string[];
};

type ValidateRequest = {
  buckets?: IntentBucket[];
};

type RankedKeyword = {
  keyword: string;
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  search_volume: number;
  competition: number;
  competition_level: string;
  score: number;
};

type RankedBucket = {
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  keywords: RankedKeyword[];
};

const INTENT_ORDER: IntentType[] = [
  "beginner",
  "tutorial",
  "mistakes",
  "comparison",
  "fastest",
  "advanced",
  "tools",
  "results",
];

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function scoreKeyword(searchVolume: number, competition: number) {
  const volumeWeight = Math.log10(searchVolume + 1) * 25;
  const competitionPenalty = competition * 35;
  return Math.max(0, Math.round(volumeWeight - competitionPenalty));
}

function bucketPriorityBonus(intent: IntentType) {
  switch (intent) {
    case "tutorial":
      return 8;
    case "beginner":
      return 7;
    case "mistakes":
      return 6;
    case "comparison":
      return 6;
    case "fastest":
      return 5;
    case "results":
      return 5;
    case "tools":
      return 4;
    case "advanced":
      return 3;
    default:
      return 0;
  }
}

function finalKeywordScore(
  searchVolume: number,
  competition: number,
  intent: IntentType
) {
  return scoreKeyword(searchVolume, competition) + bucketPriorityBonus(intent);
}

function sanitizeBuckets(rawBuckets: unknown): RankedBucket[] {
  if (!Array.isArray(rawBuckets)) {
    return [];
  }

  const seenIntents = new Set<IntentType>();
  const cleaned: RankedBucket[] = [];

  for (const item of rawBuckets) {
    const intent = cleanText((item as IntentBucket)?.intent) as IntentType;

    if (!INTENT_ORDER.includes(intent) || seenIntents.has(intent)) {
      continue;
    }

    const userGoal = cleanText((item as IntentBucket)?.user_goal);
    const videoAngle = cleanText((item as IntentBucket)?.video_angle);

    const keywords = Array.isArray((item as IntentBucket)?.keywords)
      ? Array.from(
          new Set(
            ((item as IntentBucket).keywords ?? [])
              .map(cleanText)
              .filter(Boolean)
          )
        ).slice(0, 6)
      : [];

    if (!userGoal || !videoAngle || keywords.length === 0) {
      continue;
    }

    cleaned.push({
      intent,
      user_goal: userGoal,
      video_angle: videoAngle,
      keywords: keywords.map((keyword) => ({
        keyword,
        intent,
        user_goal: userGoal,
        video_angle: videoAngle,
        search_volume: 0,
        competition: 1,
        competition_level: "UNKNOWN",
        score: 0,
      })),
    });

    seenIntents.add(intent);
  }

  return cleaned;
}

function buildMissingAngles(rankedBuckets: RankedBucket[]) {
  const presentIntents = new Set(rankedBuckets.map((bucket) => bucket.intent));

  return INTENT_ORDER.filter((intent) => !presentIntents.has(intent)).map(
    (intent) => {
      switch (intent) {
        case "beginner":
          return "You are missing a beginner-friendly angle.";
        case "tutorial":
          return "You are missing a clear tutorial/search-how-to angle.";
        case "mistakes":
          return "You are missing a mistakes/problem-solving angle.";
        case "comparison":
          return "You are missing a comparison or versus angle.";
        case "fastest":
          return "You are missing a fastest/easiest outcome angle.";
        case "advanced":
          return "You are missing an advanced user angle.";
        case "tools":
          return "You are missing a tools/setup/resources angle.";
        case "results":
          return "You are missing a results/proof/example angle.";
        default:
          return "You are missing an important content angle.";
      }
    }
  );
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
    const buckets = sanitizeBuckets(body.buckets);

    if (buckets.length === 0) {
      return NextResponse.json(
        { error: "No search intent buckets provided." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const lookupKeywords = Array.from(
      new Set(
        buckets.flatMap((bucket) =>
          bucket.keywords
            .map((item) => normalizeKeyword(item.keyword))
            .filter(Boolean)
        )
      )
    ).slice(0, 48);

    const metrics = await getKeywordMetrics(lookupKeywords);

    const metricsByNormalizedKeyword = new Map<string, (typeof metrics)[number]>(
      metrics.map((metric) => [normalizeKeyword(metric.keyword), metric])
    );

    const rankedBuckets: RankedBucket[] = buckets.map((bucket) => {
      const rankedKeywords = bucket.keywords
        .map((item) => {
          const normalized = normalizeKeyword(item.keyword);
          const metric = metricsByNormalizedKeyword.get(normalized) ?? null;

          const searchVolume = metric?.search_volume ?? 0;
          const competition = metric?.competition ?? 1;
          const competitionLevel = metric?.competition_level ?? "UNKNOWN";

          return {
            keyword: item.keyword,
            intent: bucket.intent,
            user_goal: bucket.user_goal,
            video_angle: bucket.video_angle,
            search_volume: searchVolume,
            competition,
            competition_level: competitionLevel,
            score: finalKeywordScore(searchVolume, competition, bucket.intent),
          };
        })
        .sort((a, b) => b.score - a.score);

      return {
        ...bucket,
        keywords: rankedKeywords,
      };
    });

    const allKeywords = rankedBuckets
      .flatMap((bucket) => bucket.keywords)
      .sort((a, b) => b.score - a.score);

    const bestOverall = allKeywords.slice(0, 10);
    const easiestWins = [...allKeywords]
      .filter((item) => item.search_volume > 0)
      .sort((a, b) => {
        if (a.competition !== b.competition) {
          return a.competition - b.competition;
        }

        return b.search_volume - a.search_volume;
      })
      .slice(0, 10);

    const bestByIntent = rankedBuckets.map((bucket) => ({
      intent: bucket.intent,
      bestKeyword: bucket.keywords[0] ?? null,
      user_goal: bucket.user_goal,
      video_angle: bucket.video_angle,
    }));

    const missingAngles = buildMissingAngles(rankedBuckets);

    return NextResponse.json({
      rankedBuckets,
      bestOverall,
      easiestWins,
      bestByIntent,
      missingAngles,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Search intent validation failed:", error);

    const message =
      error instanceof Error ? error.message : "Search intent validation failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}