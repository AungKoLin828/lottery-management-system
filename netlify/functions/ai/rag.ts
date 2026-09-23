import fs from "node:fs/promises";
import path from "node:path";

interface KnowledgeItem {
  title?: string;
  question?: string;
  answer?: string;
  content?: string;
  keywords?: string[];
  category?: string;
}

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

let cache:
  | KnowledgeItem[]
  | null = null;

async function loadKnowledge(): Promise<KnowledgeItem[]> {
  if (cache) {
    return cache;
  }

  const root = process.cwd();

  const items: KnowledgeItem[] = [];

  for (const file of KNOWLEDGE_FILES) {
    const filePath = path.join(
      root,
      "knowledge",
      file,
    );

    try {
      const raw = await fs.readFile(
        filePath,
        "utf8",
      );

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (Array.isArray(parsed.items)) {
        items.push(...parsed.items);
      }
    } catch (error) {
      console.error(
        `Unable to load knowledge file: ${file}`,
        error,
      );
    }
  }

  cache = items;

  return items;
}

function normalize(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function score(
  query: string,
  item: KnowledgeItem,
): number {
  const q = normalize(query);

  const searchable = normalize(
    [
      item.title,
      item.question,
      item.answer,
      item.content,
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (!q || !searchable) {
    return 0;
  }

  const words = q.split(" ");

  let result = 0;

  for (const word of words) {
    if (word.length < 2) {
      continue;
    }

    if (searchable.includes(word)) {
      result += 1;
    }
  }

  if (
    item.question &&
    normalize(item.question).includes(q)
  ) {
    result += 5;
  }

  return result;
}

export async function searchKnowledge(
  query: string,
  limit = 5,
): Promise<KnowledgeItem[]> {
  const items = await loadKnowledge();

  return items
    .map((item) => ({
      item,
      score: score(query, item),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export function knowledgeToText(
  items: KnowledgeItem[],
): string {
  return items
    .map((item) => {
      return [
        item.title
          ? `Title: ${item.title}`
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
        .join("\n");
    })
    .join("\n\n---\n\n");
}