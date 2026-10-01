/**
 * ============================================================
 * TRAINING / KNOWLEDGE LOADER
 * ============================================================
 *
 * Reads the existing top-level:
 *
 *   /training
 *   /knowledge
 *
 * folders.
 *
 * The JSON data itself does not need to be changed.
 *
 * This loader intentionally does not require a fixed JSON schema.
 * It can recursively convert the existing JSON structures into
 * searchable text.
 */

import fs from "node:fs";
import path from "node:path";

export type TrainingSource = "training" | "knowledge";

export interface TrainingDocument {
  id: string;
  source: TrainingSource;
  fileName: string;
  category: string;
  data: unknown;
  text: string;
}

interface LoadResult {
  documents: TrainingDocument[];
  errors: string[];
}

let cachedDocuments: TrainingDocument[] | null = null;
let cachedAt = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Find project root.
 *
 * Netlify Functions normally run with process.cwd() pointing to
 * the deployed site root.
 */
function getProjectRoot(): string {
  const candidates = [
    process.cwd(),

    path.resolve(process.cwd(), ".."),

    path.resolve(process.cwd(), "../.."),

    path.resolve(__dirname, "../../.."),

    path.resolve(__dirname, "../../../.."),
  ];

  for (const candidate of candidates) {
    const trainingPath = path.join(candidate, "training");
    const knowledgePath = path.join(candidate, "knowledge");

    if (
      fs.existsSync(trainingPath) ||
      fs.existsSync(knowledgePath)
    ) {
      return candidate;
    }
  }

  return process.cwd();
}

function getDirectory(source: TrainingSource): string {
  return path.join(getProjectRoot(), source);
}

function safeReadJson(filePath: string): unknown {
  const content = fs.readFileSync(filePath, "utf8");

  return JSON.parse(content);
}

function recursivelyFindJsonFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const result: string[] = [];

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(
        ...recursivelyFindJsonFiles(fullPath)
      );

      continue;
    }

    if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith(".json")
    ) {
      result.push(fullPath);
    }
  }

  return result;
}

/**
 * Convert arbitrary JSON into searchable text.
 */
function jsonToText(
  value: unknown,
  currentPath = ""
): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return currentPath
      ? `${currentPath}: ${String(value)}`
      : String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item, index) =>
        jsonToText(
          item,
          currentPath
            ? `${currentPath}[${index}]`
            : `[${index}]`
        )
      )
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    return Object.entries(
      value as Record<string, unknown>
    )
      .map(([key, child]) => {
        const nextPath = currentPath
          ? `${currentPath}.${key}`
          : key;

        return jsonToText(child, nextPath);
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function createDocument(
  source: TrainingSource,
  filePath: string,
  data: unknown
): TrainingDocument {
  const fileName = path.basename(filePath);

  const relativePath = path.relative(
    getDirectory(source),
    filePath
  );

  const category = path
    .dirname(relativePath)
    .replace(/\\/g, "/");

  const normalizedCategory =
    category === "." ? "" : category;

  const text = jsonToText(data);

  return {
    id: `${source}:${relativePath}`,
    source,
    fileName,
    category:
      normalizedCategory ||
      fileName.replace(/\.json$/i, ""),
    data,
    text,
  };
}

function loadSource(
  source: TrainingSource
): {
  documents: TrainingDocument[];
  errors: string[];
} {
  const directory = getDirectory(source);

  const files = recursivelyFindJsonFiles(directory);

  const documents: TrainingDocument[] = [];
  const errors: string[] = [];

  for (const filePath of files) {
    try {
      const data = safeReadJson(filePath);

      documents.push(
        createDocument(
          source,
          filePath,
          data
        )
      );
    } catch (error) {
      errors.push(
        `${filePath}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }
  }

  return {
    documents,
    errors,
  };
}

export function loadTrainingDocuments(
  forceRefresh = false
): LoadResult {
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedDocuments &&
    now - cachedAt < CACHE_TTL_MS
  ) {
    return {
      documents: cachedDocuments,
      errors: [],
    };
  }

  const training = loadSource("training");
  const knowledge = loadSource("knowledge");

  const documents = [
    ...training.documents,
    ...knowledge.documents,
  ];

  cachedDocuments = documents;
  cachedAt = now;

  return {
    documents,
    errors: [
      ...training.errors,
      ...knowledge.errors,
    ],
  };
}

export function clearTrainingCache(): void {
  cachedDocuments = null;
  cachedAt = 0;
}

export function getTrainingDirectories(): {
  projectRoot: string;
  trainingDirectory: string;
  knowledgeDirectory: string;
} {
  const projectRoot = getProjectRoot();

  return {
    projectRoot,
    trainingDirectory: path.join(
      projectRoot,
      "training"
    ),
    knowledgeDirectory: path.join(
      projectRoot,
      "knowledge"
    ),
  };
}