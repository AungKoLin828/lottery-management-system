/*
 * ============================================================
 * AI SUPPORT
 * ============================================================
 *
 * Flow:
 *
 * USER MESSAGE
 *      |
 *      v
 * AUTHENTICATED USER
 *      |
 *      v
 * ACCOUNT INTENT DETECTION
 *      |
 *      +-----------------------------+
 *      |                             |
 *      v                             v
 * LIVE ACCOUNT DATA             GENERAL QUESTION
 * wallet/deposit/etc                  |
 *      |                              v
 *      |                       OPENROUTER AI
 *      |                              |
 *      |                         failure/empty
 *      |                              |
 *      +--------------+---------------+
 *                     |
 *                     v
 *             CUSTOM TRAINING AI
 *                     |
 *                  no match
 *                     |
 *                     v
 *                   HUMAN
 *
 * IMPORTANT
 * - Never trust user-provided userId.
 * - Account tools always use authenticated user ID.
 * - Account tools are READ-ONLY.
 * - OpenRouter failure must not become HTTP 502.
 * - Training fallback must not invent account data.
 * ============================================================
 */

import type {
  Handler,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";

import {
  requireAuth,
  jsonResponse,
  type AuthenticatedUser,
} from "./auth";

import {
  getAISupportEnabled,
} from "./settings";

import {
  checkRateLimitDetailed,
} from "./rateLimit";

import {
  searchKnowledge,
  knowledgeToText,
  type KnowledgeResult,
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

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const MAX_MESSAGE_LENGTH = 2000;

const MAX_HISTORY_MESSAGES = 10;

const MAX_TOOL_ROUNDS = 2;

const MAX_TOOL_CALLS_PER_REQUEST = 4;

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type SupportSource =
  | "OPENROUTER"
  | "TRAINING"
  | "HUMAN";

type AccountIntent =
  | "WALLET_BALANCE"
  | "BALANCE_AFTER_DEPOSIT"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSACTIONS"
  | null;

interface SupportRequestBody {
  message?: unknown;
  messages?: unknown;
}

interface SupportResponse {
  success: boolean;
  answer: string;
  source: SupportSource;
  intent: AccountIntent;
  confidence: number;
  fallback: boolean;
}

interface AccountData {
  wallet?: Awaited<
    ReturnType<typeof getMyWallet>
  >;

  deposit?: Awaited<
    ReturnType<typeof getMyLatestDeposit>
  >;

  withdrawal?: Awaited<
    ReturnType<typeof getMyLatestWithdrawal>
  >;

  transactions?: Awaited<
    ReturnType<typeof getMyRecentTransactions>
  >;
}

/*
 * ============================================================
 * BASIC HELPERS
 * ============================================================
 */

function response(
  statusCode: number,
  body: unknown,
): Response {
  return jsonResponse(
    body,
    statusCode,
  );
}

function errorResponse(
  statusCode: number,
  message: string,
): Response {
  return response(
    statusCode,
    {
      success: false,
      error: message,
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function stringValue(
  value: unknown,
): string {
  if (value == null) {
    return "";
  }

  return String(value);
}

/*
 * ============================================================
 * TEXT NORMALIZATION
 * ============================================================
 *
 * IMPORTANT:
 *
 * Do NOT replace this with a multiline regex.
 *
 * The previous multiline regex caused:
 *
 *   ERROR: Unterminated regular expression
 *
 * during Netlify/esbuild bundling.
 * ============================================================
 */

function normalizeSupportText(
  value: string,
): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function containsAny(
  text: string,
  words: string[],
): boolean {
  return words.some(
    (word) =>
      text.includes(word),
  );
}

/*
 * ============================================================
 * ACCOUNT INTENT DETECTION
 * ============================================================
 */

function detectAccountIntent(
  message: string,
): AccountIntent {
  const text =
    normalizeSupportText(
      message,
    );

  const balanceWords = [
    "balance",
    "wallet balance",
    "my balance",
    "account balance",
    "current balance",
    "available balance",
    "လက်ကျန်",
    "ငွေလက်ကျန်",
  ];

  const depositWords = [
    "deposit",
    "deposited",
    "depositing",
    "deposit amount",
    "deposit status",
    "ငွေသွင်း",
    "ငွေသွင်းထား",
    "ငွေသွင်းပြီး",
  ];

  const notUpdatedWords = [
    "not update",
    "not updated",
    "does not update",
    "doesnt update",
    "did not update",
    "didnt update",
    "not showing",
    "not reflected",
    "not added",
    "missing",
    "still not",
    "balance unchanged",
    "balance is unchanged",
    "balance has not changed",
    "balance hasnt changed",
    "ငွေမတက်",
    "လက်ကျန်မတက်",
    "လက်ကျန်မပြ",
    "လက်ကျန်မပြောင်း",
    "လက်ကျန်မတိုး",
  ];

  const withdrawalWords = [
    "withdrawal",
    "withdraw",
    "withdrawn",
    "cash out",
    "withdrawal status",
    "ငွေထုတ်",
    "ငွေထုတ်ထား",
    "ငွေထုတ်ပြီး",
  ];

  const transactionWords = [
    "transaction",
    "transactions",
    "transaction history",
    "history",
    "recent transactions",
    "ငွေလွှဲမှတ်တမ်း",
    "မှတ်တမ်း",
  ];

  const hasBalance =
    containsAny(
      text,
      balanceWords,
    );

  const hasDeposit =
    containsAny(
      text,
      depositWords,
    );

  const hasNotUpdated =
    containsAny(
      text,
      notUpdatedWords,
    );

  /*
   * Example:
   *
   * "I have deposit. but balance does not update"
   *
   * => BALANCE_AFTER_DEPOSIT
   */

  if (
    hasDeposit &&
    (
      hasBalance ||
      hasNotUpdated
    )
  ) {
    return "BALANCE_AFTER_DEPOSIT";
  }

  if (hasBalance) {
    return "WALLET_BALANCE";
  }

  if (hasDeposit) {
    return "DEPOSIT";
  }

  if (
    containsAny(
      text,
      withdrawalWords,
    )
  ) {
    return "WITHDRAWAL";
  }

  if (
    containsAny(
      text,
      transactionWords,
    )
  ) {
    return "TRANSACTIONS";
  }

  return null;
}

/*
 * ============================================================
 * REQUEST MESSAGE
 * ============================================================
 */

function extractUserMessage(
  body: SupportRequestBody,
): string {
  if (
    typeof body.message ===
      "string" &&
    body.message.trim()
  ) {
    return body.message.trim();
  }

  if (
    Array.isArray(
      body.messages,
    )
  ) {
    const messages =
      body.messages;

    for (
      let index =
        messages.length - 1;
      index >= 0;
      index -= 1
    ) {
      const item =
        messages[index];

      if (
        !isRecord(item)
      ) {
        continue;
      }

      const role =
        stringValue(
          item.role,
        ).toLowerCase();

      const content =
        stringValue(
          item.content,
        ).trim();

      if (
        role === "user" &&
        content
      ) {
        return content;
      }
    }
  }

  return "";
}

/*
 * ============================================================
 * CONVERSATION HISTORY
 * ============================================================
 */

function extractHistory(
  body: SupportRequestBody,
): OpenRouterMessage[] {
  if (
    !Array.isArray(
      body.messages,
    )
  ) {
    return [];
  }

  const result: OpenRouterMessage[] =
    [];

  for (
    const item of body.messages
  ) {
    if (
      !isRecord(item)
    ) {
      continue;
    }

    const role =
      stringValue(
        item.role,
      ).toLowerCase();

    const content =
      stringValue(
        item.content,
      ).trim();

    if (
      (
        role === "user" ||
        role === "assistant" ||
        role === "system"
      ) &&
      content
    ) {
      result.push({
        role:
          role as
            | "user"
            | "assistant"
            | "system",
        content,
      });
    }
  }

  return result.slice(
    -MAX_HISTORY_MESSAGES,
  );
}

/*
 * ============================================================
 * KNOWLEDGE SEARCH
 * ============================================================
 */

async function loadKnowledge(
  message: string,
): Promise<{
  results: KnowledgeResult[];
  text: string;
}> {
  try {
    const results =
      await searchKnowledge(
        message,
        5,
      );

    if (
      !results ||
      results.length === 0
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
      text: text.slice(
        0,
        8000,
      ),
    };
  } catch (error) {
    console.error(
      "AI knowledge search error:",
      error,
    );

    return {
      results: [],
      text: "",
    };
  }
}

/*
 * ============================================================
 * AUTHENTICATED USER ID
 * ============================================================
 */

function getAuthenticatedUserId(
  user: AuthenticatedUser,
): string {
  const userRecord =
    user as unknown as Record<
      string,
      unknown
    >;

  const candidate =
    userRecord.userId ??
    userRecord.id ??
    userRecord.sub;

  const userId =
    stringValue(
      candidate,
    ).trim();

  if (!userId) {
    throw new Error(
      "Authenticated user ID is missing",
    );
  }

  return userId;
}

/*
 * ============================================================
 * LOAD LIVE ACCOUNT DATA
 * ============================================================
 *
 * IMPORTANT:
 *
 * The userId comes only from the authenticated JWT.
 *
 * Never use a userId supplied by the player or AI model.
 * ============================================================
 */

async function loadAccountData(
  userId: string,
  intent: AccountIntent,
): Promise<AccountData> {
  const data: AccountData =
    {};

  switch (intent) {
    case "WALLET_BALANCE":
      data.wallet =
        await getMyWallet(
          userId,
        );
      break;

    case "BALANCE_AFTER_DEPOSIT":
      data.wallet =
        await getMyWallet(
          userId,
        );

      data.deposit =
        await getMyLatestDeposit(
          userId,
        );
      break;

    case "DEPOSIT":
      data.deposit =
        await getMyLatestDeposit(
          userId,
        );

      data.wallet =
        await getMyWallet(
          userId,
        );
      break;

    case "WITHDRAWAL":
      data.withdrawal =
        await getMyLatestWithdrawal(
          userId,
        );

      data.wallet =
        await getMyWallet(
          userId,
        );
      break;

    case "TRANSACTIONS":
      data.transactions =
        await getMyRecentTransactions(
          userId,
          10,
        );
      break;

    default:
      break;
  }

  return data;
}

/*
 * ============================================================
 * ACCOUNT VALUE HELPERS
 * ============================================================
 */

function formatAccountValue(
  value: unknown,
): string {
  const result =
    stringValue(
      value,
    );

  return result || "0";
}

function getDepositStatus(
  accountData: AccountData,
): string {
  if (
    !accountData.deposit ||
    !accountData.deposit.found
  ) {
    return "";
  }

  return stringValue(
    accountData.deposit.deposit
      ?.status,
  ).toUpperCase();
}

/*
 * ============================================================
 * DETERMINISTIC ACCOUNT RESPONSE
 * ============================================================
 *
 * These answers are based on live database values.
 *
 * No guessing.
 * ============================================================
 */

function deterministicAccountResponse(
  intent: AccountIntent,
  data: AccountData,
): {
  answer: string;
  confidence: number;
} | null {
  switch (intent) {
    /*
     * --------------------------------------------------------
     * WALLET BALANCE
     * --------------------------------------------------------
     */

    case "WALLET_BALANCE": {
      if (
        !data.wallet ||
        !data.wallet.found
      ) {
        return {
          answer:
            "I could not find your wallet information. Please contact our support team for assistance.",
          confidence: 0.95,
        };
      }

      const balance =
        formatAccountValue(
          data.wallet.balance,
        );

      return {
        answer:
          `Your current wallet balance is ${balance}.`,
        confidence: 0.98,
      };
    }

    /*
     * --------------------------------------------------------
     * BALANCE AFTER DEPOSIT
     * --------------------------------------------------------
     */

    case "BALANCE_AFTER_DEPOSIT": {
      const wallet =
        data.wallet;

      const deposit =
        data.deposit;

      if (
        !wallet ||
        !wallet.found
      ) {
        return {
          answer:
            "I could not find your wallet information. Please contact our support team so we can check your deposit and balance.",
          confidence: 0.95,
        };
      }

      const balance =
        formatAccountValue(
          wallet.balance,
        );

      if (
        !deposit ||
        !deposit.found ||
        !deposit.deposit
      ) {
        return {
          answer:
            `Your current wallet balance is ${balance}. I could not find a recent deposit record for your account. Please contact our support team if you have already made a deposit.`,
          confidence: 0.95,
        };
      }

      const amount =
        formatAccountValue(
          deposit.deposit.amount,
        );

      const status =
        getDepositStatus(
          data,
        );

      /*
       * APPROVED / COMPLETED
       */

      if (
        status === "APPROVED" ||
        status === "COMPLETED" ||
        status === "SUCCESS" ||
        status === "SUCCESSFUL"
      ) {
        return {
          answer:
            `Your latest deposit is ${amount} and its status is ${status}. Your current wallet balance is ${balance}. If the approved deposit amount is not reflected in this balance, please contact our support team so they can investigate the transaction.`,
          confidence: 0.99,
        };
      }

      /*
       * PENDING / PROCESSING
       */

      if (
        status === "PENDING" ||
        status === "PROCESSING"
      ) {
        return {
          answer:
            `Your latest deposit is ${amount} and its status is ${status}. Your current wallet balance is ${balance}. The deposit has not been confirmed yet, so the amount may not be reflected in your balance.`,
          confidence: 0.99,
        };
      }

      /*
       * REJECTED / FAILED / CANCELLED
       */

      if (
        status === "REJECTED" ||
        status === "FAILED" ||
        status === "CANCELLED" ||
        status === "CANCELED"
      ) {
        return {
          answer:
            `Your latest deposit is ${amount} and its status is ${status}. Your current wallet balance is ${balance}. The deposit is not currently confirmed as successful. Please contact our support team if you believe this is incorrect.`,
          confidence: 0.99,
        };
      }

      /*
       * UNKNOWN STATUS
       */

      return {
        answer:
          `Your latest deposit is ${amount} and its current status is ${status || "UNKNOWN"}. Your current wallet balance is ${balance}. Please contact our support team if the deposit should already be reflected in your balance.`,
        confidence: 0.97,
      };
    }

    /*
     * --------------------------------------------------------
     * DEPOSIT
     * --------------------------------------------------------
     */

    case "DEPOSIT": {
      if (
        !data.deposit ||
        !data.deposit.found ||
        !data.deposit.deposit
      ) {
        return {
          answer:
            "I could not find a recent deposit record for your account. Please contact our support team if you have already made a deposit.",
          confidence: 0.95,
        };
      }

      const amount =
        formatAccountValue(
          data.deposit.deposit.amount,
        );

      const status =
        getDepositStatus(
          data,
        );

      return {
        answer:
          `Your latest deposit is ${amount} and its current status is ${status || "UNKNOWN"}.`,
        confidence: 0.99,
      };
    }

    /*
     * --------------------------------------------------------
     * WITHDRAWAL
     * --------------------------------------------------------
     */

    case "WITHDRAWAL": {
      if (
        !data.withdrawal ||
        !data.withdrawal.found ||
        !data.withdrawal.withdrawal
      ) {
        return {
          answer:
            "I could not find a recent withdrawal record for your account. Please contact our support team if you have already requested a withdrawal.",
          confidence: 0.95,
        };
      }

      const amount =
        formatAccountValue(
          data.withdrawal.withdrawal.amount,
        );

      const status =
        stringValue(
          data.withdrawal.withdrawal.status,
        ).toUpperCase();

      const balance =
        data.wallet &&
        data.wallet.found
          ? formatAccountValue(
              data.wallet.balance,
            )
          : "";

      if (balance) {
        return {
          answer:
            `Your latest withdrawal is ${amount} and its current status is ${status || "UNKNOWN"}. Your current wallet balance is ${balance}.`,
          confidence: 0.99,
        };
      }

      return {
        answer:
          `Your latest withdrawal is ${amount} and its current status is ${status || "UNKNOWN"}.`,
        confidence: 0.99,
      };
    }

    /*
     * --------------------------------------------------------
     * TRANSACTIONS
     * --------------------------------------------------------
     */

    case "TRANSACTIONS": {
      if (
        !data.transactions
      ) {
        return null;
      }

      const transactions =
        data.transactions
          .transactions;

      if (
        !transactions ||
        transactions.length === 0
      ) {
        return {
          answer:
            "I could not find any recent transactions for your account.",
          confidence: 0.95,
        };
      }

      const lines =
        transactions
          .slice(0, 5)
          .map(
            (
              transaction,
              index,
            ) => {
              const type =
                stringValue(
                  transaction.type,
                ) ||
                "UNKNOWN";

              const amount =
                formatAccountValue(
                  transaction.amount,
                );

              const status =
                stringValue(
                  transaction.status,
                ) ||
                "UNKNOWN";

              return `${index + 1}. ${type}: ${amount} (${status})`;
            },
          );

      return {
        answer:
          `Here are your latest transactions:\n${lines.join("\n")}`,
        confidence: 0.98,
      };
    }

    default:
      return null;
  }
}

/*
 * ============================================================
 * TOOL RESULT
 * ============================================================
 */

function toolResultText(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
    );
  } catch {
    return String(value);
  }
}

/*
 * ============================================================
 * OPENROUTER TOOL EXECUTION
 * ============================================================
 */

async function executeTool(
  toolName: string,
  argumentsValue: unknown,
  userId: string,
): Promise<unknown> {
  let args: Record<
    string,
    unknown
  > = {};

  if (
    typeof argumentsValue ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          argumentsValue,
        );

      if (
        isRecord(parsed)
      ) {
        args = parsed;
      }
    } catch {
      args = {};
    }
  } else if (
    isRecord(
      argumentsValue,
    )
  ) {
    args =
      argumentsValue;
  }

  /*
   * IMPORTANT:
   *
   * Never use args.userId.
   *
   * Always use the authenticated user ID.
   */

  switch (toolName) {
    case "getMyWallet":
      return getMyWallet(
        userId,
      );

    case "getMyLatestDeposit":
      return getMyLatestDeposit(
        userId,
      );

    case "getMyLatestWithdrawal":
      return getMyLatestWithdrawal(
        userId,
      );

    case "getMyRecentTransactions": {
      const requestedLimit =
        Number(
          args.limit ?? 10,
        );

      const safeLimit =
        Number.isFinite(
          requestedLimit,
        )
          ? Math.min(
              Math.max(
                Math.floor(
                  requestedLimit,
                ),
                1,
              ),
              10,
            )
          : 10;

      return getMyRecentTransactions(
        userId,
        safeLimit,
      );
    }

    default:
      throw new Error(
        `Unsupported support tool: ${toolName}`,
      );
  }
}

/*
 * ============================================================
 * OPENROUTER
 * ============================================================
 *
 * Model selection remains inside openRouter.ts.
 *
 * This file does NOT specify a model.
 * ============================================================
 */

async function runOpenRouter(
  message: string,
  history: OpenRouterMessage[],
  knowledgeText: string,
  userId: string,
): Promise<string | null> {
  const messages: OpenRouterMessage[] =
    [
      {
        role: "system",
        content:
          SYSTEM_PROMPT,
      },
    ];

  /*
   * Knowledge context
   */

  if (knowledgeText) {
    messages.push({
      role: "system",
      content:
        `KNOWLEDGE BASE CONTEXT:\n${knowledgeText}`,
    });
  }

  /*
   * Conversation history
   */

  for (
    const item of history
  ) {
    if (
      item.role === "system"
    ) {
      continue;
    }

    messages.push({
      role: item.role,
      content: item.content,
    });
  }

  /*
   * Current message
   */

  messages.push({
    role: "user",
    content: message,
  });

  let toolRounds = 0;

  let toolCallCount = 0;

  while (
    toolRounds <
    MAX_TOOL_ROUNDS
  ) {
    toolRounds += 1;

    const result =
      await generateOpenRouterResponse(
        messages,
        TOOL_DEFINITIONS,
      );

    const content =
      typeof result?.content ===
      "string"
        ? result.content.trim()
        : "";

    const toolCalls =
      Array.isArray(
        result?.toolCalls,
      )
        ? result.toolCalls
        : [];

    /*
     * Normal answer
     */

    if (
      toolCalls.length === 0
    ) {
      return (
        content || null
      );
    }

    /*
     * Maximum tool calls
     */

    if (
      toolCallCount >=
      MAX_TOOL_CALLS_PER_REQUEST
    ) {
      return (
        content || null
      );
    }

    /*
     * Preserve assistant content
     */

    messages.push({
      role: "assistant",
      content:
        content || "",
    });

    /*
     * Execute tools
     */

    for (
      const toolCall of toolCalls
    ) {
      if (
        toolCallCount >=
        MAX_TOOL_CALLS_PER_REQUEST
      ) {
        break;
      }

      toolCallCount += 1;

      const call =
        toolCall as OpenRouterToolCall;

      const toolName =
        stringValue(
          call.function?.name ??
          call.name,
        );

      const rawArguments =
        call.function?.arguments ??
        call.arguments ??
        {};

      if (!toolName) {
        continue;
      }

      try {
        const toolResult =
          await executeTool(
            toolName,
            rawArguments,
            userId,
          );

        /*
         * Pass the read-only tool result back
         * into the next OpenRouter round.
         */
        messages.push({
          role: "system",
          content:
            `READ-ONLY TOOL RESULT (${toolName}):\n${toolResultText(toolResult)}`,
        });
      } catch (error) {
        console.error(
          `Support tool failed: ${toolName}`,
          error,
        );

        messages.push({
          role: "system",
          content:
            `READ-ONLY TOOL RESULT (${toolName}): The tool failed. Do not invent the missing information.`,
        });
      }
    }

    if (
      toolRounds >=
      MAX_TOOL_ROUNDS
    ) {
      break;
    }
  }

  return null;
}

/*
 * ============================================================
 * CUSTOM TRAINING AI
 * ============================================================
 */

async function runCustomTraining(
  message: string,
): Promise<{
  answer: string;
  confidence: number;
} | null> {
  try {
    const result =
      await generateCustomTrainingResponse(
        message,
      );

    if (!result) {
      return null;
    }

    const answer =
      stringValue(
        result.message,
      ).trim();

    if (!answer) {
      return null;
    }

    const confidence =
      Number(
        result.confidence,
      );

    /*
     * Do not use weak matches.
     */

    if (
      !Number.isFinite(
        confidence,
      ) ||
      confidence < 0.55
    ) {
      return null;
    }

    return {
      answer,
      confidence,
    };
  } catch (error) {
    console.error(
      "Custom training AI error:",
      error,
    );

    return null;
  }
}

/*
 * ============================================================
 * HUMAN FALLBACK
 * ============================================================
 */

function humanFallback(): SupportResponse {
  return {
    success: true,
    answer:
      "I could not find a reliable answer for your question. Your request should be handled by our support team.",
    source: "HUMAN",
    intent: null,
    confidence: 0,
    fallback: true,
  };
}

/*
 * ============================================================
 * REQUEST BODY
 * ============================================================
 */

function parseRequestBody(
  event: HandlerEvent,
): SupportRequestBody {
  if (!event.body) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(
        event.body,
      );

    if (
      !isRecord(parsed)
    ) {
      return {};
    }

    return parsed as SupportRequestBody;
  } catch {
    throw new Error(
      "Invalid JSON request body",
    );
  }
}

