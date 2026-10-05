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
 * 2. No hard-coded AI model environment variables
 * 3. Free-model filtering
 * 4. Preferred-model scoring
 * 5. Tool-capability filtering
 * 6. Maximum 3 models per request
 * 7. OpenRouter model fallback chain
 * 8. openrouter/free universal fallback
 * 9. Model-list caching
 * 10. Cache refresh after model failure
 * 11. Request timeout
 * 12. 429 / provider / 5xx handling
 * 13. Tool/function calling support
 * 14. Backward-compatible callOpenRouter()
 * 15. generateOpenRouterResponse()
 * 16. generateOpenRouterText()
 *
 * IMPORTANT:
 *
 * This file runs on Netlify/server-side only.
 *
 * NEVER use:
 *
 *   window
 *   localStorage
 *   import.meta.env
 *   VITE_OPENROUTER_API_KEY
 *
 * The API key must be:
 *
 *   OPENROUTER_API_KEY
 *
 * in Netlify environment variables.
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
 * This is the final safety fallback.
 *
 * OpenRouter/free dynamically selects an available free
 * model and can route according to the capabilities required
 * by the request.
 */
export const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

/*
 * Maximum number of model candidates sent in one request.
 *
 * IMPORTANT:
 *
 * These are TOTAL model candidates, not:
 *
 *   1 primary + 3 fallbacks.
 *
 * Maximum:
 *
 *   model A
 *   model B
 *   model C
 *
 * = 3 total.
 */
export const MAX_MODELS_PER_REQUEST = 3;

/*
 * Server-side request timeout.
 */
export const OPENROUTER_TIMEOUT_MS =
  5_000;

/*
 * Model discovery cache lifetime.
 */
const MODEL_CACHE_TTL_MS =
  10 * 60 * 1000;

/*
 * Maximum number of messages forwarded to OpenRouter.
 */
const MAX_MESSAGES = 20;

/*
 * Maximum content size of an individual message.
 */
const MAX_MESSAGE_CONTENT_LENGTH =
  8_000;


/* ============================================================
   PREFERRED MODEL FAMILIES
============================================================ */

/*
 * These are prefixes, NOT hard-coded model IDs.
 *
 * If a particular model disappears, another current model
 * from the same family can still be selected.
 */
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

  content?: string | null;

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

  message?: string;

  [key: string]: unknown;
}

interface OpenRouterChoiceMessage {
  role?: string;

  content?: string | null;

  tool_calls?: OpenRouterToolCall[];

  /*
   * Some provider responses may include an error
   * attached to the message/choice.
   */
  refusal?: string | null;
}

interface OpenRouterChoice {
  index?: number;

  message?: OpenRouterChoiceMessage;

  finish_reason?: string | null;

  error?: {
    message?: string;
    code?: number | string;
    metadata?: unknown;
  };
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


/* ============================================================
   PUBLIC RESPONSE
============================================================ */

export interface OpenRouterResponse {
  content: string;

  toolCalls: OpenRouterToolCall[];

  model: string | null;

  finishReason: string | null;
}


/* ============================================================
   PUBLIC REQUEST OPTIONS
============================================================ */

export interface OpenRouterRequestOptions {
  messages: OpenRouterMessage[];

  tools?: OpenRouterToolDefinition[];

  temperature?: number;

  maxTokens?: number;
}


/*
 * Supports:
 *
 * generateOpenRouterResponse(messages)
 *
 * generateOpenRouterResponse(messages, tools)
 *
 * generateOpenRouterResponse({
 *   messages,
 *   tools,
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

let modelCacheTimestamp =
  0;


/* ============================================================
   ERROR CLASS
============================================================ */

export class OpenRouterError extends Error {
  public readonly statusCode:
    | number
    | null;

  public readonly retryable:
    boolean;

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

  return (
    "https://lottery-play-testing.netlify.app"
  );
}


/* ============================================================
   FETCH WITH TIMEOUT
============================================================ */

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs =
    OPENROUTER_TIMEOUT_MS,
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

