export type KeywordMetric = {
  keyword: string;
  search_volume: number;
  competition: number;
  competition_level: string;
};

type DataForSeoSearchVolumeResponse = {
  tasks?: Array<{
    status_code?: number;
    status_message?: string;
    result?: Array<{
      keyword?: string;
      search_volume?: number;
      competition?: number;
      competition_level?: string;
    }>;
  }>;
};

function getAuthHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      "Missing DATAFORSEO_LOGIN or DATAFORSEO_PASSWORD in .env.local"
    );
  }

  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

function normalizeKeyword(keyword: string) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKeywords(keywords: string[], maxKeywords: number) {
  return Array.from(
    new Set(
      keywords
        .map((keyword) => normalizeKeyword(keyword))
        .filter((keyword) => keyword.length >= 2)
    )
  ).slice(0, maxKeywords);
}

export async function getKeywordMetrics(
  keywords: string[],
  options?: {
    locationCode?: number;
    languageCode?: string;
    maxKeywords?: number;
  }
): Promise<KeywordMetric[]> {
  const locationCode = options?.locationCode ?? 2840;
  const languageCode = options?.languageCode ?? "en";
  const maxKeywords = options?.maxKeywords ?? 30;

  const cleanedKeywords = dedupeKeywords(keywords, maxKeywords);

  if (cleanedKeywords.length === 0) {
    console.log("DataForSEO: no cleaned keywords");
    return [];
  }

  console.log("DataForSEO exact keywords:", cleanedKeywords);
  console.log(
    "DataForSEO market:",
    `location_code=${locationCode} / language_code=${languageCode}`
  );

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            location_code: locationCode,
            language_code: languageCode,
            keywords: cleanedKeywords,
          },
        ]),
        cache: "no-store",
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("DataForSEO HTTP error:", response.status, text);
      return [];
    }

    const data = JSON.parse(text) as DataForSeoSearchVolumeResponse;
    const task = data.tasks?.[0];

    if (!task || task.status_code !== 20000) {
      console.error(
        "DataForSEO task error:",
        task?.status_code,
        task?.status_message
      );
      return [];
    }

    const results = task.result ?? [];

    const metrics = results
      .filter(
        (item): item is {
          keyword: string;
          search_volume?: number;
          competition?: number;
          competition_level?: string;
        } => typeof item.keyword === "string" && item.keyword.trim().length > 0
      )
      .map((item) => ({
        keyword: item.keyword,
        search_volume: item.search_volume ?? 0,
        competition: item.competition ?? 1,
        competition_level: item.competition_level ?? "UNKNOWN",
      }));

    console.log("DataForSEO exact metrics returned:", metrics.length);

    return metrics;
  } catch (error) {
    console.error("DataForSEO fetch error:", error);
    return [];
  }
}