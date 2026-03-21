import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { keywords } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective and fast
      messages: [
        {
          role: "system",
          content: `You are an SEO Content Writer for SEOTube. 
          Return ONLY a JSON object with:
          - title: Catchy SEO title (max 60 chars)
          - slug: URL-friendly string
          - excerpt: 150-char meta description
          - content: Full article in HTML (use <h2>, <h3>, <strong>, and <ul> tags).`
        },
        {
          role: "user",
          content: `Write a high-ranking blog post about: ${keywords}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const blogData = JSON.parse(response.choices[0].message.content || "{}");
    return NextResponse.json(blogData);
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}