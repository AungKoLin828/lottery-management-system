import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

import { Link } from "react-router-dom";

export default function Wallet() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-indigo-500">Player</p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">Wallet</h1>
      </div>

      {/* Balance */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <p className="text-sm text-slate-500">Available Balance</p>

        <p className="mt-2 text-4xl font-bold text-slate-900">
          125,000 <span className="text-lg text-slate-400">MMK</span>
        </p>
      </div>

      {/* Deposit / Withdraw */}
      <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
