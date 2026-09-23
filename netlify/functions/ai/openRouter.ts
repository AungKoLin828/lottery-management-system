const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/* ============================================================
   CONFIG
============================================================ */

const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

const MAX_MODELS_PER_REQUEST = 3;

const REQUEST_TIMEOUT_MS = 25_000;

/* ============================================================
   TYPES
============================================================ */

export interface OpenRouterToolCall {
  id: string;

  type: "function";

  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterMessage {
  role:
    | "system"
    | "user"
    | "assistant"
    | "tool";

  content?: string | null;

  tool_calls?: OpenRouterToolCall[];

  tool_call_id?: string;

  name?: string;
}

export interface OpenRouterResponse {
  id?: string;

  model?: string;

  choices?: Array<{
    index?: number;

    message?: {
      role?: string;

      content?: string | null;

      tool_calls?: OpenRouterToolCall[];
    };

    finish_reason?: string | null;
  }>;

  usage?: {
    prompt_tokens?: number;

    completion_tokens?: number;

    total_tokens?: number;
  };

  error?: {
    message?: string;

    type?: string;

    code?: string | number;
  };
}

/* ============================================================
   OPENROUTER MODEL
============================================================ */

interface OpenRouterModel {
  id: string;

  name?: string;

  context_length?: number;

  pricing?: {
    prompt?: string | number;

    completion?: string | number;
  };

  architecture?: {
    modality?: string;

    input_modalities?: string[];

    output_modalities?: string[];
  };

  supported_parameters?: string[];
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModel[];
}

/* ============================================================
   MODEL DISCOVERY CACHE
============================================================ */

/*
 * Cache discovered models for 10 minutes.
 *
 * This means we do NOT call /models on every AI message.
 */
let cachedModels:
  | OpenRouterModel[]
  | null = null;

let cacheTimestamp = 0;

const MODEL_CACHE_TTL =
  10 * 60 * 1000;

/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

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
    clearTimeout(timeoutId);
  }
}

/* ============================================================
   GET AVAILABLE MODELS
============================================================ */

