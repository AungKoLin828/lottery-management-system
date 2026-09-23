// netlify/functions/ai/toolDefinitions.ts

/* ============================================================
   OPENROUTER TOOL TYPE
============================================================ */

export interface OpenRouterTool {
  type: "function";

  function: {
    name: string;
    description: string;

    parameters: {
      type: "object";

      properties: Record<
        string,
        {
          type: string;
          description?: string;
          minimum?: number;
          maximum?: number;
          enum?: string[];
        }
      >;

      required?: string[];

      additionalProperties?: boolean;
    };
  };
}

/* ============================================================
   TOOL DEFINITIONS
============================================================ */

export const TOOL_DEFINITIONS: OpenRouterTool[] = [
  {
    type: "function",

    function: {
      name: "getMyWallet",

      description:
        "Get the authenticated player's current wallet balance and wallet totals.",

      parameters: {
        type: "object",

        properties: {},

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "getMyLatestDeposit",

      description: "Get the authenticated player's latest deposit.",

      parameters: {
        type: "object",

        properties: {},

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "getMyLatestWithdrawal",

      description: "Get the authenticated player's latest withdrawal.",

      parameters: {
        type: "object",

        properties: {},

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "getMyRecentTransactions",

      description: "Get the authenticated player's recent transactions.",

      parameters: {
        type: "object",

        properties: {
          limit: {
            type: "integer",

            minimum: 1,

            maximum: 10,
          },
        },

        additionalProperties: false,
      },
    },
  },

  {
    type: "function",

    function: {
      name: "getMySupportTickets",

      description: "Get the authenticated player's support tickets.",

      parameters: {
        type: "object",

        properties: {},

        additionalProperties: false,
      },
    },
  },
];
