export type AdminDepositRequest = {
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

  createdAt?: string;
  updatedAt?: string;

  user?: {
    id?: string;
    username?: string | null;
    fullName?: string | null;
    phone?: string | null;
  };

  paymentMethod?: {
    id?: string;
    name?: string | null;
  };
};

type AdminDepositResponse = {
  success?: boolean;
  message?: string;
  data?: AdminDepositRequest[];
  deposits?: AdminDepositRequest[];
};

type ApproveDepositPayload = {
  approvedAmount?: number;
  note?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  let body: unknown;

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      throw new Error(body.message);
    }

    throw new Error(
      typeof body === "string" && body.trim()
        ? body
        : `Request failed with status ${response.status}`,
    );
  }

  return body as T;
}

/**
 * Get admin deposit requests.
 *
 * Netlify wrapper:
 * netlify/functions/admin-deposits.ts
 *
 * -> /api/admin-deposits
 */
export async function getAdminDepositRequests(): Promise<
  AdminDepositRequest[]
> {
  const response = await fetch("/api/admin-deposits", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const result = await parseResponse<AdminDepositResponse>(response);

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.deposits)) {
    return result.deposits;
  }

  return [];
}

/**
 * Approve a deposit.
 *
 * Netlify wrapper:
 * netlify/functions/admin-deposit-approve.ts
 *
 * -> /api/admin-deposit-approve
 */
export async function approveAdminDeposit(
  depositId: string,
  payload: ApproveDepositPayload = {},
): Promise<unknown> {
  const response = await fetch("/api/admin-deposit-approve", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      depositId,
      ...payload,
    }),
  });

  return parseResponse(response);
}

/**
 * Reject a deposit.
 *
 * Netlify wrapper:
 * netlify/functions/admin-deposit-reject.ts
 *
 * -> /api/admin-deposit-reject
 */
export async function rejectAdminDeposit(
  depositId: string,
  reason: string,
): Promise<unknown> {
  const response = await fetch("/api/admin-deposit-reject", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      depositId,
      reason,
    }),
  });

  return parseResponse(response);
}