    if (
      error instanceof OpenRouterError
    ) {
      throw error;
    }

    throw new OpenRouterError(
      error instanceof Error
        ? error.message
        : "OpenRouter network request failed.",
      {
        statusCode: null,
        retryable: true,
        code: "NETWORK_ERROR",
      },
    );
  } finally {
    clearTimeout(timeout);
  }
}


/* ============================================================
   SAFE JSON
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
   FREE MODEL CHECK
============================================================ */

function isFreeModel(
  model: OpenRouterModel,
): boolean {
  const id =
    model.id
      .trim()
      .toLowerCase();

  /*
   * Explicit :free model variant.
   */
  if (
    id.endsWith(":free")
  ) {
    return true;
  }

  const promptPrice =
    model.pricing?.prompt;

  const completionPrice =
    model.pricing?.completion;

  /*
   * OpenRouter commonly represents free pricing
   * using "0".
   */
  if (
    promptPrice === "0" &&
    completionPrice === "0"
  ) {
    return true;
  }

  return false;
}


/* ============================================================
   TEXT OUTPUT CHECK
============================================================ */

function supportsTextOutput(
  model: OpenRouterModel,
): boolean {
  const outputModalities =
    model.architecture
      ?.output_modalities;

  /*
   * If OpenRouter does not expose modalities,
   * don't reject the model solely because metadata
   * is incomplete.
   */
  if (
    !Array.isArray(
      outputModalities,
    ) ||
    outputModalities.length === 0
  ) {
    return true;
  }

  return outputModalities.some(
    (value) =>
      value
        .toLowerCase()
        .includes("text"),
  );
}


/* ============================================================
   TOOL SUPPORT CHECK
============================================================ */

function supportsTools(
  model: OpenRouterModel,
): boolean {
  const supported =
    model.supported_parameters;

  if (
    !Array.isArray(
      supported,
    )
  ) {
    /*
     * Missing metadata should not automatically reject
     * the model. The universal free router remains available
     * as the capability-aware fallback.
     */
    return true;
  }

  return (
    supported.includes("tools") ||
    supported.includes("tool_choice")
  );
}


/* ============================================================
   MODEL SCORE
============================================================ */

function scoreModel(
  model: OpenRouterModel,
  requireTools: boolean,
): number {
  let score = 0;

  const id =
    model.id.toLowerCase();

  /*
   * Preferred model families.
   */
  for (
    let index = 0;
    index <
    PREFERRED_MODEL_PREFIXES.length;
    index += 1
  ) {
    const prefix =
      PREFERRED_MODEL_PREFIXES[index];

    if (
      id.startsWith(prefix)
    ) {
      score +=
        100 -
        index * 8;

      break;
    }
  }

  /*
   * Explicit free variant.
   */
  if (
    id.endsWith(":free")
  ) {
    score += 25;
  }

  /*
   * Context length.
   */
  const contextLength =
    Number(
      model.context_length ?? 0,
    );

  if (
    contextLength >= 32768
  ) {
    score += 30;
  } else if (
    contextLength >= 16384
  ) {
    score += 20;
  } else if (
    contextLength >= 8192
  ) {
    score += 10;
  }

  /*
   * Tool support.
   */
  if (
    supportsTools(model)
  ) {
    score += 20;
  }

  if (
    Array.isArray(
      model.supported_parameters,
    ) &&
    model.supported_parameters.includes(
      "tools",
    )
  ) {
    score += 25;
  }

  if (
    Array.isArray(
      model.supported_parameters,
    ) &&
    model.supported_parameters.includes(
      "tool_choice",
    )
  ) {
    score += 10;
  }

  /*
   * When tools are actually required, models that explicitly
   * advertise tools get a significant preference.
   */
  if (
    requireTools &&
    supportsTools(model)
  ) {
    score += 40;
  }

  /*
   * Penalize tiny context models.
   */
  if (
    contextLength > 0 &&
    contextLength < 4096
  ) {
    score -= 20;
  }

  return score;
}


