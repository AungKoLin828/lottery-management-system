// netlify/functions/ai/toolDefinitions.ts

/* ============================================================
   OPENROUTER TOOL TYPES
============================================================ */

export interface OpenRouterToolFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
        minimum?: number;
        maximum?: number;
      }
    >;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface OpenRouterTool {
  type: "function";

  function: OpenRouterToolFunction;
}

/* ============================================================
   TOOL DEFINITIONS
============================================================ */

export const TOOL_DEFINITIONS: OpenRouterTool[] = [
  /* ----------------------------------------------------------
     WALLET
  ---------------------------------------------------------- */

  {
    type: "function",

    function: {
      name: "getMyWallet",

      description:
        "Get the authenticated player's current wallet balance and wallet information. Use this when the player asks about their balance or wallet.",

      parameters: {
        type: "object",

        properties: {},

        required: [],

        additionalProperties: false,
      },
    },
  },

  /* ----------------------------------------------------------
     LATEST DEPOSIT
  ---------------------------------------------------------- */

  {
    type: "function",

    function: {
      name: "getMyLatestDeposit",

      description:
        "Get the authenticated player's latest deposit and its current status. Use this when the player asks about their latest deposit.",

      parameters: {
        type: "object",

        properties: {},

        required: [],

        additionalProperties: false,
      },
    },
  },

  /* ----------------------------------------------------------
     LATEST WITHDRAWAL
  ---------------------------------------------------------- */

  {
    type: "function",

    function: {
      name: "getMyLatestWithdrawal",

      description:
        "Get the authenticated player's latest withdrawal and its current status. Use this when the player asks about their latest withdrawal.",

      parameters: {
        type: "object",

        properties: {},

        required: [],

        additionalProperties: false,
      },
    },
  },

  /* ----------------------------------------------------------
     RECENT TRANSACTIONS
  ---------------------------------------------------------- */

  {
    type: "function",

    function: {
      name: "getMyRecentTransactions",

      description:
        "Get the authenticated player's recent wallet transactions. Use this when the player asks about recent transactions or transaction history.",

      parameters: {
        type: "object",

        properties: {
          limit: {
            type: "integer",

            description:
              "Maximum number of recent transactions to return. Use a value between 1 and 20.",

            minimum: 1,

            maximum: 20,
          },
        },

        required: [],

        additionalProperties: false,
      },
    },
  },
];
