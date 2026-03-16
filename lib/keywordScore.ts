import { KeywordMetric } from "./dataforseo";

export type ScoredKeyword = KeywordMetric & {
  search_volume_score: number;
  low_competition_score: number;
  final_score: number;
};

/**
 * Normalize search volume into a 0–10 score
 */
function normalizeSearchVolume(
  volume: number,
  maxVolume: number
): number {
  if (!maxVolume) return 0;
  return Math.min(10, (volume / maxVolume) * 10);
}

/**
 * Convert competition (0–1) into a "low competition score"
 * Lower competition = higher score
 */
function normalizeCompetition(competition: number): number {
  return Math.max(0, Math.min(10, (1 - competition) * 10));
}

/**
 * Score keywords using search volume and competition.
 * (AI relevance and intent are handled earlier in the pipeline)
 */
export function scoreKeywords(metrics: KeywordMetric[]): ScoredKeyword[] {
  if (!metrics.length) return [];

  const maxVolume = Math.max(...metrics.map((k) => k.search_volume), 1);

  return metrics
    .map((k) => {
      const search_volume_score = normalizeSearchVolume(
        k.search_volume,
        maxVolume
      );

      const low_competition_score = normalizeCompetition(k.competition);

      const final_score =
        0.65 * search_volume_score +
        0.35 * low_competition_score;

      return {
        ...k,
        search_volume_score: Math.round(search_volume_score * 10) / 10,
        low_competition_score: Math.round(low_competition_score * 10) / 10,
        final_score: Math.round(final_score * 100) / 100,
      };
    })
    .sort((a, b) => b.final_score - a.final_score);
}