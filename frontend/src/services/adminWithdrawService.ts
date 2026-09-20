/* ============================================================
   ADMIN WITHDRAW SERVICE
   ============================================================ */

export type AdminWithdrawStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

/* ============================================================
   TYPES
   ============================================================ */

export interface AdminWithdrawUser {
  id: string;
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
}

export interface AdminWithdrawPaymentMethod {
  id: string;
  name: string;
  type?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
}

export interface AdminWithdrawRequest {
  id: string;
  userId: string;

  requestedAmount: number;
  approvedAmount: number | null;

  status: AdminWithdrawStatus;

  paymentMethodId: string;
  paymentMethod: AdminWithdrawPaymentMethod | null;

  accountNumber: string | null;
  accountName: string | null;

  transactionNumber: string | null;

  note: string | null;
  rejectionReason: string | null;

  createdAt: string;
  updatedAt: string | null;

  approvedAt: string | null;
  approvedBy: string | null;

  processedAt: string | null;

  user: AdminWithdrawUser | null;
}

/* ============================================================
   APPROVE / REJECT INPUT
   ============================================================ */

export interface ApproveAdminWithdrawInput {
  approvedAmount?: number;
  transactionNumber?: string;
  note?: string;
}

export interface RejectAdminWithdrawInput {
  reason: string;
}

/* ============================================================
   ERROR
   ============================================================ */

export class AdminWithdrawServiceError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);

    this.name = "AdminWithdrawServiceError";
    this.status = status;
    this.code = code;
  }
}

/* ============================================================
   INTERNAL TYPES
   ============================================================ */

type UnknownRecord = Record<string, unknown>;

interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
}

/* ============================================================
   HELPERS
   ============================================================ */

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function firstDefined(object: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] !== undefined &&
      object[key] !== null
    ) {
      return object[key];
    }
  }

  return undefined;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/* ============================================================
   ERROR MESSAGE
   ============================================================ */

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const message = firstDefined(payload, ["message", "error", "detail"]);

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (isRecord(message)) {
    const nestedMessage = firstDefined(message, ["message", "error", "detail"]);

    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return fallback;
}

/* ============================================================
   NORMALIZE USER
   ============================================================ */

function normalizeUser(value: unknown): AdminWithdrawUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = firstDefined(value, ["id", "userId", "user_id"]);

  if (id === undefined || id === null) {
    return null;
  }

  return {
    id: toStringValue(id),

    username: toNullableString(
      firstDefined(value, ["username", "userName", "user_name"]),
    ),

    fullName: toNullableString(
      firstDefined(value, ["fullName", "full_name", "name"]),
    ),

    phone: toNullableString(
      firstDefined(value, ["phone", "phoneNumber", "phone_number"]),
    ),
  };
}

/* ============================================================
   NORMALIZE PAYMENT METHOD
   ============================================================ */

function normalizePaymentMethod(
  value: unknown,
): AdminWithdrawPaymentMethod | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = firstDefined(value, [
    "id",
    "paymentMethodId",
    "payment_method_id",
  ]);

  if (id === undefined || id === null) {
    return null;
  }

  return {
    id: toStringValue(id),

    name: toStringValue(
      firstDefined(value, ["name", "methodName", "method_name"]),
    ),

    type: toNullableString(
      firstDefined(value, ["type", "methodType", "method_type"]),
    ),

    accountName: toNullableString(
      firstDefined(value, [
        "accountName",
        "account_name",
        "recipientName",
        "recipient_name",
        "recipientAccountName",
        "recipient_account_name",
      ]),
    ),

    accountNumber: toNullableString(
      firstDefined(value, [
        "accountNumber",
        "account_number",
        "account",
        "phoneNumber",
        "phone_number",
      ]),
    ),
  };
}

/* ============================================================
   NORMALIZE WITHDRAWAL
   ============================================================ */

