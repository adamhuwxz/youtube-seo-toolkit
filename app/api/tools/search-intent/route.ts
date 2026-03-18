import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SearchIntentRequestBody = {
  seedKeyword?: string;
};

type IntentType =
  | "beginner"
  | "tutorial"
  | "mistakes"
  | "comparison"
  | "fastest"
  | "advanced"
  | "tools"
  | "results";

type IntentIdea = {
  intent: IntentType;
  user_goal: string;
  video_angle: string;
  keywords: string[];
};

type SearchIntentResponse = {
  buckets: IntentIdea[];
};

const ALLOWED_INTENTS: IntentType[] = [
  "beginner",
  "tutorial",
  "mistakes",
  "comparison",
  "fastest",
  "advanced",
  "tools",
  "results",
];

function cleanKeyword(keyword: unknown) {
  return typeof keyword === "string" ? keyword.trim() : "";
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeBuckets(rawBuckets: unknown, seedKeyword: string): IntentIdea[] {
  if (!Array.isArray(rawBuckets)) {
    return [];
  }

  const seenIntents = new Set<IntentType>();
  const cleaned: IntentIdea[] = [];

  for (const item of rawBuckets) {
    const intent = cleanText((item as { intent?: unknown })?.intent) as IntentType;

    if (!ALLOWED_INTENTS.includes(intent) || seenIntents.has(intent)) {
      continue;
    }

    const userGoal = cleanText((item as { user_goal?: unknown })?.user_goal);
    const videoAngle = cleanText((item as { video_angle?: unknown })?.video_angle);

    const keywords = Array.isArray((item as { keywords?: unknown[] })?.keywords)
      ? Array.from(
          new Set(
            ((item as { keywords?: unknown[] }).keywords ?? [])
              .map(cleanKeyword)
              .filter(Boolean)
          )
        ).slice(0, 6)
      : [];

    if (!userGoal || !videoAngle || keywords.length === 0) {
      continue;
    }

    const tightlyRelevantKeywords = keywords.filter((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      const lowerSeed = seedKeyword.toLowerCase();

      return (
        lowerKeyword.includes(lowerSeed) ||
        lowerSeed.includes(lowerKeyword) ||
        lowerKeyword.split(" ").some((word) => lowerSeed.includes(word))
      );
    });

    if (tightlyRelevantKeywords.length === 0) {
      continue;
    }

    cleaned.push({
      intent,
      user_goal: userGoal,
      video_angle: videoAngle,
      keywords: tightlyRelevantKeywords.slice(0, 6),
    });

    seenIntents.add(intent);
  }

  return cleaned;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SearchIntentRequestBody;

    const seedKeyword =
      typeof body.seedKeyword === "string" ? body.seedKeyword.trim() : "";

    if (!seedKeyword) {
      return NextResponse.json(
        { error: "A seed keyword is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are a YouTube SEO search intent strategist.

A user gives one seed keyword.
Your job is to map the most important YouTube search intents around that keyword.

Return ONLY valid JSON.
Use this exact shape:
{
  "buckets": [
    {
      "intent": "beginner",
      "user_goal": "string",
      "video_angle": "string",
      "keywords": ["string", "string"]
    }
  ]
}

Rules:
- Return exactly 8 buckets.
- Use these exact intent values once each:
  1. beginner
  2. tutorial
  3. mistakes
  4. comparison
  5. fastest
  6. advanced
  7. tools
  8. results
- Each bucket must include:
  - a clear user_goal
  - a strong video_angle
  - 4 to 6 keyword ideas
- Every keyword must stay tightly relevant to the seed keyword.
- Prefer keywords that feel like real YouTube searches.
- Keep keyword ideas natural and specific.
- Do not include hashtags.
- Do not include quotation marks inside keywords.
- Do not invent irrelevant angles.
- Only add words before or after the seed keyword or keep it as a very close variation.
- Prioritize search intent coverage for YouTube, not blog SEO.
- Note it is 2026, do not use older years unless absolutely necessary.

Seed keyword: ${seedKeyword}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate YouTube search intent coverage maps from one seed keyword and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: SearchIntentResponse;

    try {
      parsed = JSON.parse(raw) as SearchIntentResponse;
    } catch {
      console.error("Failed to parse search intent JSON:", raw);

      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleanedBuckets = sanitizeBuckets(parsed.buckets, seedKeyword);

    if (cleanedBuckets.length === 0) {
      return NextResponse.json(
        { error: "No search intent buckets were generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      buckets: cleanedBuckets,
    });
  } catch (error) {
    console.error("Search intent generator failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Search intent generator failed.",
      },
      { status: 500 }
    );
  }
}