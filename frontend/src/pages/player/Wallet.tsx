import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  ReceiptText,
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

export default function Wallet() {
  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div>
        <p className="text-sm text-indigo-500">Player</p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">Wallet</h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your balance, deposits, withdrawals and transactions.
        </p>
      </div>

      {/* =====================================================
          BALANCE
      ====================================================== */}

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <p className="text-sm font-medium text-slate-500">Available Balance</p>

        <p className="mt-2 text-4xl font-bold text-slate-900">
          125,000{" "}
          <span className="text-lg font-semibold text-slate-400">MMK</span>
        </p>
      </div>

      {/* =====================================================
          DEPOSIT / WITHDRAW
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Deposit */}

        <Link
          to="/player/deposit"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
            <ArrowDownToLine size={22} />
          </div>

          <div>
            <p className="font-semibold text-slate-900">Deposit</p>

            <p className="text-sm text-slate-500">Add money to your wallet</p>
          </div>
        </Link>

        {/* Withdraw */}

        <Link
          to="/player/withdraw"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <ArrowUpFromLine size={22} />
          </div>

          <div>
            <p className="font-semibold text-slate-900">Withdraw</p>

            <p className="text-sm text-slate-500">Withdraw from your wallet</p>
          </div>
        </Link>
      </div>

      {/* =====================================================
          TRANSACTION HISTORY
      ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <ReceiptText size={17} />
              </div>

              <h2 className="text-base font-bold text-slate-900">
                Transaction History
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Your recent wallet transactions
            </p>
          </div>

          <Link
            to="/player/transactions"
            className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
          >
            View All →
          </Link>
        </div>

        {/* Table Header */}

        <div className="hidden grid-cols-[1fr_150px_120px_130px] border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:grid">
          <span>Transaction</span>

          <span>Amount</span>

          <span>Method</span>

          <span className="text-right">Status</span>
        </div>

        {/* =====================================================
              TRANSACTIONS
          ====================================================== */}

        <div className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const isDeposit = transaction.type === "Deposit";
            const isCompleted = transaction.status === "Completed";
            const isPending = transaction.status === "Pending";

            return (
              <div
                key={transaction.id}
                className="px-5 py-3 transition hover:bg-slate-50"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_140px_110px_120px] md:items-center">
                  {/* Transaction */}

                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isDeposit
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownToLine size={15} />
                      ) : (
                        <ArrowUpFromLine size={15} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {transaction.type}
                        </p>

                        <span className="hidden text-[10px] text-slate-400 sm:inline">
                          {transaction.id}
                        </span>
                      </div>

                      <p className="truncate text-[10px] text-slate-400">
                        {transaction.method} · {transaction.date}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        isDeposit ? "text-emerald-600" : "text-blue-600"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}
                      {formatAmount(transaction.amount)} MMK
                    </p>
                  </div>

                  {/* Reference */}

                  <div className="hidden lg:block">
                    <p className="truncate text-[10px] text-slate-400">
                      {transaction.reference}
                    </p>
                  </div>

                  {/* Status */}

                  <div className="flex items-center justify-between md:justify-end">
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 size={11} />
                        Completed
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
                        <Clock3 size={11} />
                        Pending
                      </span>
                    )}

                    {!isCompleted && !isPending && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                        <XCircle size={11} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}

        <div className="border-t border-slate-100 px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing recent transactions
            </p>

            <Link
              to="/player/transactions"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Transaction History →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
