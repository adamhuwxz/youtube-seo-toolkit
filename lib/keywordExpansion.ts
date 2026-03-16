import { getYouTubeSuggestions } from "./youtubeAutocomplete";

export async function expandKeywordPool(
  baseKeywords: string[]
): Promise<string[]> {
  const all: string[] = [];

  for (const keyword of baseKeywords.slice(0, 10)) {
    const suggestions = await getYouTubeSuggestions(keyword);
    all.push(...suggestions);
  }

  const unique = Array.from(new Set(all));

  return unique;
}