/* ============================================================
   WALLET SERVICE
   ============================================================
 *
 * Real database API service for:
 *
 * - Deposit requests
 * - Withdraw requests
 * - Wallet balance
 *
 * IMPORTANT:
 * The frontend does NOT write directly to PostgreSQL.
 * It calls Netlify Functions, which use Drizzle ORM.
 *
 * Authentication:
 * The existing auth cookie is automatically sent by the
 * browser when credentials are included.
 * ============================================================ */

import type { DepositRequest, WithdrawRequest } from "@/types/wallet";

/* ============================================================
   API RESPONSE TYPES
============================================================ */

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  message?: string;
  error?: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/* ============================================================
   DEPOSIT RESPONSE
============================================================ */

export interface CreateDepositResponse {
  deposit: DepositRequest;
}

/* ============================================================
   WITHDRAW RESPONSE
============================================================ */

export interface CreateWithdrawResponse {
  withdrawal: WithdrawRequest;
}

/* ============================================================
   DEPOSIT LIST RESPONSE
============================================================ */

export interface DepositListResponse {
  deposits: DepositRequest[];
}

/* ============================================================
   WITHDRAW LIST RESPONSE
============================================================ */

export interface WithdrawListResponse {
  withdrawals: WithdrawRequest[];
}

/* ============================================================
   API BASE
============================================================ */

const API_BASE = "/api";

/* ============================================================
   GENERIC API REQUEST
============================================================ */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,

    credentials: "include",

    headers: {
      "Content-Type": "application/json",

      ...(options.headers || {}),
    },
  });

  let result: ApiResponse<T> | null = null;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.error("Wallet API JSON parse error:", error);
  }

  if (!response.ok) {
    const message =
      result && "message" in result && result.message
        ? result.message
        : result && "error" in result && result.error
          ? result.error
          : `Request failed with status ${response.status}.`;

    throw new Error(message);
  }

  if (!result) {
    throw new Error("Empty response from server.");
  }

  if (!result.success) {
    throw new Error(result.message || result.error || "Request failed.");
  }

  return result.data;
}

/* ============================================================
   CREATE DEPOSIT REQUEST
============================================================ */

export interface CreateDepositInput {
  amount: number;

  paymentMethodId: string;

  transactionNumber: string;

  note?: string;
}

/**
 * Creates a real deposit request in PostgreSQL.
 *
 * Backend is responsible for:
 *
 * - Getting authenticated player from auth cookie
 * - Validating the user
 * - Validating payment method
 * - Checking payment method is enabled
 * - Checking payment method supports DEPOSIT
 * - Creating deposits row
 *
 * Do NOT send:
 *
 * - playerId
 * - playerName
 * - status
 * - createdAt
 * - updatedAt
 * - paymentMethodName
 *
 * Those values must be controlled by the backend.
 */
export async function createDepositRequest(
  input: CreateDepositInput,
): Promise<DepositRequest> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Invalid deposit amount.");
  }

  if (!input.paymentMethodId?.trim()) {
    throw new Error("Payment method is required.");
  }

  if (!input.transactionNumber?.trim()) {
    throw new Error("Transaction number is required.");
  }

  const transactionNumber = input.transactionNumber.trim();

  if (!/^\d{6}$/.test(transactionNumber)) {
    throw new Error(
      "Please enter the last 6 digits of your transaction number.",
    );
  }

  const data = await apiRequest<CreateDepositResponse>(
    "/player/deposit-request",
    {
      method: "POST",

      body: JSON.stringify({
        amount: input.amount,

        paymentMethodId: input.paymentMethodId,

        transactionNumber,

        note: input.note?.trim() || null,
      }),
    },
  );

  if (!data.deposit) {
    throw new Error("Deposit request was not returned by the server.");
  }

  return data.deposit;
}

/* ============================================================
   GET DEPOSIT REQUESTS
============================================================ */

export async function getDepositRequests(): Promise<DepositRequest[]> {
  const data = await apiRequest<DepositListResponse>(
    "/player/deposit-request",
    {
      method: "GET",
    },
  );

  return Array.isArray(data.deposits) ? data.deposits : [];
}

/* ============================================================
   GET SINGLE DEPOSIT REQUEST
============================================================ */

export async function getDepositRequest(
  depositId: string,
): Promise<DepositRequest> {
  if (!depositId?.trim()) {
    throw new Error("Deposit ID is required.");
  }

  const data = await apiRequest<CreateDepositResponse>(
    `/player/deposit-request/${encodeURIComponent(depositId)}`,
    {
      method: "GET",
    },
  );

  if (!data.deposit) {
    throw new Error("Deposit request not found.");
  }

  return data.deposit;
}

/* ============================================================
   CREATE WITHDRAW REQUEST
============================================================ */

export interface CreateWithdrawInput {
  amount: number;

  paymentMethodId: string;

  accountNumber?: string;

  accountName?: string;

  note?: string;
}

/**
 * Creates a real withdrawal request in PostgreSQL.
 *
 * This function intentionally does not generate an ID.
 * PostgreSQL should generate the UUID.
 */
export async function createWithdrawRequest(
  input: CreateWithdrawInput,
): Promise<WithdrawRequest> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Invalid withdrawal amount.");
  }

  if (!input.paymentMethodId?.trim()) {
    throw new Error("Payment method is required.");
  }

  const data = await apiRequest<CreateWithdrawResponse>(
    "/player/withdraw-request",
    {
      method: "POST",

      body: JSON.stringify({
        amount: input.amount,

        paymentMethodId: input.paymentMethodId,

        accountNumber: input.accountNumber?.trim() || null,

        accountName: input.accountName?.trim() || null,

        note: input.note?.trim() || null,
      }),
    },
  );

  if (!data.withdrawal) {
    throw new Error("Withdrawal request was not returned by the server.");
  }

  return data.withdrawal;
}

/* ============================================================
   GET WITHDRAW REQUESTS
============================================================ */

export async function getWithdrawRequests(): Promise<WithdrawRequest[]> {
  const data = await apiRequest<WithdrawListResponse>(
    "/player/withdraw-request",
    {
      method: "GET",
    },
  );

  return Array.isArray(data.withdrawals) ? data.withdrawals : [];
}

/* ============================================================
   GET SINGLE WITHDRAW REQUEST
============================================================ */

export async function getWithdrawRequest(
  withdrawalId: string,
): Promise<WithdrawRequest> {
  if (!withdrawalId?.trim()) {
    throw new Error("Withdrawal ID is required.");
  }

  const data = await apiRequest<CreateWithdrawResponse>(
    `/player/withdraw-request/${encodeURIComponent(withdrawalId)}`,
    {
      method: "GET",
    },
  );

  if (!data.withdrawal) {
    throw new Error("Withdrawal request not found.");
  }

  return data.withdrawal;
}

/* ============================================================
   WALLET BALANCE
============================================================ */

export interface WalletBalanceResponse {
  balance: number;
}

/**
 * Gets the authenticated player's current wallet balance
 * from the real database.
 */
export async function getWalletBalance(): Promise<number> {
  const data = await apiRequest<WalletBalanceResponse>(
    "/player/wallet/balance",
    {
      method: "GET",
    },
  );

  const balance = Number(data.balance);

  if (!Number.isFinite(balance)) {
    throw new Error("Invalid wallet balance returned by server.");
  }

  return balance;
}

/* ============================================================
   DEFAULT EXPORT
============================================================ */

const walletService = {
  createDepositRequest,

  getDepositRequests,

  getDepositRequest,

  createWithdrawRequest,

  getWithdrawRequests,

  getWithdrawRequest,

  getWalletBalance,
};

export default walletService;
