/**
 * ============================================================
 * LOCAL RAG
 * ============================================================
 *
 * Searches:
 *
 *   /training/*.json
 *   /knowledge/*.json
 *
 * No data is duplicated into netlify/functions/ai.
 */

import {
  loadTrainingDocuments,
  type TrainingDocument,
} from "./trainingLoader";

export interface KnowledgeResult {
  id: string;
  source: "training" | "knowledge";
  fileName: string;
  category: string;
  score: number;
  text: string;
  data: unknown;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function calculateScore(
  query: string,
  document: TrainingDocument
): number {
  const queryTokens = unique(tokenize(query));

  if (queryTokens.length === 0) {
    return 0;
  }

  const documentText = normalizeText(
    document.text
  );

  const categoryText = normalizeText(
    `${document.category} ${document.fileName}`
  );

  let score = 0;

  for (const token of queryTokens) {
    if (documentText.includes(token)) {
      score += 1;
    }

    if (categoryText.includes(token)) {
      score += 2;
    }
  }

  /*
   * Exact phrase match gets additional weight.
   */
  const normalizedQuery = normalizeText(query);

  if (
    normalizedQuery.length > 3 &&
    documentText.includes(normalizedQuery)
  ) {
    score += 10;
  }

  /*
   * Strong keyword/category hints.
   */
  const category = normalizeText(
    `${document.category} ${document.fileName}`
  );

  const importantGroups = [
    ["wallet", "balance"],
    ["deposit", "topup", "top up"],
    ["withdrawal", "withdraw"],
    ["2d", "two digit"],
    ["3d", "three digit"],
    ["result", "results"],
    ["account", "login", "phone"],
    ["pwa", "install"],
  ];

  for (const group of importantGroups) {
    const queryHasGroup = group.some((word) =>
      normalizedQuery.includes(word)
    );

    const documentHasGroup = group.some((word) =>
      category.includes(word)
    );

    if (queryHasGroup && documentHasGroup) {
      score += 8;
    }
  }

  return score;
}

export function searchKnowledge(
  query: string,
  limit = 5
): KnowledgeResult[] {
  const { documents } =
    loadTrainingDocuments();

  if (!query.trim()) {
    return [];
  }

  return documents
    .map((document) => ({
      id: document.id,
      source: document.source,
      fileName: document.fileName,
      category: document.category,
      score: calculateScore(
        query,
        document
      ),
      text: document.text,
      data: document.data,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function knowledgeToText(
  results: KnowledgeResult[]
): string {
  if (!results.length) {
    return "";
  }

  return results
    .map((item, index) => {
      return [
        `SOURCE ${index + 1}`,
        `Type: ${item.source}`,
        `File: ${item.fileName}`,
        `Category: ${item.category}`,
        `Score: ${item.score}`,
        "Content:",
        item.text,
      ].join("\n");
    })
    .join("\n\n-------------------------\n\n");
}