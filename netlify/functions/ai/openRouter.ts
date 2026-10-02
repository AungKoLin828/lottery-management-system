/*
 * ============================================================
 * OPENROUTER AI CLIENT
 * ============================================================
 *
 * Server-side OpenRouter integration for Netlify Functions.
 *
 * Features:
 *
 * 1. Dynamic OpenRouter model discovery
 * 2. No hard-coded AI model environment variables required
 * 3. Free-model filtering
 * 4. Preferred-model scoring
 * 5. Maximum 3 models per OpenRouter request
 * 6. openrouter/free universal fallback
 * 7. Model-list caching
 * 8. Cache refresh after model failure
 * 9. Request timeout
 * 10. 429 / provider failure handling
 * 11. Tool/function calling support
 * 12. Backward-compatible callOpenRouter()
 * 13. generateOpenRouterResponse() export used by support.ts
 *
 * IMPORTANT:
 *
 * This file is for Netlify/server-side execution only.
 *
 * Do NOT use:
 *   window
 *   localStorage
 *   import.meta.env
 *   VITE_OPENROUTER_API_KEY
 *
 * The API key must remain in:
 *
 *   OPENROUTER_API_KEY
 *
 * Netlify environment variables.
 * ============================================================
 */

/* ============================================================
   CONSTANTS
============================================================ */

const OPENROUTER_MODELS_URL =
  "https://openrouter.ai/api/v1/models";

const OPENROUTER_CHAT_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/*
 * OpenRouter's universal free router.
 *
 * This is intentionally kept as the final fallback.
 */
export const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

/*
 * Maximum number of models sent in a single request.
 *
 * We use:
 *
 *   1 primary model
 *   2 fallback models
 *
 * Total = 3
 */
export const MAX_MODELS_PER_REQUEST = 3;

/*
 * OpenRouter request timeout.
 *
 * 20 seconds is suitable for Netlify serverless execution
 * while preventing a permanently hanging request.
 */
export const OPENROUTER_TIMEOUT_MS = 20_000;

/*
 * Model discovery cache lifetime.
 *
 * 10 minutes.
 */
const MODEL_CACHE_TTL_MS =
  10 * 60 * 1000;

/*
 * Maximum number of history messages accepted by this layer.
 */
const MAX_MESSAGES = 20;

/*
 * Maximum content length sent to OpenRouter for one message.
 */
const MAX_MESSAGE_CONTENT_LENGTH =
  8_000;

/* ============================================================
   PREFERRED MODEL FAMILIES
============================================================ */

const PREFERRED_MODEL_PREFIXES = [
  "google/gemma",
  "google/gemini",
  "meta-llama/",
  "qwen/",
  "mistralai/",
  "deepseek/",
  "nvidia/",
];

/* ============================================================
   TYPES
============================================================ */

export type OpenRouterRole =
  | "system"
  | "user"
  | "assistant"
  | "tool";

export interface OpenRouterMessage {
  role: OpenRouterRole;

  content?:
    | string
    | null;

  name?: string;

  tool_call_id?: string;

  tool_calls?: OpenRouterToolCall[];
}

export interface OpenRouterToolCall {
  id: string;

  type: "function";

  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterToolDefinition {
  type: "function";

  function: {
    name: string;

    description?: string;

    parameters?: Record<
      string,
      unknown
    >;
  };
}

export interface OpenRouterModel {
  id: string;

  name?: string;

  description?: string;

  context_length?: number;

  pricing?: {
    prompt?: string;
    completion?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };

  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
    tokenizer?: string;
    instruct_type?: string | null;
  };

  supported_parameters?: string[];

  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };

  [key: string]: unknown;
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModel[];
}

interface OpenRouterErrorResponse {
  error?: {
    message?: string;
    code?: number | string;
    metadata?: unknown;
  };

  [key: string]: unknown;
}

interface OpenRouterChoiceMessage {
  role?: string;

  content?:
    | string
    | null;

