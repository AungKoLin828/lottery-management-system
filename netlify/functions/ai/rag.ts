import fs from "node:fs/promises";
import path from "node:path";

/* ============================================================
   TYPES
============================================================ */

export interface KnowledgeItem {
  title?: string;
  question?: string;
  answer?: string;
  content?: string;
  keywords?: string[];
  category?: string;
}

/* ============================================================
   KNOWLEDGE FILES
============================================================ */

const KNOWLEDGE_FILES = [
  "account.json",
  "wallet.json",
  "deposit.json",
  "withdrawal.json",
  "lottery-2d.json",
  "lottery-3d.json",
  "results.json",
  "pwa.json",
  "general.json",
];

/* ============================================================
   CACHE
============================================================ */

let cache:
  | KnowledgeItem[]
  | null = null;

/* ============================================================
   LOAD KNOWLEDGE
============================================================ */

async function loadKnowledge(): Promise<
  KnowledgeItem[]
> {
  if (cache) {
    return cache;
  }

  /*
   * process.cwd() normally points at the project root when
   * running Netlify Functions.
   */
  const root =
    process.cwd();

  const items:
    KnowledgeItem[] = [];

  for (
    const file of KNOWLEDGE_FILES
  ) {
    const filePath =
      path.join(
        root,
        "knowledge",
        file,
      );

    try {
      const raw =
        await fs.readFile(
          filePath,
          "utf8",
        );

      const parsed:
        | unknown =
        JSON.parse(raw);

      if (
        Array.isArray(parsed)
      ) {
        items.push(
          ...parsed.filter(
            isKnowledgeItem,
          ),
        );

        continue;
      }

      if (
        isRecord(parsed) &&
        Array.isArray(
          parsed.items,
        )
      ) {
        items.push(
          ...parsed.items.filter(
            isKnowledgeItem,
          ),
        );
      }
    } catch (error) {
      console.error(
        `[AI:RAG] Unable to load knowledge file: ${file}`,
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }

  cache =
    items;

  return items;
}

/* ============================================================
   TYPE GUARDS
============================================================ */

function isRecord(
  value: unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null
  );
}

function isKnowledgeItem(
  value: unknown,
): value is KnowledgeItem {
  if (
    !isRecord(value)
  ) {
    return false;
  }

  return true;
}

/* ============================================================
   NORMALIZE
============================================================ */

function normalize(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

/* ============================================================
   SCORE
============================================================ */

function score(
  query: string,
  item: KnowledgeItem,
): number {
  const q =
    normalize(query);

  const searchable =
    normalize(
      [
        item.title,
        item.question,
        item.answer,
        item.content,
        ...(item.keywords ??
          []),
      ]
        .filter(
          (
            value,
          ) =>
            typeof value ===
            "string",
        )
        .join(" "),
    );

  if (
    !q ||
    !searchable
  ) {
    return 0;
  }

  const words =
    q.split(" ");

  let result =
    0;

  for (
    const word of words
  ) {
    if (
      word.length < 2
    ) {
      continue;
    }

    if (
      searchable.includes(
        word,
      )
    ) {
      result += 1;
    }
  }

  const normalizedQuestion =
    item.question
      ? normalize(
          item.question,
        )
      : "";

  if (
    normalizedQuestion &&
    normalizedQuestion.includes(
      q,
    )
  ) {
    result += 5;
  }

  const normalizedTitle =
    item.title
      ? normalize(
          item.title,
        )
      : "";

  if (
    normalizedTitle &&
    normalizedTitle.includes(
      q,
    )
  ) {
    result += 3;
  }

  return result;
}

/* ============================================================
   SEARCH
============================================================ */

export async function searchKnowledge(
  query: string,
  limit = 5,
): Promise<KnowledgeItem[]> {
  const safeQuery =
    query.trim();

  if (!safeQuery) {
    return [];
  }

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 5,
        1,
      ),
      10,
    );

  const items =
    await loadKnowledge();

  return items
    .map(
      (item) => ({
        item,
        score:
          score(
            safeQuery,
            item,
          ),
      }),
    )
    .filter(
      (entry) =>
        entry.score > 0,
    )
    .sort(
      (a, b) =>
        b.score -
        a.score,
    )
    .slice(
      0,
      safeLimit,
    )
    .map(
      (entry) =>
        entry.item,
    );
}

/* ============================================================
   CONVERT TO PROMPT TEXT
============================================================ */

export function knowledgeToText(
  items: KnowledgeItem[],
): string {
  return items
    .map(
      (item) =>
        [
          item.title
            ? `Title: ${item.title}`
            : "",

          item.category
            ? `Category: ${item.category}`
            : "",

          item.question
            ? `Question: ${item.question}`
            : "",

          item.answer
            ? `Answer: ${item.answer}`
            : "",

          item.content
            ? `Content: ${item.content}`
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
    )
    .join(
      "\n\n---\n\n",
    );
}