import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TitleRequestBody = {
  keyword?: string;
};

type TitleResponse = {
  titles: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TitleRequestBody;

    const keyword =
      typeof body.keyword === "string" ? body.keyword.trim() : "";

    if (!keyword) {
      return NextResponse.json(
        { error: "A top keyword is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are a YouTube SEO title expert.

Generate 5 strong YouTube title options from one target keyword.

Return ONLY valid JSON.
Use this exact shape:
{
  "titles": ["string", "string", "string", "string", "string"]
}

Rules:
- Return exactly 5 titles.
- Naturally include the target keyword in each title where it makes sense.
- Keep titles clickable but not fake clickbait.
- Keep titles highly relevant to the keyword.
- Prefer clear, high-CTR YouTube wording.
- Keep most titles between 45 and 70 characters when possible.
- Avoid duplicate title structures.
- Do not include hashtags.
- Do not wrap titles in quotation marks.

Target keyword: ${keyword}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You generate high-quality YouTube titles from one target keyword and return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: TitleResponse;

    try {
      parsed = JSON.parse(raw) as TitleResponse;
    } catch {
      console.error("Failed to parse title generator JSON:", raw);

      return NextResponse.json(
        { error: "AI returned invalid JSON." },
        { status: 500 }
      );
    }

    const cleanedTitles = Array.isArray(parsed.titles)
      ? Array.from(
          new Set(
            parsed.titles
              .map((title) => (typeof title === "string" ? title.trim() : ""))
              .filter(Boolean)
          )
        ).slice(0, 5)
      : [];

    if (cleanedTitles.length === 0) {
      return NextResponse.json(
        { error: "No titles were generated." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      titles: cleanedTitles,
    });
  } catch (error) {
    console.error("Title generator failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Title generator failed.",
      },
      { status: 500 }
    );
  }
}