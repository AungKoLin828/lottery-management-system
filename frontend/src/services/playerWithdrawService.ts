/* ============================================================
   TYPES
============================================================ */

export interface CreateWithdrawRequest {
  amount: number;
  paymentMethodId: string;
  accountName: string;
  accountNumber: string;
  note?: string;
}

export interface WithdrawResponse {
  id: string;
  requestedAmount: number;
  fee: number;
  paymentMethodId: string;
  paymentMethodName: string;
  accountName: string;
  accountNumber: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  createdAt: string;
  isFirstWithdrawal: boolean;
}

export interface CreateWithdrawApiResponse {
  success: boolean;
  message: string;
  withdrawal?: WithdrawResponse;
}

/* ============================================================
   CREATE WITHDRAWAL
============================================================ */

export async function createPlayerWithdrawal(
  request: CreateWithdrawRequest,
): Promise<CreateWithdrawApiResponse> {
  const response = await fetch(
    "/api/player/withdraw-request",
    {
      method: "POST",

      credentials: "include",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(request),
    },
  );

  let data: CreateWithdrawApiResponse;

  try {
    data =
      (await response.json()) as CreateWithdrawApiResponse;
  } catch {
    throw new Error(
      "Unable to read server response.",
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        "Unable to submit withdrawal request.",
    );
  }

  return data;
}