/* ============================================================
   DEDUPLICATE MODELS
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

    if (
      seen.has(id)
    ) {
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
      raw as
        | OpenRouterErrorResponse
        | null;

    const message =
      data?.error?.message ||
      data?.message ||
      `OpenRouter model discovery failed with status ${response.status}.`;

    throw new OpenRouterError(
      message,
      {
        statusCode:
          response.status,

        retryable:
          response.status === 408 ||
          response.status === 429 ||
          response.status >= 500,

        code:
          data?.error?.code ??
          "MODEL_DISCOVERY_FAILED",
      },
    );
  }

  const data =
    raw as
      | OpenRouterModelsResponse
      | null;

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
   GET AVAILABLE FREE MODELS
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

  /*
   * Keep all discovered free models in cache.
   *
   * Tool filtering is performed later because some requests
   * may not contain tools.
   */
  const sorted =
    freeModels.sort(
      (a, b) =>
        scoreModel(b, false) -
        scoreModel(a, false),
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

/*
 * IMPORTANT:
 *
 * The returned array represents the COMPLETE model fallback
 * chain.
 *
 * Example:
 *
 * [
 *   "google/gemma-...",
 *   "qwen/...",
 *   "openrouter/free"
 * ]
 *
 * OpenRouter can then move through this list if a model
 * cannot serve the request.
 */
function buildRequestModels(
  models: OpenRouterModel[],
  requireTools: boolean,
): OpenRouterModel[] {
  const uniqueModels =
    deduplicateModels(
      models,
    );

  /*
   * Filter to models that can produce text.
   */
  const textModels =
    uniqueModels.filter(
      supportsTextOutput,
    );

  /*
   * When tools are required, strongly prefer explicit tool
   * support.
   *
   * We don't completely discard unknown metadata models
   * because OpenRouter model metadata can change.
   */
  const toolCapableModels =
    requireTools
      ? textModels.filter(
          supportsTools,
        )
      : textModels;

  const candidates =
    toolCapableModels.length > 0
      ? toolCapableModels
      : textModels;

  /*
   * Sort dynamically.
   */
  const sorted =
    [...candidates].sort(
      (a, b) => {
        const scoreDifference =
          scoreModel(
            b,
            requireTools,
          ) -
          scoreModel(
            a,
            requireTools,
          );

        if (
          scoreDifference !== 0
        ) {
          return scoreDifference;
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

  const result:
    OpenRouterModel[] = [];

  const seen =
    new Set<string>();

  /*
   * Add discovered models first.
   */
  for (const model of sorted) {
    if (
      result.length >=
      MAX_MODELS_PER_REQUEST
    ) {
      break;
    }

    if (
      seen.has(model.id)
    ) {
      continue;
    }

    seen.add(model.id);

    result.push(model);
  }

  /*
   * Always reserve a slot for openrouter/free when possible.
   *
   * This is especially important for tool requests because
   * openrouter/free dynamically filters free models based on
   * capabilities.
   */
  if (
    result.length <
    MAX_MODELS_PER_REQUEST
  ) {
    const alreadyIncluded =
      result.some(
        (model) =>
          model.id ===
          UNIVERSAL_FREE_MODEL,
      );

    if (!alreadyIncluded) {
      result.push({
        id:
          UNIVERSAL_FREE_MODEL,
      });
    }
  }

  /*
   * Safety limit.
   */
  return result.slice(
    0,
    MAX_MODELS_PER_REQUEST,
  );
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
        const normalized:
          OpenRouterMessage = {
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
   VALIDATE MESSAGES
============================================================ */

function validateMessages(
  messages: OpenRouterMessage[],
): void {
  if (
    !Array.isArray(
      messages,
    ) ||
    messages.length === 0
  ) {
    throw new OpenRouterError(
      "OpenRouter requires at least one message.",
      {
        statusCode: 400,
        retryable: false,
        code: "INVALID_MESSAGES",
      },
    );
  }

  for (
    const message of messages
  ) {
    if (
      !message ||
      ![
        "system",
        "user",
        "assistant",
        "tool",
      ].includes(
        message.role,
      )
    ) {
      throw new OpenRouterError(
        "Invalid OpenRouter message role.",
        {
          statusCode: 400,
          retryable: false,
          code: "INVALID_MESSAGE_ROLE",
        },
      );
    }
  }
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
  validateMessages(
    messages,
  );

  /*
   * Deduplicate and strictly limit the model list.
   */
  const safeModels =
    deduplicateModels(
      models,
    ).slice(
      0,
      MAX_MODELS_PER_REQUEST,
    );

  /*
   * Never allow an empty model list.
   */
  if (
    safeModels.length === 0
  ) {
    safeModels.push({
      id:
        UNIVERSAL_FREE_MODEL,
    });
  }

  const modelIds =
    safeModels.map(
      (model) =>
        model.id,
    );

  /*
   * ==========================================================
   * IMPORTANT OPENROUTER FALLBACK FORMAT
   * ==========================================================
   *
   * The `models` array contains the COMPLETE ordered chain.
   *
   * Do NOT send:
   *
   *   model: primary
   *   models: [fallback1, fallback2]
   *
   * Instead send:
   *
   *   models: [
   *     primary,
   *     fallback1,
   *     fallback2
   *   ]
   *
   * This keeps the request consistent with OpenRouter's
   * documented model-fallback mechanism.
   */
  const body: Record<
    string,
    unknown
  > = {
    models:
      modelIds,

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

    /*
     * Explicitly disable streaming because this server function
     * expects a normal JSON completion.
     */
    stream: false,
  };

  /*
   * Add tools only when provided.
   */
  if (
    Array.isArray(
      options?.tools,
    ) &&
    options.tools.length > 0
  ) {
    body.tools =
      options.tools;

    body.tool_choice =
      "auto";
  }

  console.log(
    "OpenRouter request models:",
    modelIds,
  );

  console.log(
    "OpenRouter tool mode:",
    Array.isArray(
      options?.tools,
    ) &&
      options.tools.length > 0,
  );

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
          JSON.stringify(
            body,
          ),
      },
    );

  const raw =
    await readJsonSafe(
      response,
    );

  const data =
    raw as
      | OpenRouterChatResponse
      | OpenRouterErrorResponse
      | null;

  /*
   * HTTP-level failure.
   */
  if (!response.ok) {
    const errorData =
      data as
        | OpenRouterErrorResponse
        | null;

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `OpenRouter request failed with status ${response.status}.`;

    console.error(
      "OpenRouter HTTP failure:",
      {
        status:
          response.status,

        statusText:
          response.statusText,

        models:
          modelIds,

        error:
          errorData?.error,
      },
    );

    throw new OpenRouterError(
      message,
      {
        statusCode:
          response.status,

        retryable:
          response.status === 408 ||
          response.status === 409 ||
          response.status === 429 ||
          response.status >= 500,

        code:
          errorData?.error?.code ??
          `HTTP_${response.status}`,
      },
    );
  }

  const chatData =
    data as
      | OpenRouterChatResponse
      | null;

  /*
   * Check for an application-level error even if the HTTP
   * response was technically successful.
   */
  if (
    chatData?.error
  ) {
    const errorMessage =
      chatData.error.message ||
      "OpenRouter returned an API error.";

    throw new OpenRouterError(
      errorMessage,
      {
        statusCode:
          typeof chatData.error.code ===
            "number"
            ? chatData.error.code
            : 502,

        retryable: true,

        code:
          chatData.error.code ??
          "OPENROUTER_API_ERROR",
      },
    );
  }

  /*
   * OpenRouter should normally return choices.
   */
  const choice =
    chatData?.choices?.[0];

  if (!choice) {
    console.error(
      "OpenRouter returned no choices:",
      {
        models:
          modelIds,

        response:
          chatData,
      },
    );

    throw new OpenRouterError(
      "OpenRouter returned no completion choices.",
      {
        statusCode: 502,
        retryable: true,
        code: "EMPTY_CHOICES",
      },
    );
  }

  /*
   * Some providers can attach an error to the choice.
   */
  if (
    choice.error
  ) {
    const choiceError =
      choice.error;

    throw new OpenRouterError(
      choiceError.message ||
        "OpenRouter provider returned an error.",
      {
        statusCode: 502,
        retryable: true,
        code:
          choiceError.code ??
          "CHOICE_ERROR",
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
   * A tool-call response can legitimately contain no text.
   */
  if (
    !content &&
    toolCalls.length === 0
  ) {
    console.error(
      "OpenRouter returned an empty assistant response:",
      {
        models:
          modelIds,

        finishReason:
          choice.finish_reason,

        response:
          chatData,
      },
    );

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
      typeof chatData?.model ===
      "string"
        ? chatData.model
        : modelIds[0] ??
          null,

    finishReason:
      choice.finish_reason ??
      null,
  };
}


/* ============================================================
   DIRECT UNIVERSAL FREE REQUEST
============================================================ */

/*
 * This deliberately bypasses model discovery.
 *
 * It is the final OpenRouter-level fallback.
 */
async function requestUniversalFree(
  apiKey: string,
  messages: OpenRouterMessage[],
  options?: {
    tools?: OpenRouterToolDefinition[];

    temperature?: number;

    maxTokens?: number;
  },
): Promise<OpenRouterResponse> {
  console.warn(
    "Trying direct OpenRouter universal free model.",
  );

  return requestCompletion(
    apiKey,
    messages,
    [
      {
        id:
          UNIVERSAL_FREE_MODEL,
      },
    ],
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
  const apiKey = getOpenRouterApiKey();
  const normalizedMessages = normalizeMessages(messages);
  validateMessages(normalizedMessages);

  const hasTools = Array.isArray(tools) && tools.length > 0;
  const requestOptions = {
    tools: hasTools ? tools : undefined,
    temperature: options?.temperature ?? 0.2,
    maxTokens: options?.maxTokens ?? 700,
  };

  // One bounded OpenRouter attempt per support round.
  // OpenRouter's `models` array already provides provider/model fallback.
  // Do not perform multiple server-side retries before local training fallback.
  let availableModels: OpenRouterModel[] = [];
  try {
    availableModels = await getAvailableModels(apiKey);
  } catch (error) {
    console.warn(
      "OpenRouter model discovery failed; using universal free model:",
      error,
    );
  }

  let requestModels = buildRequestModels(availableModels, hasTools);
  if (requestModels.length === 0) {
    requestModels = [{ id: UNIVERSAL_FREE_MODEL }];
  }

  console.log(
    "OpenRouter selected model chain:",
    requestModels.map((model) => model.id),
  );

  try {
    return await requestCompletion(
      apiKey,
      normalizedMessages,
      requestModels,
      requestOptions,
    );
  } catch (error) {
    clearModelCache();
    throw error;
  }
}


/* ============================================================
   generateOpenRouterResponse
============================================================ */

/*
 * IMPORTANT:
 *
 * support.ts imports this function.
 *
 * Therefore this export must remain available.
 */
export async function generateOpenRouterResponse(
  input:
    | OpenRouterMessage[]
    | OpenRouterRequestOptions,
  tools?: OpenRouterToolDefinition[],
): Promise<OpenRouterResponse> {
  /*
   * Style 1:
   *
   * generateOpenRouterResponse(
   *   messages,
   *   tools,
   * )
   */
  if (
    Array.isArray(input)
  ) {
    return callOpenRouter(
      input,
      tools,
    );
  }

  /*
   * Style 2:
   *
   * generateOpenRouterResponse({
   *   messages,
   *   tools,
   *   temperature,
   *   maxTokens,
   * })
   */
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
   TEXT HELPER
============================================================ */

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
