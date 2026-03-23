import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { keywords, extraInstructions } = await req.json();
    const targetKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "system",
          content: `You are the Lead Growth Researcher at SEOTube.io. 
          Your goal is to write "Information-Gain" articles that provide specific, non-obvious answers to YouTube creators.

          STEP 1: SIMULATED RESEARCH
          Before writing, simulate a search of Reddit (r/NewTubers, r/PartneredYoutube) and creator forums for the following keywords: ${targetKeywords}. 
          Look for specific pain points, 2026 algorithm shifts, and unconventional "Pro-Tips" that generic AI misses.

          STEP 2: SEO TARGETING
          You MUST naturally weave these exact keywords into your <h2>, <h3>, and body text: ${targetKeywords}. 
          Target the "Search Intent" behind these specific terms to ensure high ranking.

          STEP 3: CONTENT RULES
          - Tone: Expert, data-driven, and "insider."
          - Depth: 800-1000 words.
          - Formatting: Use ONLY valid HTML (<h2>, <h3>, <p>, <ul>, <li>, <strong>). 
          - Tool Links: You MUST include at least 2 HTML links:
            - [Description Generator](https://seotube.io/tools/descriptions)
            - [Keyword Researcher](https://seotube.io/tools/keywords)
            - [Title Generator](https://seotube.io/tools/titles)

          RETURN ONLY a JSON object:
          {
            "title": "High-CTR SEO Title",
            "slug": "url-friendly-slug",
            "excerpt": "Punchy 150-char meta description",
            "content": "Full HTML article content"
          }`
        },
        {
          role: "user",
          content: `Topic: ${targetKeywords}. 
          Specific Focus/Secret Sauce: ${extraInstructions || "Provide a deep-dive strategy with actionable steps."}
          Write the definitive guide for this topic.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const blogData = JSON.parse(response.choices[0].message.content || "{}");
    
    if (blogData.slug) {
      blogData.slug = blogData.slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    return NextResponse.json(blogData);
  } catch (error) {
    console.error("OpenAI Error:", error);
    return NextResponse.json({ error: "Failed to generate expert content" }, { status: 500 });
  }
}