import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TagRequestBody = {
  seedKeyword?: string;
};

type TagResponse = {
  tags: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TagRequestBody;

    const seedKeyword =
      typeof body.seedKeyword === "string" ? body.seedKeyword.trim() : "";

    if (!seedKeyword) {
      return NextResponse.json(
        { error: "A keyword is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are a YouTube SEO keyword stacking expert.

A user gives one seed keyword.
Generate 30 highly relevant YouTube tags designed for keyword stacking.

Return ONLY valid JSON.
Use this exact shape:
{
  "tags": ["string", "string"]
}

Rules:
- Return exactly 30 tags.
- Every tag must stay tightly relevant to the seed keyword.
- Include a balanced mix of:
  1. exact-match keyword tags
  2. close variations
  3. tutorial/how-to intent tags
  4. beginner intent tags
  5. long-tail low-competition tags
  6. problem-solving / outcome-based tags
- You can only add words before or after what you're given.
- Do not remove any of the words given.
- Do not change the order of the words given.
- Avoid duplicates and near-duplicates.
- Do not include hashtags.
- Do not include commas inside a single tag.
- Do not generate generic filler tags unless clearly relevant.
- Keep tags realistic for YouTube SEO.
- Prioritize discoverability and coverage of related search intent.
- Note it is 2026 don't use any other dates.

Seed keyword: ${seedKeyword}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality YouTube tags from one seed keyword and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: TagResponse;

    try {
      parsed = JSON.parse(raw) as TagResponse;
    } catch {
      console.error("Failed to parse tag generator JSON:", raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleanedTags = Array.isArray(parsed.tags)
      ? Array.from(
          new Set(
            parsed.tags
              .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
              .filter(Boolean)
          )
        ).slice(0, 30)
      : [];

    if (cleanedTags.length === 0) {
      return NextResponse.json(
        { error: "No tags were generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tags: cleanedTags,
    });
  } catch (error) {
    console.error("Tag generator failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Tag generator failed.",
      },
      { status: 500 }
    );
  }
}