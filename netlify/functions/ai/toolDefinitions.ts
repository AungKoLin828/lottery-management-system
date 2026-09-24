/* ============================================================
   OPENROUTER TOOL TYPES
============================================================ */

export interface OpenRouterToolProperty {
  type: string;

  description?: string;

  enum?: string[];

  minimum?: number;

  maximum?: number;
}

export interface OpenRouterToolFunction {
  name: string;

  description: string;

  parameters: {
    type: "object";

    properties: Record<
      string,
      OpenRouterToolProperty
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

export const TOOL_DEFINITIONS:
  OpenRouterTool[] = [
    /* --------------------------------------------------------
       WALLET
    -------------------------------------------------------- */

    {
      type: "function",

      function: {
        name:
          "getMyWallet",

        description:
          "Get the authenticated player's current wallet balance and wallet totals. Use this when the player asks about their own wallet or balance.",

        parameters: {
          type:
            "object",

          properties: {},

          required: [],

          additionalProperties:
            false,
        },
      },
    },

    /* --------------------------------------------------------
       LATEST DEPOSIT
    -------------------------------------------------------- */

    {
      type: "function",

      function: {
        name:
          "getMyLatestDeposit",

        description:
          "Get the authenticated player's latest deposit and its current status. Use this when the player asks about their latest deposit.",

        parameters: {
          type:
            "object",

          properties: {},

          required: [],

          additionalProperties:
            false,
        },
      },
    },

    /* --------------------------------------------------------
       LATEST WITHDRAWAL
    -------------------------------------------------------- */

    {
      type: "function",

      function: {
        name:
          "getMyLatestWithdrawal",

        description:
          "Get the authenticated player's latest withdrawal and its current status. Use this when the player asks about their latest withdrawal.",

        parameters: {
          type:
            "object",

          properties: {},

          required: [],

          additionalProperties:
            false,
        },
      },
    },

    /* --------------------------------------------------------
       RECENT TRANSACTIONS
    -------------------------------------------------------- */

    {
      type: "function",

      function: {
        name:
          "getMyRecentTransactions",

        description:
          "Get the authenticated player's recent wallet transactions. Use this when the player asks about transaction history.",

        parameters: {
          type:
            "object",

          properties: {
            limit: {
              type:
                "integer",

              description:
                "Number of recent transactions to return. Use a value from 1 to 10.",

              minimum:
                1,

              maximum:
                10,
            },
          },

          required: [],

          additionalProperties:
            false,
        },
      },
    },
  ];