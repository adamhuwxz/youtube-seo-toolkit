import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminAuth } from "@/lib/firebase-admin";
import { consumeCredits } from "@/lib/server/credits";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RewriteRequest = {
  transcript?: string;
};

type RewriteResponse = {
  script: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

    const body = (await req.json()) as RewriteRequest;

    const transcript = cleanText(body.transcript);

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required." },
        { status: 400 }
      );
    }

    if (transcript.length < 200) {
      return NextResponse.json(
        { error: "Transcript is too short to rewrite." },
        { status: 400 }
      );
    }

    const creditResult = await consumeCredits(uid, 1);

    const prompt = `
You are a YouTube script writer.

Your job is to take a raw transcript and rewrite it into a clean, engaging 2–3 minute YouTube script.

Return ONLY valid JSON.
Use this exact shape:
{
  "script": "string"
}

Rules:
- Keep the same core topic and meaning.
- Rewrite for clarity, flow and engagement.
- Remove filler, repetition and rambling.
- Make it sound natural when spoken aloud.
- Keep it concise (2–3 minutes max).
- Start with a strong hook in the first 1–2 sentences.
- Structure it logically (intro → main points → ending).
- Do NOT include timestamps.
- Do NOT mention that it is rewritten.
- Do NOT include labels like "Hook:" or "Conclusion:".
- Do NOT use emojis.
- Keep it YouTube-friendly and engaging but not overhyped.

Transcript:
${transcript}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You rewrite transcripts into short, engaging YouTube scripts and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: RewriteResponse;

    try {
      parsed = JSON.parse(raw) as RewriteResponse;
    } catch {
      console.error("Transcript rewrite JSON failed:", raw);

      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const script = cleanText(parsed.script);

    if (!script) {
      return NextResponse.json(
        { error: "No script was generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      script,
      creditsRemaining: creditResult.remainingCredits,
    });
  } catch (error) {
    console.error("Transcript rewrite failed:", error);

    const message =
      error instanceof Error ? error.message : "Transcript rewrite failed.";

    if (message === "Not enough credits.") {
      return NextResponse.json({ error: message }, { status: 402 });
    }

    if (message.toLowerCase().includes("id token")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}