import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  ReceiptText,
  WalletCards,
  XCircle,
  RefreshCw,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

/* ============================================================
   TYPES
============================================================ */

type TransactionStatus =
  | "Completed"
  | "Pending"
  | "Failed"
  | "Rejected"
  | "Cancelled";

type TransactionType = "Deposit" | "Withdraw";

type WalletTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  method: string;
  reference: string;
  date: string;
  status: TransactionStatus;
};

type WalletData = {
  balance: number;
  recentDeposits: number;
  recentWithdrawals: number;
  transactions: WalletTransaction[];
};

/* ============================================================
   DASHBOARD API RESPONSE
============================================================ */

type DashboardResponse = {
  success: boolean;
  message?: string;

  user?: unknown;

  stats?: {
    walletBalance?: number | string | null;
    totalTickets?: number | string | null;
    totalDeposit?: number | string | null;
    totalWithdraw?: number | string | null;
  };

  latestDraw?: unknown;

  winners?: unknown[];

  data?: {
    user?: unknown;

    stats?: {
      walletBalance?: number | string | null;
      totalTickets?: number | string | null;
      totalDeposit?: number | string | null;
      totalWithdraw?: number | string | null;
    };

    latestDraw?: unknown;

    winners?: unknown[];
  };
};

/* ============================================================
   TRANSACTION API RESPONSE
============================================================ */

type TransactionsResponse = {
  success: boolean;
  message?: string;

  data?: {
    transactions?: unknown[];
  };

  transactions?: unknown[];

  count?: number;
};

/* ============================================================
   HELPERS
============================================================ */

const formatAmount = (amount: number | string | null | undefined) => {
  return Number(amount || 0).toLocaleString("en-US");
};

/* ============================================================
   DATE
============================================================ */

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Yangon",
  })
    .format(date)
    .replace(",", " ·");
};

/* ============================================================
   STATUS
============================================================ */

const StatusBadge = ({ status }: { status: string }) => {
  if (
    status === "Completed" ||
    status === "APPROVED" ||
    status === "COMPLETED" ||
    status === "SUCCESS"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (status === "Pending" || status === "PENDING" || status === "PROCESSING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
        <Clock3 className="h-3 w-3" />
        Pending
      </span>
    );
  }

  if (
    status === "Rejected" ||
    status === "REJECTED" ||
    status === "Cancelled" ||
    status === "CANCELLED" ||
    status === "Failed" ||
    status === "FAILED"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">
      <Clock3 className="h-3 w-3" />
      {status || "Unknown"}
    </span>
  );
};

/* ============================================================
   NORMALIZE TRANSACTION TYPE
============================================================ */

function normalizeTransactionType(value: unknown): TransactionType {
  const type = String(value ?? "")
    .trim()
    .toUpperCase();

  if (type === "WITHDRAW" || type === "WITHDRAWAL" || type === "WITHDRAWALS") {
    return "Withdraw";
  }

  return "Deposit";
}

/* ============================================================
   NORMALIZE TRANSACTION STATUS
============================================================ */

function normalizeTransactionStatus(value: unknown): TransactionStatus {
  const status = String(value ?? "")
    .trim()
    .toUpperCase();

  switch (status) {
    case "COMPLETED":
    case "SUCCESS":
    case "APPROVED":
    case "SUCCEEDED":
      return "Completed";

    case "PENDING":
    case "PROCESSING":
      return "Pending";

    case "REJECTED":
      return "Rejected";

    case "CANCELLED":
    case "CANCELED":
      return "Cancelled";

    case "FAILED":
      return "Failed";

    default:
      return "Pending";
  }
}

/* ============================================================
   NORMALIZE TRANSACTION
============================================================ */

function normalizeTransaction(transaction: any): WalletTransaction {
  const type = normalizeTransactionType(
    transaction.type ?? transaction.transactionType ?? transaction.category,
  );

  return {
    id: String(
      transaction.id ??
        transaction.transactionId ??
        transaction.transaction_id ??
        "-",
    ),

    type,

    amount: Number(
      transaction.amount ?? transaction.value ?? transaction.totalAmount ?? 0,
    ),

    method:
      transaction.methodName ??
      transaction.paymentMethodName ??
      transaction.paymentMethod ??
      transaction.method ??
      transaction.provider ??
      "Wallet",

    reference:
      transaction.reference ??
      transaction.referenceNo ??
      transaction.referenceNumber ??
      transaction.transactionNumber ??
      transaction.transactionNo ??
      transaction.externalReference ??
      "-",

    date: formatDate(
      transaction.createdAt ??
        transaction.created_at ??
        transaction.date ??
        transaction.transactionDate ??
        transaction.updatedAt,
    ),

    status: normalizeTransactionStatus(
      transaction.status ?? transaction.transactionStatus,
    ),
  };
}

