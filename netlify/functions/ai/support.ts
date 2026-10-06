import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  requireAuth,
  jsonResponse,
} from "./auth";

import {
  getAISupportEnabled,
} from "./settings";

import {
  checkRateLimitDetailed,
} from "./rateLimit";

import {
  knowledgeToText,
  searchKnowledge,
} from "./rag";

import {
  generateCustomTrainingResponse,
} from "./customTrainingAI";

import {
  generateOpenRouterResponse,
  type OpenRouterMessage,
  type OpenRouterToolCall,
} from "./openRouter";

import {
  TOOL_DEFINITIONS,
} from "./toolDefinitions";

import {
  getMyWallet,
  getMyLatestDeposit,
  getMyLatestWithdrawal,
  getMyRecentTransactions,
} from "./supportTools";

import {
  SYSTEM_PROMPT,
} from "./systemPrompt";

/* ============================================================
   TYPES
============================================================ */

type SupportRequestBody = {
  message?: unknown;
  messages?: unknown;
};

type ClientChatMessage = {
  role?: unknown;
  content?: unknown;
};

type AIResponse = {
  success: boolean;

  message?: string;

  source?:
    | "OPENROUTER"
    | "TRAINING"
    | "HUMAN";

  ticketId?: string;

  messageId?: string;

  confidence?: number;

  matchedDocuments?: Array<{
    fileName: string;
    category: string;
    score: number;
  }>;

  error?: string;
};

type AccountIntent =
  | "WALLET_BALANCE"
  | "DEPOSIT"
  | "BALANCE_AFTER_DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSACTIONS"
  | null;

