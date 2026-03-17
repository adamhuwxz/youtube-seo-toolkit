import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  primaryKeyword?: string;
  context?: string;
  secondaryKeywords?: string;
  userId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;

    const primaryKeyword = body.primaryKeyword?.trim();
    const context = body.context?.trim();
    const secondaryKeywords = body.secondaryKeywords?.trim();
    const userId = body.userId;

    if (!primaryKeyword || !context || !userId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 🔐 CHECK USER TOKENS
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const credits = userData.credits ?? 0;

    if (credits < 1) {
      return NextResponse.json(
        { error: "Not enough credits." },
        { status: 403 }
      );
    }

    // 🧠 AI PROMPT
    const prompt = `
You are a YouTube SEO expert.

Write 3 different YouTube video descriptions.

RULES:
- Use the primary keyword naturally: "${primaryKeyword}"
- Use these secondary keywords if relevant: "${secondaryKeywords || ""}"
- Base the content ONLY on this context/transcript:
${context}

- First 2 lines must be strong and engaging
- Keep descriptions realistic and accurate
- Do NOT make things up
- Avoid keyword stuffing
- Write naturally like a real creator

OUTPUT FORMAT (JSON ONLY):
{
  "descriptions": [
    "Description 1",
    "Description 2",
    "Description 3"
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No AI response");
    }

    const parsed = JSON.parse(content);

    // 💰 DEDUCT TOKEN
    await updateDoc(userRef, {
      credits: increment(-1),
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Description generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate descriptions." },
      { status: 500 }
    );
  }
}