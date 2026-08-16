import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  ReceiptText,
  WalletCards,
  XCircle,
} from "lucide-react";

import { Link } from "react-router-dom";

/* ============================================================
   TRANSACTION DATA
   Replace this with API data later.
============================================================ */

const transactions = [
  {
    id: "TXN-10001",
    type: "Deposit",
    amount: 100000,
    method: "KBZPay",
    reference: "KBZ-829341",
    date: "14 Aug 2026 · 09:25 AM",
    status: "Completed",
  },
  {
    id: "TXN-10002",
    type: "Withdraw",
    amount: 50000,
    method: "WavePay",
    reference: "WAV-382914",
    date: "13 Aug 2026 · 04:10 PM",
    status: "Completed",
  },
  {
    id: "TXN-10003",
    type: "Deposit",
    amount: 75000,
    method: "AYA Pay",
    reference: "AYA-719283",
    date: "12 Aug 2026 · 11:40 AM",
    status: "Pending",
  },
  {
    id: "TXN-10004",
    type: "Withdraw",
    amount: 25000,
    method: "KBZ Bank",
    reference: "KBZB-918273",
    date: "10 Aug 2026 · 02:15 PM",
    status: "Failed",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const formatAmount = (amount: number) => {
  return amount.toLocaleString();
};

/* ============================================================
   STATUS
============================================================ */

const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  if (status === "Completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  if (status === "Pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
        <Clock3 className="h-3 w-3" />
        Pending
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
};

/* ============================================================
   PAGE
============================================================ */

export default function Wallet() {
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
        {/* ====================================================
            BALANCE CARD
        ===================================================== */}

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-100 sm:p-6">
          {/* Decorative circles */}

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
                125,000
                <span className="ml-2 text-base font-semibold text-indigo-200">
                  MMK
                </span>
              </p>

              <p className="mt-1 text-[11px] text-indigo-200">
                Your current wallet balance
              </p>
            </div>

            {/* Small summary */}

            <div className="mt-5 flex items-center gap-6 border-t border-white/10 pt-4">
              <div>
                <p className="text-[9px] text-indigo-200">
                  Recent Deposits
                </p>

                <p className="mt-0.5 text-sm font-bold">
                  +175,000 MMK
                </p>
              </div>

              <div>
                <p className="text-[9px] text-indigo-200">
                  Recent Withdrawals
                </p>

                <p className="mt-0.5 text-sm font-bold">
                  -75,000 MMK
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            ACTIONS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {/* Deposit */}

          <Link
            to="/player/deposit"
            className="group flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
              <ArrowDownToLine className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Deposit
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Add money to wallet
              </p>
            </div>

            <span className="ml-auto text-slate-300 transition group-hover:text-emerald-500">
              →
            </span>
          </Link>

          {/* Withdraw */}

          <Link
            to="/player/withdraw"
            className="group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-500 group-hover:text-white">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Withdraw
              </p>

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
        {/* ====================================================
            HEADER
        ===================================================== */}

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

        {/* ====================================================
            TABLE HEADER
        ===================================================== */}

        <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_110px] border-b border-slate-100 bg-slate-50/70 px-5 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 md:grid">
          <span>Transaction</span>

          <span>Amount</span>

          <span>Reference</span>

          <span className="text-right">Status</span>
        </div>

        {/* ====================================================
            TRANSACTIONS
        ===================================================== */}

        <div className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === "Deposit";

            return (
              <div
                key={transaction.id}
                className="px-4 py-3 transition hover:bg-slate-50 sm:px-5"
              >
                {/* ==================================================
                    DESKTOP
                ================================================== */}

                <div className="hidden grid-cols-[minmax(0,1fr)_150px_120px_110px] items-center gap-3 md:grid">
                  {/* Transaction */}

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

                  {/* Amount */}

                  <div>
                    <p
                      className={`text-xs font-bold ${
                        isDeposit
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}
                      {formatAmount(transaction.amount)}{" "}
                      <span className="text-[9px] font-semibold opacity-70">
                        MMK
                      </span>
                    </p>
                  </div>

                  {/* Reference */}

                  <div>
                    <p className="truncate text-[9px] font-medium text-slate-400">
                      {transaction.reference}
                    </p>
                  </div>

                  {/* Status */}

                  <div className="flex justify-end">
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>

                {/* ==================================================
                    MOBILE
                ================================================== */}

                <div className="md:hidden">
                  <div className="flex items-center gap-3">
                    {/* Icon */}

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

                    {/* Main */}

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

                    {/* Amount */}

                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xs font-bold ${
                          isDeposit
                            ? "text-emerald-600"
                            : "text-blue-600"
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

                  {/* Bottom details */}

                  <div className="mt-2.5 flex items-center justify-between gap-3 pl-12">
                    <p className="truncate text-[9px] text-slate-400">
                      Ref: {transaction.reference}
                    </p>

                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-slate-400 sm:text-[10px]">
              Showing {transactions.length} recent transactions
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