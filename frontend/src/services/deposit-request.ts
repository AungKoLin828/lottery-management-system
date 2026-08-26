/* ============================================================
   PLAYER DEPOSIT REQUEST SERVICE
   ============================================================

   All deposit requests are stored in PostgreSQL through
   the Netlify Functions API.

   This file does NOT use localStorage.
============================================================ */

export interface CreateDepositRequestPayload {
  amount: number;
  paymentMethodId: string;
  transactionNumber: string;
  note?: string;
}

export interface DepositRequestResponse {
  success: boolean;
  message?: string;
  data?: {
    deposit?: DepositRequest;
  };
}

export interface DepositRequest {
  id: string;
  userId: string;
  requestedAmount: string | number;
  approvedAmount?: string | number | null;
  paymentMethodId: string;
  transactionNumber?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  note?: string | null;
  rejectionReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ============================================================
   API RESPONSE PARSER
============================================================ */

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `API returned ${response.status} ${response.statusText} with an empty response.`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    console.error("Deposit API returned non-JSON:", text.slice(0, 2000));

    throw new Error(
      `API returned ${response.status} ${response.statusText} instead of JSON.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(
      "Failed to parse deposit API response:",
      error,
      text.slice(0, 2000),
    );

    throw new Error("The deposit API returned invalid JSON.");
  }
}

/* ============================================================
   CREATE DEPOSIT REQUEST
============================================================ */

export async function createDepositRequest(
  payload: CreateDepositRequestPayload,
): Promise<DepositRequest> {
  const response = await fetch("/api/player/deposit-request", {
    method: "POST",

    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      amount: payload.amount,
      paymentMethodId: payload.paymentMethodId,
      transactionNumber: payload.transactionNumber,
      note: payload.note || null,
    }),
  });

  const result = await parseApiResponse<DepositRequestResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message ||
        `Failed to create deposit request. (${response.status})`,
    );
  }

  if (!result.data?.deposit) {
    throw new Error(
      "Deposit request was created but no deposit data was returned.",
    );
  }

  return result.data.deposit;
}

/* ============================================================
   GET MY DEPOSIT REQUESTS
============================================================ */

export async function getMyDepositRequests(): Promise<DepositRequest[]> {
  const response = await fetch("/api/player/deposit-request", {
    method: "GET",

    credentials: "include",

    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  const result = await parseApiResponse<{
    success: boolean;
    message?: string;
    data?: {
      deposits?: DepositRequest[];
    };
  }>(response);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Failed to load deposit requests. (${response.status})`,
    );
  }

  return result.data?.deposits ?? [];
}
