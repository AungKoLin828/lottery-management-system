/**
 * ============================================================
 * OPENROUTER MODEL DISCOVERY
 * ============================================================
 */

import {
  OpenRouterModel,
} from "./openRouter";

const MODELS_URL =
  "https://openrouter.ai/api/v1/models";

const CACHE_TTL_MS =
  10 * 60 * 1000;

let modelCache:
  | OpenRouterModel[]
  | null = null;

let modelCacheAt = 0;

export async function getAvailableModels(): Promise<
  OpenRouterModel[]
> {
  const now = Date.now();

  if (
    modelCache &&
    now - modelCacheAt <
      CACHE_TTL_MS
  ) {
    return modelCache;
  }

  const response =
    await fetch(MODELS_URL, {
      method: "GET",

      headers: {
        Accept:
          "application/json",

        ...(process.env
          .OPENROUTER_API_KEY
          ? {
              Authorization:
                `Bearer ${process.env.OPENROUTER_API_KEY}`,
            }
          : {}),
      },
    });

  if (!response.ok) {
    throw new Error(
      `Failed to discover OpenRouter models: HTTP ${response.status}`
    );
  }

  const json =
    (await response.json()) as {
      data?: OpenRouterModel[];
    };

  const models =
    Array.isArray(json.data)
      ? json.data
      : [];

  modelCache = models;
  modelCacheAt = now;

  return models;
}

export function clearModelCache(): void {
  modelCache = null;
  modelCacheAt = 0;
}