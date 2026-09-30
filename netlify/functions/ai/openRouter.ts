import {
  clearModelCache,
  getAvailableModels,
} from "./models";

/* ============================================================
   CONSTANTS
============================================================ */

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

const REQUEST_TIMEOUT_MS =
  20_000;

/*
 * OpenRouter currently limits the `models`
 * fallback array to a maximum of 3 models.
 */
const MAX_MODELS_PER_REQUEST =
  3;

/*
 * Preferred model families.
 *
 * These are prefixes rather than exact versions.
 *
 * Example:
 *
 * google/gemma-...
 * google/gemini-...
 * qwen/...
 *
 * Therefore you do NOT need to change this
 * every time OpenRouter changes a model version.
 */
const PREFERRED_MODELS = [
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

  tool_calls?:
    OpenRouterToolCall[];

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

      content?:
        | string
        | null;

      tool_calls?:
        OpenRouterToolCall[];
    };

    finish_reason?:
      | string
      | null;
  }>;

  usage?: {
    prompt_tokens?:
      number;

    completion_tokens?:
      number;

    total_tokens?:
      number;
  };

  error?: {
    message?: string;

    type?: string;

    code?:
      | string
      | number;
  };
}

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
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs,
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
   FREE MODEL CHECK
============================================================ */

function isFreeModel(
  model: OpenRouterModel,
): boolean {
  if (!model) {
    return false;
  }

  const id =
    String(
      model.id || "",
    ).toLowerCase();

  /*
   * Explicit :free models.
   */
  if (
    id.endsWith(":free")
  ) {
    return true;
  }

  /*
   * Some OpenRouter models expose
   * zero pricing without :free suffix.
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
   TEXT OUTPUT CHECK
============================================================ */

function supportsTextOutput(
  model: OpenRouterModel,
): boolean {
  if (!model) {
    return false;
  }

  const architecture =
    model.architecture;

  /*
   * If architecture information is missing,
   * don't reject the model.
   */
  if (!architecture) {
    return true;
  }

  /*
   * New OpenRouter model metadata.
   */
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

  /*
   * Older modality format:
   *
   * text->text
   * text+image->text
   */
  const modality =
    architecture.modality;

  if (
    typeof modality ===
    "string"
  ) {
    return modality
      .toLowerCase()
      .split("->")
      .some(
        (part) =>
          part.includes("text"),
      );
  }

  return true;
}

/* ============================================================
   PREFERRED MODEL SCORE
============================================================ */

function getPreferenceScore(
  model: OpenRouterModel,
): number {
  const id =
    String(
      model.id || "",
    ).toLowerCase();

  let score =
    0;

  for (
    let index = 0;
    index <
    PREFERRED_MODELS.length;
    index += 1
  ) {
    const preferred =
      PREFERRED_MODELS[
        index
      ].toLowerCase();

    /*
     * Exact model family match.
     */
    if (
      id === preferred
    ) {
      score +=
        1000;
    }

    /*
     * Prefix match.
     *
     * Example:
     *
     * google/gemma-...
     */
    else if (
      id.startsWith(
        preferred,
      )
    ) {
      score +=
        500 -
        index * 20;
    }

    /*
     * Contains match.
     */
    else if (
      id.includes(
        preferred,
      )
    ) {
      score +=
        200 -
        index * 10;
    }
  }

  /*
   * Explicit free model.
   */
  if (
    id.endsWith(":free")
  ) {
    score +=
      100;
  }

  /*
   * Prefer larger context windows.
   */
  const contextLength =
    Number(
      model.context_length ||
        0,
    );

  if (
    contextLength >=
    32768
  ) {
    score +=
      30;
  } else if (
    contextLength >=
    16384
  ) {
    score +=
      20;
  } else if (
    contextLength >=
    8192
  ) {
    score +=
      10;
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
    OpenRouterModel[] =
    [];

  for (
    const model of
      models || []
  ) {
    const id =
      String(
        model?.id || "",
      ).trim();

    if (
      !id ||
      seen.has(id)
    ) {
      continue;
    }

    seen.add(id);

    result.push(
      model,
    );
  }

  return result;
}

/* ============================================================
   SELECT FREE TEXT MODELS
============================================================ */

function selectModels(
  availableModels:
    OpenRouterModel[],
): OpenRouterModel[] {
  /*
   * First filter:
   *
   * free
   * +
   * text capable
   */
  const freeTextModels =
    (
      availableModels ||
      []
    ).filter(
      (model) =>
        isFreeModel(model) &&
        supportsTextOutput(
          model,
        ),
    );

  console.log(
    "Currently available free models:",
    freeTextModels.map(
      (model) =>
        model.id,
    ),
  );

  /*
   * Sort according to
   * preferred model families.
   */
  const sortedModels =
    [
      ...freeTextModels,
    ].sort(
      (a, b) => {
        const scoreDifference =
          getPreferenceScore(
            b,
          ) -
          getPreferenceScore(
            a,
          );

        if (
          scoreDifference !==
          0
        ) {
          return scoreDifference;
        }

        /*
         * If preference is equal,
         * prefer larger context.
         */
        return (
          Number(
            b.context_length ||
              0,
          ) -
          Number(
            a.context_length ||
              0,
          )
        );
      },
    );

  return deduplicateModels(
    sortedModels,
  );
}

/* ============================================================
   BUILD REQUEST MODELS
============================================================ */

function buildRequestModels(
  availableModels:
    OpenRouterModel[],
): OpenRouterModel[] {
  const selectedModels =
    selectModels(
      availableModels,
    );

  /*
   * IMPORTANT:
   *
   * OpenRouter accepts maximum 3 models.
   */
  const requestModels =
    selectedModels.slice(
      0,
      MAX_MODELS_PER_REQUEST,
    );

  console.log(
    "Models selected for OpenRouter request:",
    requestModels.map(
      (model) =>
        model.id,
    ),
  );

  return requestModels;
}

/* ============================================================
   BUILD REQUEST BODY
============================================================ */

function buildRequestBody(
  messages:
    OpenRouterMessage[],
  requestModels:
    OpenRouterModel[],
  tools?: unknown[],
): Record<
  string,
  unknown
> {
  const safeModels =
    deduplicateModels(
      requestModels,
    ).slice(
      0,
      MAX_MODELS_PER_REQUEST,
    );

  /*
   * Primary model is the first
   * preferred model.
   */
  const primaryModel =
    safeModels[0]?.id ||
    UNIVERSAL_FREE_MODEL;

  const body:
    Record<
      string,
      unknown
    > = {
      /*
       * Primary model.
       */
      model:
        primaryModel,

      messages,

      temperature:
        0.2,

      max_tokens:
        700,
    };

  /*
   * OpenRouter fallback models.
   *
   * Don't send models when there is
   * only one model.
   */
  if (
    safeModels.length >
    1
  ) {
    body.models =
      safeModels.map(
        (model) =>
          model.id,
      );
  }

  /*
   * Preserve your existing
   * function-calling support.
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
   REQUEST
============================================================ */

async function requestCompletion(
  apiKey: string,
  messages:
    OpenRouterMessage[],
  requestModels:
    OpenRouterModel[],
  tools?: unknown[],
): Promise<OpenRouterResponse> {
  const siteUrl =
    process.env.PUBLIC_SITE_URL?.trim() ||
    process.env.URL?.trim() ||
    "";

  const body =
    buildRequestBody(
      messages,
      requestModels,
      tools,
    );

  console.log(
    "OpenRouter primary model:",
    body.model,
  );

  console.log(
    "OpenRouter request models:",
    body.models ||
      [body.model],
  );

  const response =
    await fetchWithTimeout(
      OPENROUTER_URL,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          ...(siteUrl
            ? {
                "HTTP-Referer":
                  siteUrl,
              }
            : {}),

          "X-Title":
            "Lottery Management System AI Support",
        },

        body:
          JSON.stringify(
            body,
          ),
      },

      REQUEST_TIMEOUT_MS,
    );

  const raw =
    await response.text();

  let data:
    | OpenRouterResponse
    | null = null;

  try {
    data =
      JSON.parse(
        raw,
      ) as OpenRouterResponse;
  } catch {
    data = null;
  }

  if (
    !response.ok
  ) {
    const providerMessage =
      data?.error?.message ||
      raw ||
      `HTTP ${response.status}`;

    throw new Error(
      `OpenRouter request failed (${response.status}): ${String(
        providerMessage,
      ).slice(0, 500)}`,
    );
  }

  if (!data) {
    throw new Error(
      "OpenRouter returned invalid JSON",
    );
  }

  if (data.error) {
    throw new Error(
      data.error.message ||
        "OpenRouter returned an API error",
    );
  }

  if (
    !Array.isArray(
      data.choices,
    ) ||
    data.choices.length ===
      0
  ) {
    throw new Error(
      "OpenRouter returned no choices",
    );
  }

  const message =
    data.choices[0]?.message;

  if (!message) {
    throw new Error(
      "OpenRouter returned no message",
    );
  }

  const content =
    typeof message.content ===
    "string"
      ? message.content.trim()
      : "";

  const hasToolCalls =
    Array.isArray(
      message.tool_calls,
    ) &&
    message.tool_calls.length >
      0;

  if (
    !content &&
    !hasToolCalls
  ) {
    throw new Error(
      "OpenRouter returned an empty response",
    );
  }

  return data;
}

/* ============================================================
   DISCOVER MODELS
============================================================ */

async function discoverModels(
  apiKey: string,
): Promise<OpenRouterModel[]> {
  try {
    const availableModels =
      await getAvailableModels(
        apiKey,
      );

    return Array.isArray(
      availableModels,
    )
      ? availableModels
      : [];
  } catch (error) {
    console.warn(
      "OpenRouter model discovery failed:",
      error,
    );

    return [];
  }
}

/* ============================================================
   ASK WITH ONE API KEY
============================================================ */

async function askWithApiKey(
  apiKey: string,
  messages:
    OpenRouterMessage[],
  tools?: unknown[],
): Promise<OpenRouterResponse> {
  /*
   * ----------------------------------------------------------
   * STEP 1
   * Discover currently available models.
   * ----------------------------------------------------------
   */

  let availableModels =
    await discoverModels(
      apiKey,
    );

  /*
   * ----------------------------------------------------------
   * STEP 2
   * Select preferred free models.
   * ----------------------------------------------------------
   */

  let requestModels =
    buildRequestModels(
      availableModels,
    );

  /*
   * ----------------------------------------------------------
   * STEP 3
   * No suitable model discovered.
   *
   * Use universal OpenRouter free router.
   * ----------------------------------------------------------
   */

  if (
    requestModels.length ===
    0
  ) {
    console.warn(
      "No suitable free models discovered. Using openrouter/free.",
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
      tools,
    );
  }

  /*
   * ----------------------------------------------------------
   * STEP 4
   * Try preferred models.
   * ----------------------------------------------------------
   */

  try {
    return await requestCompletion(
      apiKey,
      messages,
      requestModels,
      tools,
    );
  } catch (
    firstError
  ) {
    console.warn(
      "Preferred model request failed. Refreshing model list...",
      firstError,
    );

    /*
     * --------------------------------------------------------
     * STEP 5
     * Model may have disappeared after discovery.
     *
     * Clear cache and discover again.
     * --------------------------------------------------------
     */

    clearModelCache();

    availableModels =
      await discoverModels(
        apiKey,
      );

    requestModels =
      buildRequestModels(
        availableModels,
      );

    /*
     * --------------------------------------------------------
     * STEP 6
     * If refreshed discovery found nothing,
     * use universal free router.
     * --------------------------------------------------------
     */

    if (
      requestModels.length ===
      0
    ) {
      console.warn(
        "No models available after refresh. Falling back to openrouter/free.",
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
        tools,
      );
    }

    /*
     * --------------------------------------------------------
     * STEP 7
     * Try refreshed preferred models.
     * --------------------------------------------------------
     */

    try {
      return await requestCompletion(
        apiKey,
        messages,
        requestModels,
        tools,
      );
    } catch (
      secondError
    ) {
      /*
       * ------------------------------------------------------
       * STEP 8
       * Final fallback for this API key.
       * ------------------------------------------------------
       */

      console.warn(
        "Refreshed preferred model request failed. Trying openrouter/free...",
        secondError,
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
        tools,
      );
    }
  }
}

/* ============================================================
   PUBLIC FUNCTION
============================================================ */

export async function callOpenRouter(
  messages:
    OpenRouterMessage[],
  tools?: unknown[],
): Promise<OpenRouterResponse> {
  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured",
    );
  }

  if (
    !Array.isArray(
      messages,
    ) ||
    messages.length ===
      0
  ) {
    throw new Error(
      "OpenRouter requires at least one message",
    );
  }

  return askWithApiKey(
    apiKey,
    messages,
    tools,
  );
}

export default callOpenRouter;