export async function getYoutubeSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url);

    const text = await res.text();

    // Try JSON first
    try {
      const json = JSON.parse(text);

      if (Array.isArray(json) && Array.isArray(json[1])) {
        return json[1];
      }
    } catch {
      // ignore JSON parse failure
    }

    // Fallback: parse XML suggestions
    const matches = [...text.matchAll(/data="([^"]+)"/g)];

    return matches.map((m) => m[1]);
  } catch (error) {
    console.error("YouTube suggestion error:", error);
    return [];
  }
}

export async function expandKeywords(seedKeywords: string[]) {
  const results = new Set<string>();

  for (const keyword of seedKeywords) {
    const suggestions = await getYoutubeSuggestions(keyword);

    suggestions.forEach((s) => results.add(s));
  }

  return Array.from(results);
}