function normalizeWithdraw(value: unknown): AdminWithdrawRequest {
  const item = asRecord(value);

  const id = firstDefined(item, ["id", "withdrawId", "withdraw_id"]);

  const userId = firstDefined(item, ["userId", "user_id"]);

  const requestedAmount = firstDefined(item, [
    "requestedAmount",
    "requested_amount",
    "amount",
    "withdrawAmount",
    "withdraw_amount",
    "withdrawalAmount",
    "withdrawal_amount",
  ]);

  const approvedAmount = firstDefined(item, [
    "approvedAmount",
    "approved_amount",
    "processedAmount",
    "processed_amount",
    "finalAmount",
    "final_amount",
  ]);

  const paymentMethodId = firstDefined(item, [
    "paymentMethodId",
    "payment_method_id",
  ]);

  const paymentMethod = firstDefined(item, ["paymentMethod", "payment_method"]);

  const user = firstDefined(item, ["user", "player"]);

  const accountNumber = firstDefined(item, [
    "accountNumber",
    "account_number",
    "account",
    "phoneNumber",
    "phone_number",
    "destinationAccount",
    "destination_account",
    "destinationAccountNumber",
    "destination_account_number",
  ]);

  const accountName = firstDefined(item, [
    "accountName",
    "account_name",
    "recipientName",
    "recipient_name",
    "recipientAccountName",
    "recipient_account_name",
  ]);

  const transactionNumber = firstDefined(item, [
    "transactionNumber",
    "transaction_number",
    "transactionId",
    "transaction_id",
    "referenceNumber",
    "reference_number",
    "reference",
  ]);

  const note = firstDefined(item, ["note", "notes"]);

  const rejectionReason = firstDefined(item, [
    "rejectionReason",
    "rejection_reason",
    "rejectReason",
    "reject_reason",
  ]);

  const createdAt = firstDefined(item, ["createdAt", "created_at"]);

  const updatedAt = firstDefined(item, ["updatedAt", "updated_at"]);

  const approvedAt = firstDefined(item, ["approvedAt", "approved_at"]);

  const approvedBy = firstDefined(item, [
    "approvedBy",
    "approved_by",
    "processedBy",
    "processed_by",
    "adminId",
    "admin_id",
  ]);

  const processedAt = firstDefined(item, ["processedAt", "processed_at"]);

  const statusValue = firstDefined(item, ["status"]);

  const normalizedStatus: AdminWithdrawStatus =
    statusValue === "APPROVED" ||
    statusValue === "REJECTED" ||
    statusValue === "CANCELLED" ||
    statusValue === "PENDING"
      ? statusValue
      : "PENDING";

  let normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

  /*
   * Some APIs return payment method information
   * directly on the withdrawal object.
   *
   * If nested paymentMethod is missing, build it
   * from the available fields.
   */
  if (
    !normalizedPaymentMethod &&
    paymentMethodId !== undefined &&
    paymentMethodId !== null
  ) {
    normalizedPaymentMethod = {
      id: toStringValue(paymentMethodId),

      name: toStringValue(
        firstDefined(item, [
          "paymentMethodName",
          "payment_method_name",
          "methodName",
          "method_name",
        ]),
      ),

      type: toNullableString(
        firstDefined(item, [
          "paymentMethodType",
          "payment_method_type",
          "methodType",
          "method_type",
        ]),
      ),

      accountName: toNullableString(accountName),

      accountNumber: toNullableString(accountNumber),
    };
  }

  /*
   * If account information is not directly available,
   * try to use payment method account information.
   */
  const finalAccountNumber =
    toNullableString(accountNumber) ??
    normalizedPaymentMethod?.accountNumber ??
    null;

  const finalAccountName =
    toNullableString(accountName) ??
    normalizedPaymentMethod?.accountName ??
    null;

  return {
    id: toStringValue(id),

    userId: toStringValue(userId),

    requestedAmount: toNumber(requestedAmount),

    approvedAmount: toNullableNumber(approvedAmount),

    status: normalizedStatus,

    paymentMethodId:
      paymentMethodId === null || paymentMethodId === undefined
        ? ""
        : String(paymentMethodId),

    paymentMethod: normalizedPaymentMethod,

    accountNumber: finalAccountNumber,

    accountName: finalAccountName,

    transactionNumber: toNullableString(transactionNumber),

    note: toNullableString(note),

    rejectionReason: toNullableString(rejectionReason),

    createdAt: toStringValue(createdAt),

    /*
     * IMPORTANT:
     * This must be `null`, not `undefined`.
     * TransactionManagement.tsx expects:
     *
     * updatedAt: string | null
     */
    updatedAt: toNullableString(updatedAt),

    approvedAt: toNullableString(approvedAt),

    approvedBy: toNullableString(approvedBy),

    processedAt: toNullableString(processedAt),

    user: normalizeUser(user),
  };
}

