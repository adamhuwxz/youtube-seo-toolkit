import { NextResponse } from "next/server";

type TranscriptRequestBody = {
  videoUrl?: string;
};

type SupadataTranscriptSuccess = {
  content?: string;
  lang?: string;
  availableLangs?: string[];
};

type SupadataTranscriptJob = {
  jobId?: string;
};

type SupadataTranscriptJobStatus = {
  status?: "queued" | "active" | "completed" | "failed";
  content?: string;
  lang?: string;
  availableLangs?: string[];
  error?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("m.youtube.com")
    );
  } catch {
    return false;
  }
}

function estimateReadingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;

  if (words === 0) {
    return 0;
  }

  return Math.max(1, Math.round(words / 150));
}

async function pollTranscriptJob(jobId: string) {
  const apiKey = process.env.SUPADATA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing SUPADATA_API_KEY.");
  }

  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(`https://api.supadata.ai/v1/transcript/${jobId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });

    const data = (await res.json()) as SupadataTranscriptJobStatus;

    if (!res.ok) {
      throw new Error(
        cleanText(data?.error) || "Failed while checking transcript job status."
      );
    }

    if (data.status === "completed" && cleanText(data.content)) {
      return {
        content: cleanText(data.content),
        lang: cleanText(data.lang) || "unknown",
        availableLangs: Array.isArray(data.availableLangs)
          ? data.availableLangs.filter(
              (item): item is string => typeof item === "string" && !!item.trim()
            )
          : [],
      };
    }

    if (data.status === "failed") {
      throw new Error(cleanText(data.error) || "Transcript job failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("Transcript is still processing. Please try again in a moment.");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.SUPADATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SUPADATA_API_KEY." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as TranscriptRequestBody;

    const videoUrl =
      typeof body.videoUrl === "string" ? body.videoUrl.trim() : "";

    if (!videoUrl) {
      return NextResponse.json(
        { error: "A YouTube video URL is required." },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(videoUrl)) {
      return NextResponse.json(
        { error: "Please enter a valid YouTube video URL." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      url: videoUrl,
      lang: "en",
      text: "true",
      mode: "native",
    });

    const supadataRes = await fetch(
      `https://api.supadata.ai/v1/transcript?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
        cache: "no-store",
      }
    );

    if (supadataRes.status === 202) {
      const jobData = (await supadataRes.json()) as SupadataTranscriptJob;
      const jobId = cleanText(jobData.jobId);

      if (!jobId) {
        return NextResponse.json(
          { error: "Transcript job started but no job ID was returned." },
          { status: 500 }
        );
      }

      const completed = await pollTranscriptJob(jobId);

      const transcript = cleanText(completed.content);
      const wordCount = transcript.split(/\s+/).filter(Boolean).length;

      return NextResponse.json({
        transcript,
        language: completed.lang,
        availableLanguages: completed.availableLangs,
        wordCount,
        estimatedMinutes: estimateReadingMinutes(transcript),
      });
    }

    const data = (await supadataRes.json()) as
      | SupadataTranscriptSuccess
      | { error?: string };

    if (!supadataRes.ok) {
      return NextResponse.json(
        {
          error:
            cleanText((data as { error?: string })?.error) ||
            "Failed to fetch transcript.",
        },
        { status: supadataRes.status }
      );
    }

    const transcript = cleanText((data as SupadataTranscriptSuccess).content);

    if (!transcript) {
      return NextResponse.json(
        { error: "No transcript was returned for this video." },
        { status: 404 }
      );
    }

    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      transcript,
      language: cleanText((data as SupadataTranscriptSuccess).lang) || "unknown",
      availableLanguages: Array.isArray(
        (data as SupadataTranscriptSuccess).availableLangs
      )
        ? (data as SupadataTranscriptSuccess).availableLangs?.filter(
            (item): item is string => typeof item === "string" && !!item.trim()
          )
        : [],
      wordCount,
      estimatedMinutes: estimateReadingMinutes(transcript),
    });
  } catch (error) {
    console.error("Transcript fetch failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Transcript fetch failed.",
      },
      { status: 500 }
    );
  }
}