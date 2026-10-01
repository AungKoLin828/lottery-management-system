/**
 * ============================================================
 * OPENROUTER CLIENT
 * ============================================================
 *
 * No manual model configuration is required.
 *
 * The system:
 *
 * 1. Discovers available models
 * 2. Filters free text-capable models
 * 3. Scores preferred providers
 * 4. Selects up to 3 models
 * 5. Tries the selected models
 * 6. Refreshes model discovery after failure
 * 7. Finally tries openrouter/free
 *
 * If everything fails, the caller handles the local
 * training fallback.
 */

import {
  clearModelCache,
  getAvailableModels,
} from "./models";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

const REQUEST_TIMEOUT_MS =
  20_000;

const MAX_MODELS_PER_REQUEST = 3;

const PREFERRED_MODELS = [
  "google/gemma",
  "google/gemini",
  "meta-llama/",
  "qwen/",
  "mistralai/",
  "deepseek/",
  "nvidia/",
];

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

  content?:
    | string
    | null;

  tool_calls?: OpenRouterToolCall[];

  tool_call_id?: string;

  name?: string;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;

  pricing?: {
    prompt?: string;
    completion?: string;
  };

  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };

  supported_parameters?: string[];

  context_length?: number;
}

export interface OpenRouterResponse {
  id?: string;

  choices?: Array<{
    index?: number;

    message?: {
      role: "assistant";
      content?: string | null;
      tool_calls?: OpenRouterToolCall[];
    };

    finish_reason?: string;
  }>;

  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export class OpenRouterError extends Error {
  status?: number;

  model?: string;

  cause?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      model?: string;
      cause?: unknown;
    }
  ) {
    super(message);

    this.name =
      "OpenRouterError";

    this.status =
      options?.status;

    this.model =
      options?.model;

    this.cause =
      options?.cause;
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      timeoutMs
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,
      }
    );
  } finally {
    clearTimeout(timeout);
  }
}

function isFreeModel(
  model: OpenRouterModel
): boolean {
  const prompt =
    Number(model.pricing?.prompt ?? "1");

  const completion =
    Number(
      model.pricing?.completion ?? "1"
    );

  /*
   * OpenRouter represents free models with 0 pricing.
   */
  return (
    prompt === 0 &&
    completion === 0
  );
}

function supportsTextOutput(
  model: OpenRouterModel
): boolean {
  const output =
    model.architecture
      ?.output_modalities;

  if (!output) {
    return true;
  }

  return (
    output.includes("text") ||
    output.length === 0
  );
}

function supportsTools(
  model: OpenRouterModel
): boolean {
  const parameters =
    model.supported_parameters ??
    [];

  return parameters.some(
    (parameter) =>
      parameter === "tools" ||
      parameter === "tool_choice"
  );
}

function getPreferenceScore(
  model: OpenRouterModel
): number {
  const id =
    model.id.toLowerCase();

  let score = 0;

  for (
    let i = 0;
    i < PREFERRED_MODELS.length;
    i++
  ) {
    if (
      id.includes(
        PREFERRED_MODELS[i]
          .toLowerCase()
      )
    ) {
      score +=
        100 -
        i * 10;
    }
  }

  if (supportsTools(model)) {
    score += 20;
  }

  if (
    (model.context_length ?? 0) >=
    8000
  ) {
    score += 10;
  }

  return score;
}

function deduplicateModels(
  models: OpenRouterModel[]
): OpenRouterModel[] {
  const map =
    new Map<
      string,
      OpenRouterModel
    >();

  for (const model of models) {
    if (!map.has(model.id)) {
      map.set(
        model.id,
        model
      );
    }
  }

  return [
    ...map.values(),
  ];
}

function selectModels(
  models: OpenRouterModel[]
): OpenRouterModel[] {
  const freeModels =
    models.filter(
      (model) =>
        isFreeModel(model) &&
        supportsTextOutput(model)
    );

  return deduplicateModels(
    freeModels
      .sort(
        (a, b) =>
          getPreferenceScore(b) -
          getPreferenceScore(a)
      )
  ).slice(
    0,
    MAX_MODELS_PER_REQUEST
  );
}

