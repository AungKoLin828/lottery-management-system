// src/pages/player/Wallet.tsx

import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function Wallet() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-emerald-400">Player</p>

        <h1 className="mt-1 text-3xl font-bold">Wallet</h1>
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
        <p className="text-sm text-slate-400">Available Balance</p>

        <p className="mt-2 text-4xl font-bold">
          125,000 <span className="text-lg text-slate-400">MMK</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left hover:border-emerald-500/30"
        >
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <ArrowDownToLine />
          </div>

          <div>
            <p className="font-semibold">Deposit</p>

            <p className="text-sm text-slate-500">Add money to your wallet</p>
          </div>
        </button>

        <button
          type="button"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left hover:border-blue-500/30"
        >
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
            <ArrowUpFromLine />
          </div>

          <div>
            <p className="font-semibold">Withdraw</p>

            <p className="text-sm text-slate-500">Withdraw from your wallet</p>
          </div>
        </button>
      </div>
    </div>
  );
}