async function getAvailableModels(
  apiKey: string,
  forceRefresh = false,
): Promise<OpenRouterModel[]> {
  const now =
    Date.now();

  /*
   * Use cached models when possible.
   */
  if (
    !forceRefresh &&
    cachedModels &&
    now - cacheTimestamp <
      MODEL_CACHE_TTL
  ) {
    return cachedModels;
  }

  const response =
    await fetchWithTimeout(
      "https://openrouter.ai/api/v1/models",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          Accept:
            "application/json",
        },
      },
      15_000,
    );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenRouter model discovery failed (${response.status}): ${text.slice(
        0,
        500,
      )}`,
    );
  }

  let data:
    | OpenRouterModelsResponse;

  try {
    data =
      JSON.parse(
        text,
      ) as OpenRouterModelsResponse;
  } catch {
    throw new Error(
      "OpenRouter returned invalid model discovery data",
    );
  }

  const models =
    Array.isArray(
      data.data,
    )
      ? data.data.filter(
          (model) =>
            model &&
            typeof model.id ===
              "string" &&
            model.id.trim(),
        )
      : [];

  cachedModels =
    models;

  cacheTimestamp =
    Date.now();

  return models;
}

/* ============================================================
   CLEAR MODEL CACHE
============================================================ */

function clearModelCache(): void {
  cachedModels = null;

  cacheTimestamp = 0;
}

/* ============================================================
   CHECK FREE MODEL
============================================================ */

function isFreeModel(
  model: OpenRouterModel,
): boolean {
  const id =
    model.id
      .toLowerCase()
      .trim();

  /*
   * Explicit :free model.
   */
  if (
    id.endsWith(":free")
  ) {
    return true;
  }

  /*
   * Some OpenRouter model metadata can expose
   * zero pricing instead.
   */
  const promptPrice =
    Number(
      model.pricing?.prompt ??
        0,
    );

  const completionPrice =
    Number(
      model.pricing?.completion ??
        0,
    );

  return (
    promptPrice === 0 &&
    completionPrice === 0
  );
}

/* ============================================================
   CHECK TEXT MODEL
============================================================ */

function supportsTextOutput(
  model: OpenRouterModel,
): boolean {
  const architecture =
    model.architecture;

  /*
   * If metadata is missing, don't reject the model.
   */
  if (!architecture) {
    return true;
  }

  const outputModalities =
    architecture.output_modalities;

  if (
    Array.isArray(
      outputModalities,
    ) &&
    outputModalities.length > 0
  ) {
    return outputModalities.some(
      (modality) =>
        String(
          modality,
        ).toLowerCase() ===
        "text",
    );
  }

  const modality =
    architecture.modality;

  if (
    typeof modality ===
    "string"
  ) {
    return modality
      .toLowerCase()
      .split("->")
      .some((part) =>
        part.includes(
          "text",
        ),
      );
  }

  return true;
}

/* ============================================================
   MODEL SCORING
============================================================ */

/*
 * We don't specify versions here.
 *
 * We only express broad preferences.
 *
 * Therefore:
 *
 * google/gemma-ANY-VERSION:free
 *
 * can be selected automatically.
 */
const PREFERRED_PROVIDERS = [
  "google/",
  "meta-llama/",
  "qwen/",
  "mistralai/",
  "deepseek/",
  "nvidia/",
];

/**
 * Score a currently available model.
 */
function getModelScore(
  model: OpenRouterModel,
): number {
  const id =
    model.id.toLowerCase();

  let score = 0;

  /*
   * Explicit free model.
   */
  if (
    id.endsWith(":free")
  ) {
    score += 100;
  }

  /*
   * Provider preference.
   *
   * This does NOT include model versions.
   */
  for (
    let index = 0;
    index <
    PREFERRED_PROVIDERS.length;
    index += 1
  ) {
    const provider =
      PREFERRED_PROVIDERS[
        index
      ];

    if (
      id.startsWith(
        provider,
      )
    ) {
      score +=
        80 -
        index * 5;

      break;
    }
  }

  /*
   * Prefer larger context windows.
   */
  const contextLength =
    Number(
      model.context_length ??
        0,
    );

  if (
    contextLength >=
    32768
  ) {
    score += 30;
  } else if (
    contextLength >=
    16384
  ) {
    score += 20;
  } else if (
    contextLength >=
    8192
  ) {
    score += 10;
  }

  return score;
}

/* ============================================================
   SELECT CURRENT FREE MODELS
============================================================ */

function selectModels(
  models: OpenRouterModel[],
): OpenRouterModel[] {
  /*
   * Only use currently available free text models.
   */
  const candidates =
    models.filter(
      (model) =>
        isFreeModel(
          model,
        ) &&
        supportsTextOutput(
          model,
        ),
    );

  /*
   * Remove duplicates.
   */
  const unique =
    Array.from(
      new Map(
        candidates.map(
          (model) => [
            model.id,
            model,
          ],
        ),
      ).values(),
    );

  /*
   * Sort using provider/context preferences.
   *
   * NO VERSION IS SPECIFIED.
   */
  unique.sort(
    (a, b) => {
      const scoreA =
        getModelScore(a);

      const scoreB =
        getModelScore(b);

      if (
        scoreA !==
        scoreB
      ) {
        return (
          scoreB -
          scoreA
        );
      }

      return (
        Number(
          b.context_length ??
            0,
        ) -
        Number(
          a.context_length ??
            0,
        )
      );
    },
  );

  /*
   * OpenRouter currently receives at most 3 models.
   */
  return unique.slice(
    0,
    MAX_MODELS_PER_REQUEST,
  );
}

/* ============================================================
   BUILD REQUEST
============================================================ */

function buildRequestBody(
  model: string,
  messages: OpenRouterMessage[],
  tools?: unknown[],
): Record<string, unknown> {
  const body: Record<
    string,
    unknown
  > = {
    model,

    messages,

    temperature: 0.2,

    max_tokens: 700,
  };

  /*
   * Only include tools when actually provided.
   */
  if (
    Array.isArray(tools) &&
    tools.length > 0
  ) {
    body.tools =
      tools;

    body.tool_choice =
      "auto";
  }

  return body;
}

/* ============================================================
   REQUEST ONE MODEL
============================================================ */

async function requestModel(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  tools?: unknown[],
): Promise<OpenRouterResponse> {
  const response =
    await fetchWithTimeout(
      OPENROUTER_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            process.env.PUBLIC_SITE_URL ??
            process.env.URL ??
            "",

          "X-Title":
            "Lottery Management System AI Support",
        },

        body: JSON.stringify(
          buildRequestBody(
            model,
            messages,
            tools,
          ),
        ),
      },
      REQUEST_TIMEOUT_MS,
    );

  const text =
    await response.text();

  if (!response.ok) {
    let message =
      text;

    try {
      const parsed =
        JSON.parse(
          text,
        );

      message =
        parsed?.error
          ?.message ||
        parsed?.message ||
        text;
    } catch {
      // Keep text response.
    }

    throw new Error(
      `OpenRouter ${response.status}: ${String(
        message,
      ).slice(0, 500)}`,
    );
  }

  let data:
    | OpenRouterResponse;

  try {
    data =
      JSON.parse(
        text,
      ) as OpenRouterResponse;
  } catch {
    throw new Error(
      "OpenRouter returned invalid JSON",
    );
  }

  /*
   * API-level error.
   */
  if (data.error) {
    throw new Error(
      data.error.message ||
        "OpenRouter returned an API error",
    );
  }

  /*
   * Validate choices.
   */
  if (
    !Array.isArray(
      data.choices,
    ) ||
    data.choices.length === 0
  ) {
    throw new Error(
      "OpenRouter returned no choices",
    );
  }

  /*
   * Tool calls may have null content.
   *
   * Therefore don't reject a valid tool-call response.
   */
  const message =
    data.choices[0]
      ?.message;

  if (!message) {
    throw new Error(
      "OpenRouter returned no message",
    );
  }

  const hasContent =
    typeof message.content ===
      "string" &&
    message.content.trim()
      .length > 0;

  const hasToolCalls =
    Array.isArray(
      message.tool_calls,
    ) &&
    message.tool_calls.length >
      0;

  if (
    !hasContent &&
    !hasToolCalls
  ) {
    throw new Error(
      "OpenRouter returned an empty response",
    );
  }

  return data;
}

/* ============================================================
   MAIN FUNCTION
============================================================ */

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  tools?: unknown[],
): Promise<OpenRouterResponse> {
  /* ==========================================================
     API KEY
  ========================================================== */

  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured",
    );
  }

  /* ==========================================================
     VALIDATE MESSAGES
  ========================================================== */

  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    throw new Error(
      "OpenRouter requires at least one message",
    );
  }

  /* ==========================================================
     DISCOVER CURRENT MODELS
  ========================================================== */

  let availableModels: OpenRouterModel[] =
    [];

  try {
    availableModels =
      await getAvailableModels(
        apiKey,
        false,
      );
  } catch (error) {
    console.warn(
      "[AI] Model discovery failed:",
      error,
    );
  }

  /* ==========================================================
     SELECT CURRENT MODELS
  ========================================================== */

  let selectedModels =
    selectModels(
      availableModels,
    );

  console.log(
    "[AI] Current free models selected:",
    selectedModels.map(
      (model) =>
        model.id,
    ),
  );

  /* ==========================================================
     IF NO MODEL DISCOVERED
  ========================================================== */

  if (
    selectedModels.length ===
    0
  ) {
    console.warn(
      "[AI] No suitable free models discovered. Using openrouter/free.",
    );

    try {
      return await requestModel(
        apiKey,
        UNIVERSAL_FREE_MODEL,
        messages,
        tools,
      );
    } catch (error) {
      /*
       * Clear cache because the model/router may have
       * changed.
       */
      clearModelCache();

      throw error;
    }
  }

  /* ==========================================================
     TRY CURRENT MODELS
  ========================================================== */

  let lastError:
    | Error
    | null = null;

  for (
    const model of selectedModels
  ) {
    try {
      console.log(
        `[AI] Trying current model: ${model.id}`,
      );

      return await requestModel(
        apiKey,
        model.id,
        messages,
        tools,
      );
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(
              String(error),
            );

      console.warn(
        `[AI] Model failed: ${model.id}`,
        lastError.message,
      );
    }
  }

  /* ==========================================================
     REFRESH MODEL LIST
  ========================================================== */

  console.warn(
    "[AI] Current models failed. Refreshing OpenRouter model list.",
  );

  clearModelCache();

  try {
    availableModels =
      await getAvailableModels(
        apiKey,
        true,
      );
  } catch (error) {
    console.warn(
      "[AI] Model refresh failed:",
      error,
    );

    availableModels = [];
  }

  /* ==========================================================
     SELECT NEW CURRENT MODELS
  ========================================================== */

  selectedModels =
    selectModels(
      availableModels,
    );

  console.log(
    "[AI] Refreshed free models:",
    selectedModels.map(
      (model) =>
        model.id,
    ),
  );

  /*
   * Try refreshed models.
   *
   * These may be completely different versions from
   * the previous request.
   */
  for (
    const model of selectedModels
  ) {
    try {
      console.log(
        `[AI] Trying refreshed model: ${model.id}`,
      );

      return await requestModel(
        apiKey,
        model.id,
        messages,
        tools,
      );
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(
              String(error),
            );

      console.warn(
        `[AI] Refreshed model failed: ${model.id}`,
        lastError.message,
      );
    }
  }

  /* ==========================================================
     FINAL UNIVERSAL FREE FALLBACK
  ========================================================== */

  console.warn(
    "[AI] All discovered models failed. Trying openrouter/free.",
  );

  try {
    return await requestModel(
      apiKey,
      UNIVERSAL_FREE_MODEL,
      messages,
      tools,
    );
  } catch (fallbackError) {
    const finalError =
      fallbackError instanceof
      Error
        ? fallbackError
        : new Error(
            String(
              fallbackError,
            ),
          );

    console.error(
      "[AI] openrouter/free also failed:",
      finalError.message,
    );

    if (lastError) {
      throw new Error(
        `All available free AI models failed. Last model error: ${lastError.message}. Universal free router error: ${finalError.message}`,
      );
    }

    throw finalError;
  }
}