  tool_calls?: OpenRouterToolCall[];
}

interface OpenRouterChoice {
  index?: number;

  message?: OpenRouterChoiceMessage;

  finish_reason?: string | null;
}

interface OpenRouterChatResponse {
  id?: string;

  model?: string;

  choices?: OpenRouterChoice[];

  error?: {
    message?: string;
    code?: number | string;
    metadata?: unknown;
  };

  [key: string]: unknown;
}

/*
 * Public result returned to support.ts.
 */
export interface OpenRouterResponse {
  content: string;

  toolCalls: OpenRouterToolCall[];

  model: string | null;

  finishReason: string | null;
}

/*
 * Optional configuration accepted by the public function.
 */
export interface OpenRouterRequestOptions {
  messages: OpenRouterMessage[];

  tools?: OpenRouterToolDefinition[];

  temperature?: number;

  maxTokens?: number;
}

/*
 * Flexible input accepted by generateOpenRouterResponse().
 *
 * This allows compatibility with either:
 *
 * generateOpenRouterResponse(messages)
 *
 * or:
 *
 * generateOpenRouterResponse(messages, tools)
 *
 * or:
 *
 * generateOpenRouterResponse({
 *   messages,
 *   tools
 * })
 */
export type GenerateOpenRouterInput =
  | OpenRouterMessage[]
  | OpenRouterRequestOptions;

/* ============================================================
   MODEL CACHE
============================================================ */

let modelCache:
  | OpenRouterModel[]
  | null = null;

let modelCacheTimestamp = 0;

/* ============================================================
   ERROR CLASS
============================================================ */

export class OpenRouterError extends Error {
  public readonly statusCode: number | null;

  public readonly retryable: boolean;

  public readonly code:
    | string
    | number
    | null;

  constructor(
    message: string,
    options?: {
      statusCode?: number | null;

      retryable?: boolean;

      code?: string | number | null;
    },
  ) {
    super(message);

    this.name =
      "OpenRouterError";

    this.statusCode =
      options?.statusCode ??
      null;

    this.retryable =
      options?.retryable ??
      true;

    this.code =
      options?.code ??
      null;

    Object.setPrototypeOf(
      this,
      OpenRouterError.prototype,
    );
  }
}

/* ============================================================
   API KEY
============================================================ */

function getOpenRouterApiKey(): string {
  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not configured.",
      {
        statusCode: 500,
        retryable: false,
        code: "MISSING_API_KEY",
      },
    );
  }

  return apiKey;
}

/* ============================================================
   PUBLIC SITE URL
============================================================ */

function getPublicSiteUrl(): string {
  const configured =
    process.env.PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured;
  }

  return "https://lottery-play-testing.netlify.app";
}

