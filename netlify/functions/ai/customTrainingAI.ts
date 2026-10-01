/**
 * ============================================================
 * CUSTOM TRAINING AI
 * ============================================================
 *
 * This is the local fallback when OpenRouter is unavailable.
 *
 * It is NOT a generative LLM.
 *
 * It behaves like a deterministic support model:
 *
 * User message
 *      ↓
 * normalization
 *      ↓
 * local RAG
 *      ↓
 * training/*.json
 * knowledge/*.json
 *      ↓
 * relevance matching
 *      ↓
 * response extraction
 *
 * It never invents information that is not present in the
 * local training/knowledge data.
 */

import {
  searchKnowledge,
  knowledgeToText,
  type KnowledgeResult,
} from "./rag";

export interface CustomTrainingResponse {
  message: string;
  source: "custom-training";
  fallback: true;
  confidence: number;
  matchedDocuments: Array<{
    fileName: string;
    category: string;
    score: number;
  }>;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractStrings(
  value: unknown,
  result: string[] = []
): string[] {
  if (value === null || value === undefined) {
    return result;
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (text) {
      result.push(text);
    }

    return result;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    result.push(String(value));
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractStrings(item, result);
    }

    return result;
  }

  if (typeof value === "object") {
    for (const child of Object.values(
      value as Record<string, unknown>
    )) {
      extractStrings(child, result);
    }
  }

  return result;
}

/**
 * Fields that normally represent an answer in training data.
 */
const ANSWER_FIELDS = [
  "answer",
  "response",
  "reply",
  "content",
  "solution",
  "description",
  "details",
  "text",
  "message",
  "answer_mm",
  "response_mm",
  "reply_mm",
  "content_mm",
  "description_mm",
];

function extractPreferredAnswers(
  value: unknown
): string[] {
  const result: string[] = [];

  if (
    value === null ||
    value === undefined
  ) {
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      result.push(
        ...extractPreferredAnswers(item)
      );
    }

    return result;
  }

  if (typeof value !== "object") {
    return result;
  }

  const object =
    value as Record<string, unknown>;

  for (const field of ANSWER_FIELDS) {
    const fieldValue = object[field];

    if (
      typeof fieldValue === "string" &&
      fieldValue.trim()
    ) {
      result.push(fieldValue.trim());
    }

    if (
      Array.isArray(fieldValue) ||
      typeof fieldValue === "object"
    ) {
      result.push(
        ...extractPreferredAnswers(
          fieldValue
        )
      );
    }
  }

  /*
   * Common nested training structures.
   */
  for (const key of [
    "items",
    "entries",
    "faqs",
    "questions",
    "intents",
    "data",
    "knowledge",
    "training",
    "examples",
  ]) {
    if (object[key]) {
      result.push(
        ...extractPreferredAnswers(
          object[key]
        )
      );
    }
  }

  return result;
}

function cleanAnswer(
  answer: string
): string {
  return answer
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function selectAnswer(
  result: KnowledgeResult
): string | null {
  const preferred =
    extractPreferredAnswers(
      result.data
    )
      .map(cleanAnswer)
      .filter(Boolean);

  if (preferred.length > 0) {
    /*
     * Prefer the first actual answer field rather than dumping
     * the entire JSON structure.
     */
    return preferred[0];
  }

  /*
   * If the schema does not use the expected answer fields,
   * fall back to the searchable representation.
   */
  const text = cleanAnswer(
    result.text
  );

  if (!text) {
    return null;
  }

  return text;
}

function scoreConfidence(
  results: KnowledgeResult[]
): number {
  if (!results.length) {
    return 0;
  }

  const top = results[0].score;

  if (top >= 25) {
    return 0.95;
  }

  if (top >= 18) {
    return 0.9;
  }

  if (top >= 12) {
    return 0.8;
  }

  if (top >= 8) {
    return 0.7;
  }

  if (top >= 5) {
    return 0.55;
  }

  return 0.35;
}

function isWeakMatch(
  results: KnowledgeResult[]
): boolean {
  if (!results.length) {
    return true;
  }

  return results[0].score < 5;
}

function buildNoMatchMessage(): string {
  return [
    "I couldn't find a reliable answer in my support knowledge.",
    "",
    "Please create a support ticket so our admin support team can help you.",
  ].join("\n");
}

export async function generateCustomTrainingResponse(
  message: string
): Promise<CustomTrainingResponse> {
  const normalizedMessage =
    normalize(message);

  if (!normalizedMessage) {
    return {
      message:
        "Please enter your question or message.",
      source: "custom-training",
      fallback: true,
      confidence: 0,
      matchedDocuments: [],
    };
  }

  /*
   * Search both:
   *
   * training/*.json
   * knowledge/*.json
   */
  const results =
    searchKnowledge(
      normalizedMessage,
      5
    );

  if (isWeakMatch(results)) {
    return {
      message:
        buildNoMatchMessage(),
      source: "custom-training",
      fallback: true,
      confidence: scoreConfidence(
        results
      ),
      matchedDocuments:
        results.map((item) => ({
          fileName: item.fileName,
          category: item.category,
          score: item.score,
        })),
    };
  }

  /*
   * Prefer a clean answer from the best matching document.
   */
  for (const result of results) {
    const answer =
      selectAnswer(result);

    if (
      answer &&
      answer.length > 0
    ) {
      return {
        message: answer,
        source: "custom-training",
        fallback: true,
        confidence:
          scoreConfidence(results),
        matchedDocuments:
          results.map((item) => ({
            fileName: item.fileName,
            category: item.category,
            score: item.score,
          })),
      };
    }
  }

  /*
   * Last deterministic fallback:
   * provide the relevant knowledge text.
   */
  const knowledgeText =
    knowledgeToText(results);

  if (knowledgeText) {
    return {
      message:
        knowledgeText.slice(0, 4000),
      source: "custom-training",
      fallback: true,
      confidence:
        scoreConfidence(results),
      matchedDocuments:
        results.map((item) => ({
          fileName: item.fileName,
          category: item.category,
          score: item.score,
        })),
    };
  }

  return {
    message:
      buildNoMatchMessage(),
    source: "custom-training",
    fallback: true,
    confidence: 0,
    matchedDocuments: [],
  };
}