/* ============================================================
   GET DASHBOARD STATS
============================================================ */

async function loadDashboardStats(): Promise<{
  balance: number;
  recentDeposits: number;
  recentWithdrawals: number;
}> {
  const response = await fetch("/api/player/dashboard", {
    method: "GET",

    credentials: "include",

    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    await response.text();

    throw new Error(
      response.status === 404
        ? "Dashboard API endpoint was not found"
        : "Dashboard API returned an invalid response",
    );
  }

  const result = (await response.json()) as DashboardResponse;

  console.log("Wallet dashboard API response:", result);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to load wallet balance");
  }

  /*
   * Support:
   *
   * {
   *   success: true,
   *   stats: {...}
   * }
   *
   * AND:
   *
   * {
   *   success: true,
   *   data: {
   *     stats: {...}
   *   }
   * }
   */

  const stats = result.data?.stats ?? result.stats;

  if (!stats) {
    throw new Error("Wallet balance data is unavailable");
  }

  return {
    balance: Number(stats.walletBalance ?? 0),

    recentDeposits: Number(stats.totalDeposit ?? 0),

    recentWithdrawals: Number(stats.totalWithdraw ?? 0),
  };
}

/* ============================================================
   GET TRANSACTIONS
============================================================ */

async function loadTransactions(): Promise<WalletTransaction[]> {
  const response = await fetch("/api/player/transactions?limit=20", {
    method: "GET",

    credentials: "include",

    headers: {
      Accept: "application/json",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    await response.text();

    throw new Error(
      response.status === 404
        ? "Transaction API endpoint was not found"
        : "Transaction API returned an invalid response",
    );
  }

  const result = (await response.json()) as TransactionsResponse;

  console.log("Wallet transactions API response:", result);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to load transactions");
  }

  /*
   * Support:
   *
   * {
   *   success: true,
   *   transactions: []
   * }
   *
   * AND:
   *
   * {
   *   success: true,
   *   data: {
   *     transactions: []
   *   }
   * }
   */

  const rawTransactions =
    result.data?.transactions ?? result.transactions ?? [];

  if (!Array.isArray(rawTransactions)) {
    return [];
  }

  return rawTransactions.map(normalizeTransaction);
}

/* ============================================================
   PAGE
============================================================ */

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,

    recentDeposits: 0,

    recentWithdrawals: 0,

    transactions: [],
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ==========================================================
     LOAD WALLET
     
     IMPORTANT:
     
     Balance comes from:
       /api/player/dashboard
     
     Transactions come from:
       /api/player/transactions
  ========================================================== */

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);

      setError("");

      /*
       * Load both APIs together.
       *
       * Dashboard:
       * - wallet balance
       * - total deposit
       * - total withdraw
       *
       * Transactions:
       * - transaction history
       */

      const [dashboardData, transactionData] = await Promise.all([
        loadDashboardStats(),

        loadTransactions(),
      ]);

      setWallet({
        balance: dashboardData.balance,

        recentDeposits: dashboardData.recentDeposits,

        recentWithdrawals: dashboardData.recentWithdrawals,

        transactions: transactionData,
      });
    } catch (err) {
      console.error("Wallet loading error:", err);

      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />

          <div className="mt-3 h-8 w-40 animate-pulse rounded bg-slate-200" />

          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />

            <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>

        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="space-y-5 pb-6">
        <div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className="text-slate-400">Player</span>

            <span className="text-indigo-400">/</span>

            <span className="text-indigo-500">Wallet</span>
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Wallet
          </h1>

          <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
            Manage your balance, deposits, withdrawals and transactions.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-red-700">
                Unable to load wallet
              </p>

              <p className="mt-1 text-xs text-red-600">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => void loadWallet()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const transactions = wallet.transactions;

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="space-y-5 pb-6">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div>
        <div className="flex items-center gap-1 text-xs font-semibold">
          <span className="text-slate-400">Player</span>

          <span className="text-indigo-400">/</span>

          <span className="text-indigo-500">Wallet</span>
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Wallet
        </h1>

        <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
          Manage your balance, deposits, withdrawals and transactions.
        </p>
      </div>

      {/* ======================================================
          WALLET SUMMARY
      ======================================================= */}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* BALANCE CARD */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-100 sm:p-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />

          <div className="absolute -bottom-16 right-20 h-36 w-36 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <WalletCards className="h-4.5 w-4.5" />
                </div>

                <div>
                  <p className="text-[11px] font-medium text-indigo-100">
                    Available Balance
                  </p>

                  <p className="text-xs font-semibold text-white">
                    Main Wallet
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-semibold text-indigo-100">
                MMK
              </span>
            </div>

            <div className="mt-6">
              <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {formatAmount(wallet.balance)}

                <span className="ml-2 text-base font-semibold text-indigo-200">
                  MMK
                </span>
              </p>

              <p className="mt-1 text-[11px] text-indigo-200">
                Your current wallet balance
              </p>
            </div>

            <div className="mt-5 flex items-center gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] text-indigo-200">Recent Deposits</p>

                <p className="mt-0.5 text-sm font-bold">
                  +{formatAmount(wallet.recentDeposits)} MMK
                </p>
              </div>

              <div>
                <p className="text-[9px] text-indigo-200">Recent Withdrawals</p>

                <p className="mt-0.5 text-sm font-bold">
                  -{formatAmount(wallet.recentWithdrawals)} MMK
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Link
            to="/player/deposit"
            className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
              <ArrowDownToLine className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Deposit</p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Add money to wallet
              </p>
            </div>

            <span className="ml-auto text-slate-300 transition group-hover:text-emerald-500">
              →
            </span>
          </Link>

          <Link
            to="/player/withdraw"
            className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Withdraw</p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Withdraw your balance
              </p>
            </div>

            <span className="ml-auto text-slate-300 transition group-hover:text-blue-500">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* ======================================================
          TRANSACTION HISTORY
      ======================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ReceiptText className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                Transaction History
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-400 sm:text-xs">
                Recent wallet activity
              </p>
            </div>
          </div>

          <Link
            to="/player/transactions"
            className="shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-bold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 sm:text-xs"
          >
            View All →
          </Link>
        </div>

        {/* TABLE HEADER */}

        <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_110px] border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 md:grid">
          <span>Transaction</span>

          <span>Amount</span>

          <span>Reference</span>

          <span className="text-right">Status</span>
        </div>

        {/* TRANSACTIONS */}

        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.slice(0, 4).map((transaction) => {
              const isDeposit = transaction.type === "Deposit";

              return (
                <div
                  key={transaction.id}
                  className="px-4 py-3 transition hover:bg-slate-50 sm:px-5"
                >
                  {/* DESKTOP */}

                  <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_110px] items-center gap-3 md:grid">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isDeposit
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownToLine className="h-4 w-4" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-slate-900">
                            {transaction.type}
                          </p>

                          <span className="text-[9px] text-slate-400">
                            {transaction.id}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[9px] text-slate-400">
                          {transaction.method} · {transaction.date}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isDeposit ? "text-emerald-600" : "text-blue-600"
                        }`}
                      >
                        {isDeposit ? "+" : "-"}
                        {formatAmount(transaction.amount)}{" "}
                        <span className="text-[9px] font-semibold opacity-70">
                          MMK
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="truncate text-[9px] font-medium text-slate-400">
                        {transaction.reference}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <StatusBadge status={transaction.status} />
                    </div>
                  </div>

                  {/* MOBILE */}

                  <div className="md:hidden">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isDeposit
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownToLine className="h-4 w-4" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">
                            {transaction.type}
                          </p>

                          <span className="truncate text-[9px] text-slate-400">
                            {transaction.id}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[9px] text-slate-400">
                          {transaction.method} · {transaction.date}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xs font-bold ${
                            isDeposit ? "text-emerald-600" : "text-blue-600"
                          }`}
                        >
                          {isDeposit ? "+" : "-"}
                          {formatAmount(transaction.amount)}
                        </p>

                        <p className="text-[8px] font-semibold text-slate-400">
                          MMK
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-3 pl-12">
                      <p className="truncate text-[9px] text-slate-400">
                        Ref: {transaction.reference}
                      </p>

                      <StatusBadge status={transaction.status} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-10 text-center">
              <ReceiptText className="mx-auto h-7 w-7 text-slate-300" />

              <p className="mt-2 text-xs font-bold text-slate-500">
                No transactions yet
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Your deposit and withdrawal activity will appear here.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-slate-400 sm:text-[10px]">
              Showing {Math.min(transactions.length, 4)} recent transactions
            </p>

            <Link
              to="/player/transactions"
              className="text-[10px] font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Transaction History →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
