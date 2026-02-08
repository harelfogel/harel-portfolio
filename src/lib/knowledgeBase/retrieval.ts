import { studioConfig } from "@/config/studioConfig";
import { listKnowledgeBaseDocs } from "@/lib/knowledgeBase/knowledgeBaseReader";

export type RetrievalStep =
  | "VALIDATING_QUERY"
  | "LOADING_KB"
  | "SCORING_DOCUMENTS"
  | "BUILDING_SNIPPETS"
  | "GENERATING_ANSWER"
  | "DONE";

export type RetrievalMatch = {
  docId: string;
  title: string;
  relativePath: string;
  score: number;
  snippet: string;
};

export type RetrievalResult = {
  steps: RetrievalStep[];
  query: string;
  results: RetrievalMatch[];
};

export function validateQuery(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed.length < studioConfig.minQueryLength) {
    return `Query must be at least ${studioConfig.minQueryLength} characters.`;
  }
  return null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(query: string): string[] {
  return normalizeText(query)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function countTokenOccurrences(haystack: string, token: string): number {
  if (!token) return 0;

  let count = 0;
  let fromIndex = 0;

  while (true) {
    const foundIndex = haystack.indexOf(token, fromIndex);
    if (foundIndex === -1) break;

    count += 1;
    fromIndex = foundIndex + token.length;
  }

  return count;
}

function scoreDocument(content: string, tokens: string[]): number {
  const normalizedContent = normalizeText(content);
  return tokens.reduce(
    (sum, token) => sum + countTokenOccurrences(normalizedContent, token),
    0,
  );
}

function buildSnippet(content: string, tokens: string[], radius: number): string {
  const normalizedContent = content.replace(/\s+/g, " ").trim();
  const lower = normalizedContent.toLowerCase();

  const firstHitIndex = tokens
    .map((t) => lower.indexOf(t))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b)[0];

  if (firstHitIndex === undefined) {
    return normalizedContent.slice(
      0,
      Math.min(normalizedContent.length, radius * 2),
    );
  }

  const start = Math.max(0, firstHitIndex - radius);
  const end = Math.min(normalizedContent.length, firstHitIndex + radius);

  const prefix = start > 0 ? "…" : "";
  const suffix = end < normalizedContent.length ? "…" : "";

  return `${prefix}${normalizedContent.slice(start, end)}${suffix}`;
}

export async function runRetrieval(query: string): Promise<RetrievalResult> {
  const trimmed = query.trim();
  const steps: RetrievalStep[] = ["VALIDATING_QUERY", "LOADING_KB"];

  const docs = await listKnowledgeBaseDocs();

  steps.push("SCORING_DOCUMENTS");
  const tokens = tokenize(trimmed);

  const scored = docs
    .map((doc) => {
      const score = scoreDocument(
        `${doc.title}\n${doc.relativePath}\n${doc.content}`,
        tokens,
      );
      return { doc, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, studioConfig.maxResults);

  steps.push("BUILDING_SNIPPETS");
  const results: RetrievalMatch[] = scored.map(({ doc, score }) => ({
    docId: doc.id,
    title: doc.title,
    relativePath: doc.relativePath,
    score,
    snippet: buildSnippet(doc.content, tokens, studioConfig.snippetRadiusChars),
  }));

  steps.push("DONE");

  return { steps, query: trimmed, results };
}
