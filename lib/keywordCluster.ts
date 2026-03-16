export type KeywordCluster = {
  primary: string[];
  beginner: string[];
  tips: string[];
  mistakes: string[];
  comparison: string[];
  general: string[];
};

export function clusterKeywords(keywords: string[]): KeywordCluster {
  const clusters: KeywordCluster = {
    primary: [],
    beginner: [],
    tips: [],
    mistakes: [],
    comparison: [],
    general: [],
  };

  for (const keyword of keywords) {
    const lower = keyword.toLowerCase();

    if (
      lower.includes("how to") ||
      lower.includes("tutorial") ||
      lower.includes("guide")
    ) {
      clusters.primary.push(keyword);
      continue;
    }

    if (
      lower.includes("beginner") ||
      lower.includes("easy") ||
      lower.includes("starter")
    ) {
      clusters.beginner.push(keyword);
      continue;
    }

    if (
      lower.includes("tips") ||
      lower.includes("strategy") ||
      lower.includes("best")
    ) {
      clusters.tips.push(keyword);
      continue;
    }

    if (
      lower.includes("mistake") ||
      lower.includes("avoid") ||
      lower.includes("wrong")
    ) {
      clusters.mistakes.push(keyword);
      continue;
    }

    if (
      lower.includes("vs") ||
      lower.includes("versus") ||
      lower.includes("compare") ||
      lower.includes("comparison") ||
      lower.includes("difference")
    ) {
      clusters.comparison.push(keyword);
      continue;
    }

    clusters.general.push(keyword);
  }

  return clusters;
}