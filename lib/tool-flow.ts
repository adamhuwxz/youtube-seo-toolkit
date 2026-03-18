export type SeoToolFlowData = {
  keyword?: string;
  secondaryKeywords?: string[];
};

const STORAGE_KEY = "seo_tool_flow";

export function saveToolFlow(data: SeoToolFlowData) {
  if (typeof window === "undefined") return;

  try {
    const existing = readToolFlow();
    const next = {
      ...existing,
      ...data,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

export function readToolFlow(): SeoToolFlowData {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SeoToolFlowData;
  } catch {
    return {};
  }
}

export function clearToolFlow() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}