/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = OPENROUTER_TIMEOUT_MS,
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout =
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
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new OpenRouterError(
        "OpenRouter request timed out.",
        {
          statusCode: 408,
          retryable: true,
          code: "TIMEOUT",
        },
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/* ============================================================
   RESPONSE JSON
============================================================ */

async function readJsonSafe(
  response: Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/* ============================================================
   MODEL FREE CHECK
============================================================ */

function isFreeModel(
  model: OpenRouterModel,
): boolean {
  /*
   * OpenRouter model pricing is normally represented
   * as strings.
   *
   * Free models generally expose:
   *
   *   "0"
   *
   * for prompt/completion pricing.
   */

  const promptPrice =
    model.pricing?.prompt;

  const completionPrice =
    model.pricing?.completion;

  if (
    promptPrice === "0" &&
    completionPrice === "0"
  ) {
    return true;
  }

  /*
   * Some OpenRouter responses represent free models
   * directly using :free.
   */

  if (
    model.id
      .toLowerCase()
      .endsWith(":free")
  ) {
    return true;
  }

  /*
   * Do not assume an arbitrary missing pricing
   * object is free.
   */
  return false;
}

/* ============================================================
   MODEL SCORING
============================================================ */

function scoreModel(
  model: OpenRouterModel,
): number {
  let score = 0;

  const id =
    model.id.toLowerCase();

  /*
   * Strong preference for known families.
   */
  for (
    let index = 0;
    index <
    PREFERRED_MODEL_PREFIXES.length;
    index += 1
  ) {
    const prefix =
      PREFERRED_MODEL_PREFIXES[index];

    if (id.startsWith(prefix)) {
      score +=
        100 -
        index * 8;

      break;
    }
  }

  /*
   * Prefer explicit :free models.
   */
  if (
    id.endsWith(":free")
  ) {
    score += 25;
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
    32_768
  ) {
    score += 30;
  } else if (
    contextLength >=
    16_384
  ) {
    score += 20;
  } else if (
    contextLength >=
    8_192
  ) {
    score += 10;
  }

  /*
   * Prefer models that advertise tool support.
   */
  const supportedParameters =
    Array.isArray(
      model.supported_parameters,
    )
      ? model.supported_parameters
      : [];

  if (
    supportedParameters.includes(
      "tools",
    )
  ) {
    score += 25;
  }

  if (
    supportedParameters.includes(
      "tool_choice",
    )
  ) {
    score += 10;
  }

  /*
   * Penalize suspicious/very small context models.
   */
  if (
    contextLength > 0 &&
    contextLength < 4_096
  ) {
    score -= 20;
  }

  return score;
}

/* ============================================================
   DEDUPLICATE
============================================================ */

function deduplicateModels(
  models: OpenRouterModel[],
): OpenRouterModel[] {
  const seen =
    new Set<string>();

  const result:
    OpenRouterModel[] = [];

  for (const model of models) {
    if (
      !model ||
      typeof model.id !==
        "string"
    ) {
      continue;
    }

    const id =
      model.id.trim();

    if (!id) {
      continue;
    }

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);

    result.push({
      ...model,
      id,
    });
  }

  return result;
}

/* ============================================================
   FETCH AVAILABLE MODELS
============================================================ */

async function fetchAvailableModels(
  apiKey: string,
): Promise<OpenRouterModel[]> {
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

          "HTTP-Referer":
            getPublicSiteUrl(),

          "X-Title":
            "Lottery Management System AI Support",
        },
      },
    );

  const raw =
    await readJsonSafe(
      response,
    );

  if (!response.ok) {
    const data =
      raw as OpenRouterErrorResponse | null;

    const message =
      data?.error?.message ||
      `OpenRouter model discovery failed with status ${response.status}.`;

    throw new OpenRouterError(
      message,
      {
        statusCode:
          response.status,

        retryable:
          response.status ===
            429 ||
          response.status >=
            500,

        code:
          data?.error?.code ??
          "MODEL_DISCOVERY_FAILED",
      },
    );
  }

  const data =
    raw as OpenRouterModelsResponse | null;

  if (
    !Array.isArray(
      data?.data,
    )
  ) {
    return [];
  }

  return deduplicateModels(
    data.data,
  );
}

/* ============================================================
   DISCOVER FREE MODELS
============================================================ */

export async function getAvailableModels(
  apiKey?: string,
): Promise<OpenRouterModel[]> {
  const key =
    apiKey?.trim() ||
    getOpenRouterApiKey();

  const now =
    Date.now();

  if (
    modelCache &&
    now -
      modelCacheTimestamp <
      MODEL_CACHE_TTL_MS
  ) {
    return [
      ...modelCache,
    ];
  }

  const models =
    await fetchAvailableModels(
      key,
    );

  const freeModels =
    models.filter(
      isFreeModel,
    );

  const sorted =
    freeModels.sort(
      (a, b) =>
        scoreModel(b) -
        scoreModel(a),
    );

  modelCache =
    sorted;

  modelCacheTimestamp =
    now;

  return [
    ...sorted,
  ];
}

/* ============================================================
   CLEAR MODEL CACHE
============================================================ */

