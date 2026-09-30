const OPENROUTER_MODELS_URL =
  "https://openrouter.ai/api/v1/models";

const MODEL_CACHE_TTL_MS =
  10 * 60 * 1000; // 10 minutes

interface OpenRouterModel {
  id?: string;

  name?: string;

  pricing?: {
    prompt?: string | number;
    completion?: string | number;
  };

  architecture?: {
    modality?: string;

    input_modalities?: string[];

    output_modalities?: string[];
  };

  context_length?: number;
}

interface ModelsResponse {
  data?: OpenRouterModel[];

  error?: {
    message?: string;
  };
}

let cachedModels:
  | OpenRouterModel[]
  | null = null;

let cacheTimestamp = 0;

/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10_000,
): Promise<Response> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () => controller.abort(),
      timeout,
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,
      },
    );
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

/* ============================================================
   GET AVAILABLE MODELS
============================================================ */

export async function getAvailableModels(
  apiKey: string,
): Promise<OpenRouterModel[]> {
  const now =
    Date.now();

  if (
    cachedModels &&
    now - cacheTimestamp <
      MODEL_CACHE_TTL_MS
  ) {
    return cachedModels;
  }

  const response =
    await fetchWithTimeout(
      OPENROUTER_MODELS_URL,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          Accept:
            "application/json",
        },
      },
      10_000,
    );

  const raw =
    await response.text();

  let data:
    | ModelsResponse
    | null = null;

  try {
    data =
      JSON.parse(
        raw,
      ) as ModelsResponse;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `OpenRouter model discovery failed (${response.status})`,
    );
  }

  if (
    !data ||
    !Array.isArray(data.data)
  ) {
    throw new Error(
      "OpenRouter returned an invalid model list",
    );
  }

  cachedModels =
    data.data;

  cacheTimestamp =
    now;

  return cachedModels;
}

/* ============================================================
   CLEAR MODEL CACHE
============================================================ */

export function clearModelCache(): void {
  cachedModels =
    null;

  cacheTimestamp =
    0;
}