/*
 * ============================================================
 * MAIN HANDLER
 * ============================================================
 */

export const handler: Handler =
  async (
    event: HandlerEvent,
    _context: HandlerContext,
  ) => {
    /*
     * --------------------------------------------------------
     * METHOD
     * --------------------------------------------------------
     */

    if (
      event.httpMethod !== "POST"
    ) {
      return errorResponse(
        405,
        "Method not allowed",
      );
    }

    try {
      /*
       * ------------------------------------------------------
       * AUTH
       * ------------------------------------------------------
       *
       * requireAuth() returns the authenticated user directly.
       *
       * It does NOT return:
       *
       * { success, user }
       */

      const user =
        await requireAuth(
          event,
        );

      const userId =
        getAuthenticatedUserId(
          user,
        );

      /*
       * ------------------------------------------------------
       * BODY
       * ------------------------------------------------------
       */

      const body =
        parseRequestBody(
          event,
        );

      const message =
        extractUserMessage(
          body,
        );

      if (!message) {
        return errorResponse(
          400,
          "Message is required",
        );
      }

      if (
        message.length >
        MAX_MESSAGE_LENGTH
      ) {
        return errorResponse(
          400,
          `Message must be ${MAX_MESSAGE_LENGTH} characters or less`,
        );
      }

      /*
       * ------------------------------------------------------
       * AI ENABLED / DISABLED
       * ------------------------------------------------------
       */

      let aiEnabled = false;

      try {
        aiEnabled =
          await getAISupportEnabled();
      } catch (error) {
        console.error(
          "Failed to read AI support setting:",
          error,
        );

        /*
         * If the setting cannot be safely read,
         * disable OpenRouter but continue with
         * deterministic/training support.
         */
        aiEnabled = false;
      }

      /*
       * ------------------------------------------------------
       * RATE LIMIT
       * ------------------------------------------------------
       */

      try {
        const rateLimit =
          await checkRateLimitDetailed(
            userId,
          );

        if (
          rateLimit &&
          !rateLimit.allowed
        ) {
          return errorResponse(
            429,
            "Too many support requests. Please try again shortly.",
          );
        }
      } catch (error) {
        /*
         * Rate-limit service failure should not make
         * the support system unavailable.
         */
        console.error(
          "Support rate-limit check failed:",
          error,
        );
      }

      /*
       * ------------------------------------------------------
       * INTENT
       * ------------------------------------------------------
       */

      const intent =
        detectAccountIntent(
          message,
        );

      console.log(
        "AI SUPPORT REQUEST",
        {
          userId,
          intent,
          aiEnabled,
          messageLength:
            message.length,
        },
      );

      /*
       * ------------------------------------------------------
       * LIVE ACCOUNT SUPPORT
       * ------------------------------------------------------
       *
       * This is BEFORE OpenRouter.
       *
       * Example:
       *
       * "I have deposit. but balance does not update"
       *
       * will directly query:
       *
       * getMyWallet()
       * getMyLatestDeposit()
       */

      if (intent) {
        try {
          const accountData =
            await loadAccountData(
              userId,
              intent,
            );

          const deterministic =
            deterministicAccountResponse(
              intent,
              accountData,
            );

          if (
            deterministic
          ) {
            return response(
              200,
              {
                success: true,
                answer:
                  deterministic.answer,
                source:
                  "TRAINING",
                intent,
                confidence:
                  deterministic.confidence,
                fallback: true,
              } satisfies SupportResponse,
            );
          }
        } catch (error) {
          /*
           * Do not return 502.
           *
           * Continue to OpenRouter/training fallback.
           */
          console.error(
            "Account support tools failed:",
            error,
          );
        }
      }

      /*
       * ------------------------------------------------------
       * KNOWLEDGE
       * ------------------------------------------------------
       */

      const knowledge =
        await loadKnowledge(
          message,
        );

      /*
       * ------------------------------------------------------
       * OPENROUTER
       * ------------------------------------------------------
       *
       * Dynamic model selection is handled by openRouter.ts.
       *
       * This code does NOT specify:
       *
       * AI_FREE_MODEL_1
       * AI_FREE_MODEL_2
       * AI_FREE_MODEL_3
       *
       * OpenRouter failure is caught and the request
       * continues to custom training.
       */

      if (aiEnabled) {
        try {
          const history =
            extractHistory(
              body,
            );

          const answer =
            await runOpenRouter(
              message,
              history,
              knowledge.text,
              userId,
            );

          if (
            answer &&
            answer.trim()
          ) {
            return response(
              200,
              {
                success: true,
                answer:
                  answer.trim(),
                source:
                  "OPENROUTER",
                intent,
                confidence: 0.95,
                fallback: false,
              } satisfies SupportResponse,
            );
          }
        } catch (error) {
          /*
           * Expected OpenRouter failures:
           *
           * - 429
           * - timeout
           * - provider unavailable
           * - model unavailable
           * - network error
           * - malformed provider response
           *
           * Never turn these into HTTP 502 here.
           */
          console.error(
            "OpenRouter support error:",
            error,
          );
        }
      }

      /*
       * ------------------------------------------------------
       * CUSTOM TRAINING AI
       * ------------------------------------------------------
       *
       * Works without OpenRouter.
       *
       * Uses training/ and knowledge/.
       */

      const customTraining =
        await runCustomTraining(
          message,
        );

      if (
        customTraining &&
        customTraining.answer
      ) {
        return response(
          200,
          {
            success: true,
            answer:
              customTraining.answer,
            source:
              "TRAINING",
            intent,
            confidence:
              customTraining.confidence,
            fallback: true,
          } satisfies SupportResponse,
        );
      }

      /*
       * ------------------------------------------------------
       * FINAL KNOWLEDGE FALLBACK
       * ------------------------------------------------------
       */

      if (
        knowledge.results.length >
          0 &&
        knowledge.text
      ) {
        const first =
          knowledge.results[0] as unknown as Record<
            string,
            unknown
          >;

        const possibleAnswer =
          stringValue(
            first.answer ??
              first.response ??
              first.reply ??
              first.content ??
              first.text,
          ).trim();

        if (
          possibleAnswer
        ) {
          return response(
            200,
            {
              success: true,
              answer:
                possibleAnswer.slice(
                  0,
                  4000,
                ),
              source:
                "TRAINING",
              intent,
              confidence: 0.6,
              fallback: true,
            } satisfies SupportResponse,
          );
        }
      }

      /*
       * ------------------------------------------------------
       * HUMAN SUPPORT
       * ------------------------------------------------------
       *
       * HTTP 200 is intentional.
       *
       * The outer conversation layer can detect:
       *
       * source === "HUMAN"
       *
       * and escalate/create a human support conversation.
       */

      const human =
        humanFallback();

      return response(
        200,
        human,
      );
    } catch (error) {
      /*
       * ------------------------------------------------------
       * AUTH ERROR
       * ------------------------------------------------------
       */

      if (
        error instanceof Error &&
        error.name === "AuthError"
      ) {
        return errorResponse(
          401,
          error.message ||
            "Authentication required",
        );
      }

      /*
       * ------------------------------------------------------
       * INVALID JSON
       * ------------------------------------------------------
       */

      if (
        error instanceof Error &&
        error.message ===
          "Invalid JSON request body"
      ) {
        return errorResponse(
          400,
          error.message,
        );
      }

      /*
       * ------------------------------------------------------
       * UNEXPECTED ERROR
       * ------------------------------------------------------
       */

      console.error(
        "AI SUPPORT UNHANDLED ERROR:",
        error,
      );

      return errorResponse(
        500,
        "I'm sorry, I couldn't process your request right now. Please try again or contact our support team directly.",
      );
    }
  };

export default handler;