/* ============================================================
   RESPONSE EXTRACTION
   ============================================================ */

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const possibleArrays = [
    payload.data,
    payload.items,
    payload.results,
    payload.withdrawals,
    payload.requests,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      return value;
    }

    if (isRecord(value)) {
      const nestedArrays = [
        value.items,
        value.results,
        value.withdrawals,
        value.requests,
      ];

      for (const nested of nestedArrays) {
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }
  }

  return [];
}

function extractSingle(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  /*
   * Common response:
   * {
   *   data: {...}
   * }
   */
  if (payload.data !== undefined && payload.data !== null) {
    if (isRecord(payload.data)) {
      /*
       * Some APIs return:
       * {
       *   data: {
       *     withdrawal: {...}
       *   }
       * }
       */
      const nested = firstDefined(payload.data, [
        "withdrawal",
        "request",
        "item",
      ]);

      if (nested !== undefined) {
        return nested;
      }
    }

    return payload.data;
  }

  /*
   * Other common response:
   * {
   *   withdrawal: {...}
   * }
   */
  const withdrawal = firstDefined(payload, ["withdrawal", "request", "item"]);

  if (withdrawal !== undefined) {
    return withdrawal;
  }

  return payload;
}

/* ============================================================
   API REQUEST
   ============================================================ */

async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    options.body !== undefined &&
    options.body !== null &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Network request failed";

    throw new AdminWithdrawServiceError(message);
  }

  const contentType = response.headers.get("content-type") ?? "";

  let payload: unknown;

  try {
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();

      if (text.trim()) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      } else {
        payload = null;
      }
    }
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new AdminWithdrawServiceError(
      getErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      isRecord(payload) && typeof payload.code === "string"
        ? payload.code
        : undefined,
    );
  }

  return payload as T;
}

/* ============================================================
   GET ALL WITHDRAWAL REQUESTS
   ============================================================ */

export async function getAdminWithdrawRequests(): Promise<
  AdminWithdrawRequest[]
> {
  const payload = await request<unknown>("/api/admin/withdrawals", {
    method: "GET",
  });

  const items = extractItems(payload);

  return items.map(normalizeWithdraw);
}

/* ============================================================
   GET SINGLE WITHDRAWAL REQUEST
   ============================================================ */

export async function getAdminWithdrawRequest(
  withdrawId: string,
): Promise<AdminWithdrawRequest> {
  if (!withdrawId?.trim()) {
    throw new AdminWithdrawServiceError("Withdrawal ID is required.");
  }

  const payload = await request<unknown>(
    `/api/admin/withdrawals/${encodeURIComponent(withdrawId)}`,
    {
      method: "GET",
    },
  );

  const item = extractSingle(payload);

  return normalizeWithdraw(item);
}

/* ============================================================
   APPROVE WITHDRAWAL
   ============================================================ */

export async function approveAdminWithdraw(
  withdrawId: string,
  input: ApproveAdminWithdrawInput = {},
): Promise<AdminWithdrawRequest> {
  if (!withdrawId?.trim()) {
    throw new AdminWithdrawServiceError("Withdrawal ID is required.");
  }

  const body: Record<string, unknown> = {};

  if (input.approvedAmount !== undefined) {
    body.approvedAmount = input.approvedAmount;
  }

  if (input.transactionNumber !== undefined) {
    body.transactionNumber = input.transactionNumber;
  }

  if (input.note !== undefined) {
    body.note = input.note;
  }

  const payload = await request<unknown>(
    `/api/admin/withdrawals/${encodeURIComponent(withdrawId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  const item = extractSingle(payload);

  return normalizeWithdraw(item);
}

/* ============================================================
   REJECT WITHDRAWAL
   ============================================================ */

export async function rejectAdminWithdraw(
  withdrawId: string,
  reason: string,
): Promise<AdminWithdrawRequest> {
  if (!withdrawId?.trim()) {
    throw new AdminWithdrawServiceError("Withdrawal ID is required.");
  }

  const trimmedReason = reason?.trim() ?? "";

  if (!trimmedReason) {
    throw new AdminWithdrawServiceError("Rejection reason is required.");
  }

  const payload = await request<unknown>(
    `/api/admin/withdrawals/${encodeURIComponent(withdrawId)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: trimmedReason,
      }),
    },
  );

  const item = extractSingle(payload);

  return normalizeWithdraw(item);
}

/* ============================================================
   DEFAULT EXPORT
   ============================================================ */

const adminWithdrawService = {
  getAdminWithdrawRequests,
  getAdminWithdrawRequest,
  approveAdminWithdraw,
  rejectAdminWithdraw,
};

export default adminWithdrawService;