export function clearModelCache(): void {
  modelCache = null;

  modelCacheTimestamp = 0;
}

/* ============================================================
   BUILD REQUEST MODEL LIST
============================================================ */

function buildRequestModels(
  models: OpenRouterModel[],
): OpenRouterModel[] {
  const result:
    OpenRouterModel[] = [];

  const seen =
    new Set<string>();

  /*
   * Only the first 3 discovered models are used.
   */
  for (const model of models) {
    if (
      result.length >=
      MAX_MODELS_PER_REQUEST
    ) {
      break;
    }

    if (
      !model.id ||
      seen.has(model.id)
    ) {
      continue;
    }

    seen.add(model.id);

    result.push(model);
  }

  return result;
}

/* ============================================================
   NORMALIZE MESSAGES
============================================================ */

function normalizeMessages(
  messages: OpenRouterMessage[],
): OpenRouterMessage[] {
  if (
    !Array.isArray(
      messages,
    )
  ) {
    return [];
  }

  return messages
    .slice(-MAX_MESSAGES)
    .map(
      (message) => {
        const normalized: OpenRouterMessage =
          {
            role:
              message.role,
          };

        if (
          typeof message.content ===
          "string"
        ) {
          normalized.content =
            message.content.slice(
              0,
              MAX_MESSAGE_CONTENT_LENGTH,
            );
        } else {
          normalized.content =
            message.content ??
            null;
        }

        if (
          message.name
        ) {
          normalized.name =
            message.name;
        }

        if (
          message.tool_call_id
        ) {
          normalized.tool_call_id =
            message.tool_call_id;
        }

        if (
          Array.isArray(
            message.tool_calls,
          )
        ) {
          normalized.tool_calls =
            message.tool_calls;
        }

        return normalized;
      },
    );
}

/* ============================================================
   REQUEST COMPLETION
============================================================ */

async function requestCompletion(
  apiKey: string,
  messages: OpenRouterMessage[],
  models: OpenRouterModel[],
  options?: {
    tools?: OpenRouterToolDefinition[];

    temperature?: number;

    maxTokens?: number;
  },
): Promise<OpenRouterResponse> {
  if (
    models.length === 0
  ) {
    throw new OpenRouterError(
      "No OpenRouter models are available.",
      {
        statusCode: 503,
        retryable: true,
        code: "NO_MODELS",
      },
    );
  }

  /*
   * The first model is the primary model.
   */
  const primaryModel =
    models[0].id;

  /*
   * Remaining models are OpenRouter fallbacks.
   */
  const fallbackModels =
    models
      .slice(
        1,
        MAX_MODELS_PER_REQUEST,
      )
      .map(
        (model) =>
          model.id,
      );

  const body: Record<
    string,
    unknown
  > = {
    model:
      primaryModel,

    messages:
      normalizeMessages(
        messages,
      ),

    temperature:
      options?.temperature ??
      0.2,

    max_tokens:
      options?.maxTokens ??
      700,
  };

  /*
   * OpenRouter model fallback list.
   */
  if (
    fallbackModels.length >
    0
  ) {
    body.models =
      fallbackModels;
  }

  /*
   * Only include tools when tools actually exist.
   */
  if (
    Array.isArray(
      options?.tools,
    ) &&
    options.tools.length >
      0
  ) {
    body.tools =
      options.tools;

    body.tool_choice =
      "auto";
  }

  const response =
    await fetchWithTimeout(
      OPENROUTER_CHAT_URL,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "HTTP-Referer":
            getPublicSiteUrl(),

          "X-Title":
            "Lottery Management System AI Support",
        },

        body:
          JSON.stringify(body),
      },
    );

  const raw =
    await readJsonSafe(
      response,
    );

  const data =
    raw as OpenRouterChatResponse | null;

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `OpenRouter request failed with status ${response.status}.`;

    throw new OpenRouterError(
      message,
      {
        statusCode:
          response.status,

        retryable:
          response.status ===
            408 ||
          response.status ===
            429 ||
          response.status >=
            500,

        code:
          data?.error?.code ??
          `HTTP_${response.status}`,
      },
    );
  }

  const choice =
    data?.choices?.[0];

  if (!choice) {
    throw new OpenRouterError(
      "OpenRouter returned no completion choice.",
      {
        statusCode: 502,
        retryable: true,
        code: "EMPTY_CHOICES",
      },
    );
  }

  const message =
    choice.message;

  const content =
    typeof message?.content ===
    "string"
      ? message.content.trim()
      : "";

  const toolCalls =
    Array.isArray(
      message?.tool_calls,
    )
      ? message.tool_calls
      : [];

  /*
   * A tool call may intentionally have empty content.
   *
   * Therefore an empty content string is valid when
   * toolCalls exist.
   */
  if (
    !content &&
    toolCalls.length ===
      0
  ) {
    throw new OpenRouterError(
      "OpenRouter returned an empty response.",
      {
        statusCode: 502,
        retryable: true,
        code: "EMPTY_RESPONSE",
      },
    );
  }

  return {
    content,

    toolCalls,

    model:
      data?.model ??
      primaryModel,

    finishReason:
      choice.finish_reason ??
      null,
  };
}

