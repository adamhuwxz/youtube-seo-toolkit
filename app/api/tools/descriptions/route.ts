import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  primaryKeyword?: string;
  context?: string;
  secondaryKeywords?: string;
};

type DescriptionResponse = {
  descriptions: string[];
};

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

    const body = (await req.json()) as RequestBody;

    const primaryKeyword =
      typeof body.primaryKeyword === "string" ? body.primaryKeyword.trim() : "";

    const context =
      typeof body.context === "string" ? body.context.trim() : "";

    const secondaryKeywords =
      typeof body.secondaryKeywords === "string"
        ? body.secondaryKeywords.trim()
        : "";

    if (!primaryKeyword || !context) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const prompt = `
You are a YouTube SEO expert.

Write 3 different YouTube video descriptions.

RULES:
- Use the primary keyword naturally: "${primaryKeyword}"
- Use these secondary keywords if relevant: "${secondaryKeywords}"
- Base the content ONLY on this context/transcript:
${context}

- First 2 lines must be strong and engaging
- Keep descriptions realistic and accurate
- Do NOT make things up
- Avoid keyword stuffing
- Write naturally like a real creator

Return ONLY valid JSON.
Use this exact shape:
{
  "descriptions": [
    "Description 1",
    "Description 2",
    "Description 3"
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality YouTube descriptions and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: DescriptionResponse;

    try {
      parsed = JSON.parse(raw) as DescriptionResponse;
    } catch {
      console.error("Failed to parse description generator JSON:", raw);
      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleanedDescriptions = Array.isArray(parsed.descriptions)
      ? parsed.descriptions
          .map((desc) => (typeof desc === "string" ? desc.trim() : ""))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (cleanedDescriptions.length === 0) {
      return NextResponse.json(
        { error: "No descriptions were generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      descriptions: cleanedDescriptions,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Description generation failed:", error);

    const message =
      error instanceof Error ? error.message : "Description generator failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}