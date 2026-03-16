export async function getYouTubeSuggestions(
  keyword: string
): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
      keyword
    )}`;

    const res = await fetch(url);

    const data = await res.json();

    if (!Array.isArray(data) || !Array.isArray(data[1])) {
      return [];
    }

    return data[1].map((item: string[]) => item[0]).filter(Boolean);
  } catch (error) {
    console.error("YouTube suggestion error:", error);
    return [];
  }
}