/* ============================================================
   REQUEST ONE MODEL CHAIN
============================================================ */

async function requestModelChain(
  apiKey: string,
  messages: OpenRouterMessage[],
  models: OpenRouterModel[],
  options?: {
    tools?: OpenRouterToolDefinition[];

    temperature?: number;

    maxTokens?: number;
  },
): Promise<OpenRouterResponse> {
  return requestCompletion(
    apiKey,
    messages,
    models,
    options,
  );
}

/* ============================================================
   DYNAMIC OPENROUTER REQUEST
============================================================ */

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  tools?: OpenRouterToolDefinition[],
  options?: {
    temperature?: number;

    maxTokens?: number;
  },
): Promise<OpenRouterResponse> {
  const apiKey =
    getOpenRouterApiKey();

  const requestOptions = {
    tools,

    temperature:
      options?.temperature ??
      0.2,

    maxTokens:
      options?.maxTokens ??
      700,
  };

  /*
   * ==========================================================
   * STEP 1
   *
   * Discover current free models.
   * ==========================================================
   */

  let availableModels:
    OpenRouterModel[] = [];

  try {
    availableModels =
      await getAvailableModels(
        apiKey,
      );
  } catch (error) {
    console.warn(
      "OpenRouter model discovery failed:",
      error,
    );

    /*
     * Discovery failure must not immediately prevent
     * the universal free router from being tried.
     */
    availableModels = [];
  }

  /*
   * ==========================================================
   * STEP 2
   *
   * Build dynamic request models.
   * ==========================================================
   */

  let requestModels =
    buildRequestModels(
      availableModels,
    );

  /*
   * ==========================================================
   * STEP 3
   *
   * Always keep openrouter/free as the final fallback.
   *
   * IMPORTANT:
   *
   * Do not exceed the maximum 3 models.
   *
   * If we have:
   *
   *   model A
   *   model B
   *   model C
   *
   * we send:
   *
   *   A
   *   B
   *   C
   *
   * We do NOT add a fourth model.
   *
   * If fewer than 3 discovered models exist, we can append
   * openrouter/free.
   * ==========================================================
   */

  const universalModel: OpenRouterModel = {
    id:
      UNIVERSAL_FREE_MODEL,
  };

  if (
    requestModels.length <
    MAX_MODELS_PER_REQUEST
  ) {
    const alreadyIncluded =
      requestModels.some(
        (model) =>
          model.id ===
          UNIVERSAL_FREE_MODEL,
      );

    if (!alreadyIncluded) {
      requestModels = [
        ...requestModels,
        universalModel,
      ];
    }
  }

  /*
   * If model discovery returned nothing,
   * use the universal free router.
   */
  if (
    requestModels.length ===
    0
  ) {
    requestModels = [
      universalModel,
    ];
  }

  /*
   * ==========================================================
   * STEP 4
   *
   * First request.
   * ==========================================================
   */

  try {
    return await requestModelChain(
      apiKey,
      messages,
      requestModels,
      requestOptions,
    );
  } catch (firstError) {
    console.warn(
      "OpenRouter dynamic model request failed:",
      firstError,
    );

    /*
     * ========================================================
     * STEP 5
     *
     * Clear model cache.
     *
     * Model availability can change between:
     *
     * GET /models
     *
     * and:
     *
     * POST /chat/completions
     * ========================================================
     */

    clearModelCache();

    /*
     * ========================================================
     * STEP 6
     *
     * Refresh model list.
     * ========================================================
     */

    let refreshedModels:
      OpenRouterModel[] = [];

    try {
      refreshedModels =
        await getAvailableModels(
          apiKey,
        );
    } catch (refreshError) {
      console.warn(
        "OpenRouter model refresh failed:",
        refreshError,
      );

      refreshedModels = [];
    }

    let refreshedRequestModels =
      buildRequestModels(
        refreshedModels,
      );

    /*
     * Add universal free router when there is room.
     */
    if (
      refreshedRequestModels.length <
      MAX_MODELS_PER_REQUEST
    ) {
      const alreadyIncluded =
        refreshedRequestModels.some(
          (model) =>
            model.id ===
            UNIVERSAL_FREE_MODEL,
        );

      if (!alreadyIncluded) {
        refreshedRequestModels = [
          ...refreshedRequestModels,
          universalModel,
        ];
      }
    }

    if (
      refreshedRequestModels.length ===
      0
    ) {
      refreshedRequestModels = [
        universalModel,
      ];
    }

    /*
     * ========================================================
     * STEP 7
     *
     * Retry with refreshed models.
     * ========================================================
     */

    try {
      return await requestModelChain(
        apiKey,
        messages,
        refreshedRequestModels,
        requestOptions,
      );
    } catch (secondError) {
      console.warn(
        "OpenRouter refreshed model request failed:",
        secondError,
      );

      /*
       * ======================================================
       * STEP 8
       *
       * Final direct openrouter/free request.
       *
       * This guarantees that a stale model list cannot prevent
       * the universal free router from being attempted.
       * ======================================================
       */

      return requestCompletion(
        apiKey,
        messages,
        [
          universalModel,
        ],
        requestOptions,
      );
    }
  }
}