type AccountData = {
  wallet?: Awaited<
    ReturnType<typeof getMyWallet>
  >;

  latestDeposit?: Awaited<
    ReturnType<typeof getMyLatestDeposit>
  >;

  latestWithdrawal?: Awaited<
    ReturnType<typeof getMyLatestWithdrawal>
  >;

  transactions?: Awaited<
    ReturnType<typeof getMyRecentTransactions>
  >;
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAX_MESSAGE_LENGTH = 2000;

const MAX_HISTORY_MESSAGES = 10;

const MAX_TOOL_ROUNDS = 2;

const MAX_TOOL_CALLS_PER_REQUEST = 4;

/* ============================================================
   RESPONSE HELPER
============================================================ */

function response(
  statusCode: number,
  body:
    | AIResponse
    | Record<string, unknown>,
) {
  return jsonResponse(
    body,
    statusCode,
  );
}

/* ============================================================
   TEXT NORMALIZATION
============================================================ */

function normalizeText(
  value: string,
): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForIntent(
  value: string,
): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ============================================================
   GET USER MESSAGE
============================================================ */

function getUserMessage(
  body: SupportRequestBody,
): string {
  if (
    typeof body.message ===
    "string"
  ) {
    return normalizeText(
      body.message,
    );
  }

  if (
    Array.isArray(
      body.messages,
    )
  ) {
    const messages =
      body.messages as ClientChatMessage[];

    for (
      let index =
        messages.length - 1;
      index >= 0;
      index -= 1
    ) {
      const item =
        messages[index];

      if (
        item &&
        item.role === "user" &&
        typeof item.content ===
          "string"
      ) {
        const content =
          normalizeText(
            item.content,
          );

        if (content) {
          return content;
        }
      }
    }
  }

  return "";
}

/* ============================================================
   GET HISTORY
============================================================ */

function getHistory(
  body: SupportRequestBody,
): OpenRouterMessage[] {
  if (
    !Array.isArray(
      body.messages,
    )
  ) {
    return [];
  }

  const messages =
    body.messages as ClientChatMessage[];

  return messages
    .filter(
      (
        message,
      ): message is ClientChatMessage & {
        role:
          | "user"
          | "assistant";
        content: string;
      } => {
        if (!message) {
          return false;
        }

        if (
          typeof message.content !==
          "string"
        ) {
          return false;
        }

        if (
          message.role !== "user" &&
          message.role !==
            "assistant"
        ) {
          return false;
        }

        return (
          message.content.trim()
            .length > 0
        );
      },
    )
    .slice(
      -MAX_HISTORY_MESSAGES,
    )
    .map(
      (message) => ({
        role:
          message.role,
        content:
          normalizeText(
            message.content,
          ),
      }),
    );
}

/* ============================================================
   ACCOUNT INTENT DETECTION
============================================================ */

function detectAccountIntent(
  message: string,
): AccountIntent {
  const text =
    normalizeForIntent(
      message,
    );

  if (!text) {
    return null;
  }

  /*
   * ----------------------------------------------------------
   * BALANCE AFTER DEPOSIT
   * ----------------------------------------------------------
   *
   * Examples:
   *
   * balance not update after deposit
   * deposited but balance not updated
   * deposit completed but wallet balance unchanged
   * I have deposit but balance does not update
   * my balance is not showing deposit
   */
  const hasBalance =
    /\b(balance|wallet|money|funds)\b/u.test(
      text,
    );

  const hasDeposit =
    /\b(deposit|deposited|depositing|topup|top up|topuped|payment)\b/u.test(
      text,
    );

  const hasNotUpdated =
    /\b(
      not update|
      not updated|
      doesn't update|
      does not update|
      didnt update|
      didn't update|
      not showing|
      doesn't show|
      does not show|
      not reflected|
      missing|
      disappeared|
      unchanged|
      same balance|
      balance unchanged|
      balance not changed
    )\b/ux.test(
      text,
    );

  if (
    hasBalance &&
    hasDeposit &&
    (
      hasNotUpdated ||
      /\b(after|but|yet)\b/u.test(
        text,
      )
    )
  ) {
    return "BALANCE_AFTER_DEPOSIT";
  }

  /*
   * ----------------------------------------------------------
   * WALLET BALANCE
   * ----------------------------------------------------------
   */
  if (
    hasBalance &&
    !hasDeposit
  ) {
    return "WALLET_BALANCE";
  }

  /*
   * ----------------------------------------------------------
   * DEPOSIT
   * ----------------------------------------------------------
   */
  if (
    hasDeposit
  ) {
    return "DEPOSIT";
  }

  /*
   * ----------------------------------------------------------
   * WITHDRAWAL
   * ----------------------------------------------------------
   */
  if (
    /\b(
      withdrawal|
      withdraw|
      withdrawn|
      cashout|
      cash out|
      payout
    )\b/ux.test(
      text,
    )
  ) {
    return "WITHDRAWAL";
  }

  /*
   * ----------------------------------------------------------
   * TRANSACTIONS
   * ----------------------------------------------------------
   */
  if (
    /\b(
      transaction|
      transactions|
      history|
      payment history|
      account history
    )\b/ux.test(
      text,
    )
  ) {
    return "TRANSACTIONS";
  }

  return null;
}

/* ============================================================
   READ-ONLY TOOL EXECUTION
============================================================ */

async function executeTool(
  name: string,
  authenticatedUserId: string,
): Promise<string> {
  switch (name) {
    case "getMyWallet": {
      const result =
        await getMyWallet(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestDeposit": {
      const result =
        await getMyLatestDeposit(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyLatestWithdrawal": {
      const result =
        await getMyLatestWithdrawal(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    case "getMyRecentTransactions": {
      const result =
        await getMyRecentTransactions(
          authenticatedUserId,
        );

      return JSON.stringify(
        result,
      );
    }

    default:
      throw new Error(
        `Unsupported read-only support tool: ${name}`,
      );
  }
}

/* ============================================================
   ACCOUNT DATA
============================================================ */

async function loadAccountData(
  intent: AccountIntent,
  authenticatedUserId: string,
): Promise<{
  data: AccountData;
  failed: boolean;
}> {
  const data: AccountData = {};

  try {
    switch (intent) {
      case "WALLET_BALANCE": {
        data.wallet =
          await getMyWallet(
            authenticatedUserId,
          );

        return {
          data,
          failed: false,
        };
      }

      case "DEPOSIT": {
        data.latestDeposit =
          await getMyLatestDeposit(
            authenticatedUserId,
          );

        return {
          data,
          failed: false,
        };
      }

      case "BALANCE_AFTER_DEPOSIT": {
        /*
         * Both are authoritative read-only
         * account queries.
         */
        const [
          wallet,
          latestDeposit,
        ] =
          await Promise.all([
            getMyWallet(
              authenticatedUserId,
            ),
            getMyLatestDeposit(
              authenticatedUserId,
            ),
          ]);

        data.wallet =
          wallet;

        data.latestDeposit =
          latestDeposit;

        return {
          data,
          failed: false,
        };
      }

      case "WITHDRAWAL": {
        data.latestWithdrawal =
          await getMyLatestWithdrawal(
            authenticatedUserId,
          );

        return {
          data,
          failed: false,
        };
      }

      case "TRANSACTIONS": {
        data.transactions =
          await getMyRecentTransactions(
            authenticatedUserId,
            10,
          );

        return {
          data,
          failed: false,
        };
      }

      default:
        return {
          data,
          failed: false,
        };
    }
  } catch (error) {
    console.error(
      "Account support data lookup failed:",
      error,
    );

    return {
      data,
      failed: true,
    };
  }
}

/* ============================================================
   ACCOUNT DATA -> OPENROUTER CONTEXT
============================================================ */

function accountDataToText(
  intent: AccountIntent,
  data: AccountData,
): string {
  if (!intent) {
    return "";
  }

  const sections: string[] =
    [];

  sections.push(
    "AUTHORITATIVE ACCOUNT DATA:",
  );

  sections.push(
    JSON.stringify(
      data,
      null,
      2,
    ),
  );

  sections.push(
    "",
  );

  sections.push(
    "IMPORTANT: The account data above comes from the authenticated player's backend database.",
  );

  sections.push(
    "Use these values exactly. Do not invent or change financial values or statuses.",
  );

  return sections.join(
    "\n",
  );
}

/* ============================================================
   DETERMINISTIC ACCOUNT RESPONSE
============================================================ */

function deterministicAccountResponse(
  message: string,
  intent: AccountIntent,
  data: AccountData,
): AIResponse | null {
  if (!intent) {
    return null;
  }

  /*
   * ----------------------------------------------------------
   * WALLET BALANCE
   * ----------------------------------------------------------
   */
  if (
    intent ===
    "WALLET_BALANCE"
  ) {
    const wallet =
      data.wallet;

    if (
      !wallet ||
      !wallet.found
    ) {
      return {
        success: true,
        source: "HUMAN",
        message:
          "I could not find your wallet information right now. Please contact our support team so they can check your account.",
      };
    }

    return {
      success: true,
      source: "TRAINING",
      confidence: 1,
      message:
        `Your current wallet balance is ${wallet.balance}.`,
    };
  }

  /*
   * ----------------------------------------------------------
   * DEPOSIT
   * ----------------------------------------------------------
   */
  if (
    intent ===
    "DEPOSIT"
  ) {
    const deposit =
      data.latestDeposit;

    if (
      !deposit ||
      !deposit.found
    ) {
      return {
        success: true,
        source: "HUMAN",
        message:
          "I could not find a recent deposit for your account. Please contact our support team so they can check your deposit.",
      };
    }

    const item =
      deposit.deposit;

    return {
      success: true,
      source: "TRAINING",
      confidence: 1,
      message:
        [
          `Your latest deposit is ${item.amount}.`,
          `Status: ${item.status}.`,
          item.createdAt
            ? `Created: ${item.createdAt}.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
    };
  }

  /*
   * ----------------------------------------------------------
   * BALANCE AFTER DEPOSIT
   * ----------------------------------------------------------
   */
  if (
    intent ===
    "BALANCE_AFTER_DEPOSIT"
  ) {
    const wallet =
      data.wallet;

    const deposit =
      data.latestDeposit;

    if (
      !wallet ||
      !wallet.found
    ) {
      return {
        success: true,
        source: "HUMAN",
        message:
          "I could not retrieve your current wallet balance. Please contact our support team so they can check your account.",
      };
    }

    if (
      !deposit ||
      !deposit.found
    ) {
      return {
        success: true,
        source: "HUMAN",
        message:
          `Your current wallet balance is ${wallet.balance}, but I could not find a recent deposit record. Please contact our support team so they can check the deposit.`,
      };
    }

    const item =
      deposit.deposit;

    const status =
      String(
        item.status || "",
      )
        .trim()
        .toUpperCase();

    /*
     * --------------------------------------------------------
     * PENDING / PROCESSING
     * --------------------------------------------------------
     */
    if (
      status ===
        "PENDING" ||
      status ===
        "PROCESSING"
    ) {
      return {
        success: true,
        source: "TRAINING",
        confidence: 1,
        message:
          [
            `Your current wallet balance is ${wallet.balance}.`,
            `Your latest deposit is ${item.amount} and its status is ${item.status}.`,
            "The deposit is not in a completed state yet, so the current balance does not show that deposit as completed.",
            "If you need the deposit checked, please contact our support team.",
          ].join(" "),
      };
    }

    /*
     * --------------------------------------------------------
     * APPROVED / COMPLETED / SUCCESS
     * --------------------------------------------------------
     */
    if (
      status ===
        "APPROVED" ||
      status ===
        "COMPLETED" ||
      status ===
        "SUCCESS" ||
      status ===
        "SUCCESSFUL"
    ) {
      return {
        success: true,
        source: "TRAINING",
        confidence: 1,
        message:
          [
            `Your current wallet balance is ${wallet.balance}.`,
            `Your latest deposit is ${item.amount} and its status is ${item.status}.`,
            "The deposit record is completed, but I cannot confirm from the current account data whether the balance changed at the expected time.",
            "Please contact our support team so they can check the deposit and wallet transaction together.",
          ].join(" "),
      };
    }

    /*
     * --------------------------------------------------------
     * REJECTED / FAILED / CANCELLED
     * --------------------------------------------------------
     */
    if (
      status ===
        "REJECTED" ||
      status ===
        "FAILED" ||
      status ===
        "CANCELLED" ||
      status ===
        "CANCELED"
    ) {
      return {
        success: true,
        source: "TRAINING",
        confidence: 1,
        message:
          [
            `Your current wallet balance is ${wallet.balance}.`,
            `Your latest deposit is ${item.amount} and its status is ${item.status}.`,
            "The deposit is not a successful completed deposit, so it is not reflected as a completed deposit in the wallet.",
          ].join(" "),
      };
    }

    /*
     * --------------------------------------------------------
     * UNKNOWN STATUS
     * --------------------------------------------------------
     */
    return {
      success: true,
      source: "TRAINING",
      confidence: 1,
      message:
        [
          `Your current wallet balance is ${wallet.balance}.`,
          `Your latest deposit is ${item.amount}.`,
          `The deposit status is ${item.status}.`,
          "I cannot determine from this information why the balance has not updated, so please contact our support team for further checking.",
        ].join(" "),
    };
  }

  /*
   * ----------------------------------------------------------
   * WITHDRAWAL
   * ----------------------------------------------------------
   */
  if (
    intent ===
    "WITHDRAWAL"
  ) {
    const withdrawal =
      data.latestWithdrawal;

    if (
      !withdrawal ||
      !withdrawal.found
    ) {
      return {
        success: true,
        source: "HUMAN",
        message:
          "I could not find a recent withdrawal for your account. Please contact our support team if you need your withdrawal checked.",
      };
    }

    const item =
      withdrawal.withdrawal;

    return {
      success: true,
      source: "TRAINING",
      confidence: 1,
      message:
        [
          `Your latest withdrawal is ${item.amount}.`,
          `Status: ${item.status}.`,
          item.createdAt
            ? `Created: ${item.createdAt}.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
    };
  }

  /*
   * ----------------------------------------------------------
   * TRANSACTIONS
   * ----------------------------------------------------------
   */
  if (
    intent ===
    "TRANSACTIONS"
  ) {
    const transactions =
      data.transactions
        ?.transactions;

    if (
      !transactions ||
      transactions.length === 0
    ) {
      return {
        success: true,
        source: "TRAINING",
        confidence: 1,
        message:
          "I could not find any recent transactions for your account.",
      };
    }

    const lines =
      transactions
        .slice(0, 5)
        .map(
          (
            transaction,
            index,
          ) =>
            `${index + 1}. ${transaction.type}: ${transaction.amount} — ${transaction.status}`,
        );

    return {
      success: true,
      source: "TRAINING",
      confidence: 1,
      message:
        [
          "Here are your latest transactions:",
          ...lines,
        ].join("\n"),
    };
  }

  return null;
}

/* ============================================================
   OPENROUTER TOOL LOOP
============================================================ */

async function runOpenRouter(
  authenticatedUserId: string,
  message: string,
  history: OpenRouterMessage[],
  knowledgeText: string,
): Promise<string | null> {
  const messages: OpenRouterMessage[] =
    [
      {
        role: "system",
        content:
          SYSTEM_PROMPT,
      },
    ];

  if (
    knowledgeText &&
    knowledgeText.trim()
  ) {
    messages.push({
      role: "system",
      content:
        [
          "Relevant support knowledge:",
          "",
          knowledgeText,
        ].join("\n"),
    });
  }

  messages.push(
    ...history,
  );

  messages.push({
    role: "user",
    content: message,
  });

  let toolCallCount = 0;

  for (
    let round = 0;
    round < MAX_TOOL_ROUNDS;
    round += 1
  ) {
    const result =
      await generateOpenRouterResponse(
        messages,
        TOOL_DEFINITIONS,
      );

    if (!result) {
      return null;
    }

    const content =
      typeof result.content ===
      "string"
        ? result.content.trim()
        : "";

    const toolCalls =
      Array.isArray(
        result.toolCalls,
      )
        ? result.toolCalls
        : [];

    if (
      toolCalls.length === 0
    ) {
      if (content) {
        return content;
      }

      return null;
    }

    if (
      toolCallCount >=
      MAX_TOOL_CALLS_PER_REQUEST
    ) {
      console.warn(
        "AI support tool-call limit reached.",
      );

      return null;
    }

    messages.push({
      role: "assistant",
      content:
        content || null,
      tool_calls:
        toolCalls,
    });

    for (
      const toolCall of toolCalls
    ) {
      if (
        toolCallCount >=
        MAX_TOOL_CALLS_PER_REQUEST
      ) {
        break;
      }

      const toolName =
        toolCall.function
          ?.name;

      if (
        !toolName ||
        typeof toolName !==
          "string"
      ) {
        continue;
      }

      try {
        toolCallCount += 1;

        const toolResult =
          await executeTool(
            toolName,
            authenticatedUserId,
          );

        messages.push({
          role: "tool",
          content:
            toolResult,
          tool_call_id:
            toolCall.id,
          name: toolName,
        });
      } catch (error) {
        console.error(
          `AI support tool failed: ${toolName}`,
          error,
        );

        messages.push({
          role: "tool",
          content:
            JSON.stringify({
              success: false,
              found: false,
              error:
                "Unable to retrieve the requested account information.",
            }),
          tool_call_id:
            toolCall.id,
          name: toolName,
        });
      }
    }
  }

  return null;
}

/* ============================================================
   KNOWLEDGE SEARCH
============================================================ */

async function loadKnowledge(
  message: string,
): Promise<{
  results: unknown[];
  text: string;
}> {
  try {
    const results =
      await searchKnowledge(
        message,
        5,
      );

    if (
      !Array.isArray(results)
    ) {
      return {
        results: [],
        text: "",
      };
    }

    const text =
      knowledgeToText(
        results,
      );

    return {
      results,
      text:
        typeof text ===
        "string"
          ? text.trim()
          : "",
    };
  } catch (error) {
    console.error(
      "Knowledge search failed:",
      error,
    );

    return {
      results: [],
      text: "",
    };
  }
}

/* ============================================================
   CUSTOM TRAINING FALLBACK
============================================================ */

async function runCustomTrainingFallback(
  message: string,
): Promise<AIResponse | null> {
  try {
    const result =
      await generateCustomTrainingResponse(
        message,
      );

    if (!result) {
      return null;
    }

    const answer =
      typeof result.message ===
      "string"
        ? result.message.trim()
        : "";

    if (!answer) {
      return null;
    }

    /*
     * Do not use weak/no-match training
     * content as a reliable answer.
     */
    if (
      result.confidence <
      0.55
    ) {
      return null;
    }

    return {
      success: true,
      message: answer,
      source: "TRAINING",
      confidence:
        result.confidence,
      matchedDocuments:
        result.matchedDocuments,
    };
  } catch (error) {
    console.error(
      "Custom training AI fallback failed:",
      error,
    );

    return null;
  }
}

/* ============================================================
   HUMAN FALLBACK
============================================================ */

function humanFallback(): AIResponse {
  return {
    success: true,
    source: "HUMAN",
    message:
      "I could not find a reliable answer for your question. Please create a support ticket so our admin support team can help you.",
  };
}

/* ============================================================
   HANDLER
============================================================ */

export const handler: Handler =
  async (
    event: HandlerEvent,
    _context: HandlerContext,
  ) => {
    try {
      /* ======================================================
         METHOD
      ====================================================== */

      if (
        event.httpMethod !==
        "POST"
      ) {
        return response(
          405,
          {
            success: false,
            message:
              "Method not allowed.",
          },
        );
      }

      /* ======================================================
         AUTHENTICATION
      ====================================================== */

      let user;

      try {
        user =
          await requireAuth(
            event,
          );
      } catch (error) {
        console.error(
          "AI support authentication error:",
          error,
        );

        const statusCode =
          error &&
          typeof error ===
            "object" &&
          "statusCode" in
            error
            ? Number(
                (
                  error as {
                    statusCode?: unknown;
                  }
                ).statusCode,
              )
            : 401;

        const safeStatusCode =
          Number.isInteger(
            statusCode,
          ) &&
          statusCode >= 200 &&
          statusCode <= 599
            ? statusCode
            : 401;

        const message =
          error instanceof
          Error
            ? error.message
            : "Authentication required. Please log in again.";

        return response(
          safeStatusCode,
          {
            success: false,
            message,
          },
        );
      }

      /*
       * Never trust a user-provided ID.
       */
      const authenticatedUserId =
        typeof user?.id ===
        "string"
          ? user.id.trim()
          : typeof user?.userId ===
              "string"
            ? user.userId.trim()
            : "";

      if (
        !authenticatedUserId
      ) {
        return response(
          401,
          {
            success: false,
            message:
              "Authenticated user not found.",
          },
        );
      }

      /* ======================================================
         REQUEST BODY
      ====================================================== */

      let body:
        | SupportRequestBody
        | null = null;

      try {
        body = event.body
          ? (JSON.parse(
              event.body,
            ) as SupportRequestBody)
          : {};
      } catch {
        return response(
          400,
          {
            success: false,
            message:
              "Invalid JSON request body.",
          },
        );
      }

      const message =
        getUserMessage(
          body,
        );

      if (!message) {
        return response(
          400,
          {
            success: false,
            message:
              "Please enter a support message.",
          },
        );
      }

      if (
        message.length >
        MAX_MESSAGE_LENGTH
      ) {
        return response(
          400,
          {
            success: false,
            message:
              `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
          },
        );
      }

      /* ======================================================
         AI SUPPORT SETTING
      ====================================================== */

      let aiEnabled = true;

      try {
        aiEnabled =
          await getAISupportEnabled();
      } catch (error) {
        console.error(
          "Unable to read AI support setting:",
          error,
        );

        /*
         * External AI fails closed.
         * Account/training fallback still works.
         */
        aiEnabled = false;
      }

      /* ======================================================
         RATE LIMIT
      ====================================================== */

      try {
        const rateLimit =
          await checkRateLimitDetailed(
            authenticatedUserId,
          );

        if (
          rateLimit &&
          rateLimit.allowed ===
            false
        ) {
          return response(
            429,
            {
              success: false,
              message:
                "You have sent too many support messages. Please try again later.",
            },
          );
        }
      } catch (error) {
        /*
         * Rate-limit infrastructure failure
         * must not destroy support.
         */
        console.error(
          "Rate limit check failed:",
          error,
        );
      }

      /* ======================================================
         ACCOUNT INTENT
      ====================================================== */

      const accountIntent =
        detectAccountIntent(
          message,
        );

      /*
       * ------------------------------------------------------
       * IMPORTANT
       *
       * Account-specific questions are handled BEFORE
       * relying on OpenRouter to decide whether a tool
       * should be called.
       *
       * This fixes cases such as:
       *
       * "balance not update yet after deposit"
       * ------------------------------------------------------
       */

      if (accountIntent) {
        const accountResult =
          await loadAccountData(
            accountIntent,
            authenticatedUserId,
          );

        /*
         * ----------------------------------------------------
         * ACCOUNT DATA AVAILABLE
         * ----------------------------------------------------
         */
        if (
          !accountResult.failed
        ) {
          /*
           * First give OpenRouter the authoritative
           * database data if AI is enabled.
           *
           * OpenRouter failure is intentionally caught
           * and does NOT become HTTP 502.
           */
          if (aiEnabled) {
            try {
              const accountContext =
                accountDataToText(
                  accountIntent,
                  accountResult.data,
                );

              const knowledge =
                await loadKnowledge(
                  message,
                );

              const combinedKnowledge =
                [
                  knowledge.text,
                  accountContext,
                ]
                  .filter(
                    (value) =>
                      Boolean(
                        value &&
                        value.trim(),
                      ),
                  )
                  .join(
                    "\n\n",
                  );

              const answer =
                await runOpenRouter(
                  authenticatedUserId,
                  message,
                  getHistory(body),
                  combinedKnowledge,
                );

              if (
                answer &&
                answer.trim()
              ) {
                return response(
                  200,
                  {
                    success: true,
                    message:
                      answer.trim(),
                    source:
                      "OPENROUTER",
                  },
                );
              }
            } catch (error) {
              /*
               * ------------------------------------------------
               * CRITICAL FALLBACK
               *
               * OpenRouter 429 / 502 / timeout / provider
               * failure must NEVER break account support.
               * ------------------------------------------------
               */
              console.error(
                "OpenRouter account-support error; using deterministic fallback:",
                error,
              );
            }
          }

          /*
           * ----------------------------------------------------
           * DETERMINISTIC ACCOUNT RESPONSE
           * ----------------------------------------------------
           *
           * This does not depend on OpenRouter.
           */
          const accountResponse =
            deterministicAccountResponse(
              message,
              accountIntent,
              accountResult.data,
            );

          if (
            accountResponse
          ) {
            return response(
              200,
              accountResponse,
            );
          }
        } else {
          /*
           * Database/tool failure.
           *
           * Do NOT expose database errors.
           * Continue to normal training fallback.
           */
          console.warn(
            "Account data unavailable; continuing to training fallback.",
          );
        }
      }

      /* ======================================================
         GENERAL KNOWLEDGE SEARCH
      ====================================================== */

      const knowledge =
        await loadKnowledge(
          message,
        );

      /* ======================================================
         GENERAL OPENROUTER
      ====================================================== */

      if (
        aiEnabled
      ) {
        try {
          const answer =
            await runOpenRouter(
              authenticatedUserId,
              message,
              getHistory(body),
              knowledge.text,
            );

          if (
            answer &&
            answer.trim()
          ) {
            return response(
              200,
              {
                success: true,
                message:
                  answer.trim(),
                source:
                  "OPENROUTER",
              },
            );
          }
        } catch (error) {
          /*
           * OpenRouter is optional.
           *
           * 429
           * timeout
           * 5xx
           * provider failure
           * unavailable model
           * tool failure
           *
           * all continue to local fallback.
           */
          console.error(
            "OpenRouter support error; continuing to fallback:",
            error,
          );
        }
      }

      /* ======================================================
         LOCAL CUSTOM TRAINING AI
      ====================================================== */

      const trainingResponse =
        await runCustomTrainingFallback(
          message,
        );

      if (
        trainingResponse
      ) {
        return response(
          200,
          trainingResponse,
        );
      }

      /* ======================================================
         HUMAN SUPPORT
      ====================================================== */

      return response(
        200,
        humanFallback(),
      );
    } catch (error) {
      /*
       * ------------------------------------------------------
       * LAST-RESORT ERROR HANDLING
       *
       * Never expose internal database/OpenRouter details.
       * ------------------------------------------------------
       */
      console.error(
        "AI SUPPORT UNHANDLED ERROR:",
        error,
      );

      return response(
        500,
        {
          success: false,
          message:
            "AI support is temporarily unavailable. Please try again or contact support.",
        },
      );
    }
  };
