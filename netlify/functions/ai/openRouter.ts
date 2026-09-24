const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const UNIVERSAL_FREE_MODEL =
  "openrouter/free";

const REQUEST_TIMEOUT_MS =
  20_000;

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
   REQUEST BODY
============================================================ */

function buildRequestBody(
  messages: OpenRouterMessage[],
  tools?: unknown[],
): Record<
  string,
  unknown
> {
  const body: Record<
    string,
    unknown
  > = {
    model:
      UNIVERSAL_FREE_MODEL,

    messages,

    temperature:
      0.2,

    max_tokens:
      700,
  };

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

export async function callOpenRouter(
  messages: OpenRouterMessage[],
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
    messages.length === 0
  ) {
    throw new Error(
      "OpenRouter requires at least one message",
    );
  }

  const siteUrl =
    process.env.PUBLIC_SITE_URL?.trim() ||
    process.env.URL?.trim() ||
    "";

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
            buildRequestBody(
              messages,
              tools,
            ),
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