/* ============================================================
   generateOpenRouterResponse
============================================================ */

/*
 * IMPORTANT:
 *
 * support.ts currently imports:
 *
 *   generateOpenRouterResponse
 *
 * Therefore this function MUST be exported.
 *
 * It delegates to the same dynamic model-selection engine
 * used by callOpenRouter().
 */
export async function generateOpenRouterResponse(
  input:
    | OpenRouterMessage[]
    | OpenRouterRequestOptions,
  tools?: OpenRouterToolDefinition[],
): Promise<OpenRouterResponse> {
  /*
   * Support both calling styles:
   *
   * generateOpenRouterResponse(messages, tools)
   *
   * and:
   *
   * generateOpenRouterResponse({
   *   messages,
   *   tools,
   * })
   */

  if (
    Array.isArray(input)
  ) {
    return callOpenRouter(
      input,
      tools,
    );
  }

  return callOpenRouter(
    input.messages,
    input.tools,
    {
      temperature:
        input.temperature,

      maxTokens:
        input.maxTokens,
    },
  );
}

/* ============================================================
   SIMPLE TEXT HELPER
============================================================ */

/*
 * This helper is useful for code that only needs the textual
 * answer and does not need tool-call metadata.
 */
export async function generateOpenRouterText(
  messages: OpenRouterMessage[],
  tools?: OpenRouterToolDefinition[],
): Promise<string> {
  const response =
    await callOpenRouter(
      messages,
      tools,
    );

  return response.content;
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

export default callOpenRouter;