function buildRequestBody(
  model:
    | string
    | undefined,
  messages: OpenRouterMessage[],
  options?: {
    tools?: unknown[];
    toolChoice?: unknown;
    maxTokens?: number;
    temperature?: number;
    models?: string[];
  }
): Record<string, unknown> {
  const body: Record<
    string,
    unknown
  > = {
    messages,

    max_tokens:
      options?.maxTokens ?? 700,

    temperature:
      options?.temperature ?? 0.2,
  };

  if (model) {
    body.model = model;
  }

  if (
    options?.models &&
    options.models.length > 0
  ) {
    body.models =
      options.models;
  }

  if (
    options?.tools &&
    options.tools.length > 0
  ) {
    body.tools =
      options.tools;
  }

  if (
    options?.toolChoice
  ) {
    body.tool_choice =
      options.toolChoice;
  }

  return body;
}

async function requestCompletion(
  model:
    | string
    | undefined,
  messages: OpenRouterMessage[],
  options?: {
    tools?: unknown[];
    toolChoice?: unknown;
    maxTokens?: number;
    temperature?: number;
    models?: string[];
  }
): Promise<OpenRouterResponse> {
  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY is not configured."
    );
  }

  const body =
    buildRequestBody(
      model,
      messages,
      options
    );

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
            process.env
              .PUBLIC_SITE_URL ||
            "http://localhost:8888",

          "X-Title":
            "Lottery Management System AI Support",
        },

        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

  const responseText =
    await response.text();

  let parsed:
    | OpenRouterResponse
    | Record<string, unknown>
    | null = null;

  try {
    parsed =
      responseText
        ? JSON.parse(
            responseText
          )
        : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    throw new OpenRouterError(
      `OpenRouter request failed with HTTP ${response.status}.`,
      {
        status:
          response.status,
        model,
        cause:
          parsed ??
          responseText,
      }
    );
  }

  if (!parsed) {
    throw new OpenRouterError(
      "OpenRouter returned an empty response.",
      {
        model,
      }
    );
  }

  return parsed as OpenRouterResponse;
}

async function discoverModels(): Promise<
  OpenRouterModel[]
> {
  const models =
    await getAvailableModels();

  return models;
}

async function askWithApiKey(
  messages: OpenRouterMessage[],
  options?: {
    tools?: unknown[];
    toolChoice?: unknown;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<OpenRouterResponse> {
  let models =
    await discoverModels();

  let selected =
    selectModels(models);

  /*
   * First attempt.
   */
  if (selected.length > 0) {
    try {
      return await requestCompletion(
        selected[0].id,
        messages,
        {
          ...options,
          models:
            selected.length > 1
              ? selected.map(
                  (model) =>
                    model.id
                )
              : undefined,
        }
      );
    } catch (firstError) {
      /*
       * Refresh the model list because free models can
       * disappear/change.
       */
      clearModelCache();

      try {
        models =
          await discoverModels();

        selected =
          selectModels(
            models
          );

        if (
          selected.length > 0
        ) {
          return await requestCompletion(
            selected[0].id,
            messages,
            {
              ...options,
              models:
                selected.length > 1
                  ? selected.map(
                      (model) =>
                        model.id
                    )
                  : undefined,
            }
          );
        }
      } catch {
        /*
         * Continue to universal free model.
         */
      }

      /*
       * If this was the last useful error, preserve it.
       */
      if (
        firstError instanceof
        OpenRouterError
      ) {
        throw firstError;
      }

      throw new OpenRouterError(
        "OpenRouter model request failed.",
        {
          cause: firstError,
        }
      );
    }
  }

  /*
   * No dynamically discovered free model.
   */
  clearModelCache();

  return requestCompletion(
    UNIVERSAL_FREE_MODEL,
    messages,
    options
  );
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options?: {
    tools?: unknown[];
    toolChoice?: unknown;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<OpenRouterResponse> {
  return askWithApiKey(
    messages,
    options
  );
}