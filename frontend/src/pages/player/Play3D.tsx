// src/pages/player/Play3D.tsx

import { useMemo, useState } from "react";
import { Boxes, Trash2 } from "lucide-react";
import type { Bet3D } from "@/types/player";

export default function Play3D() {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [bets, setBets] = useState<Bet3D[]>([]);

  const totalAmount = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amount, 0),
    [bets],
  );

  const addBet = () => {
    if (!/^\d{3}$/.test(number)) {
      return;
    }

    const betAmount = Number(amount);

    if (!betAmount || betAmount <= 0) {
      return;
    }

    setBets((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        number,
        amount: betAmount,
      },
    ]);

    setNumber("");
    setAmount("");
  };

  const removeBet = (id: string) => {
    setBets((current) => current.filter((bet) => bet.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Boxes className="h-4 w-4" />

          <span>Lottery</span>
        </div>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          3D Play
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Select your 3D number and bet amount.
        </p>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* =================================================
            BET FORM
        ================================================== */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Card Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Boxes className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Place 3D Bet</h2>

              <p className="text-xs text-gray-400">
                Choose your number and bet amount
              </p>
            </div>
          </div>

          {/* =================================================
              3D NUMBER
          ================================================== */}
          <div className="mt-7">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              3D Number
            </label>

            <input
              value={number}
              onChange={(event) =>
                setNumber(event.target.value.replace(/\D/g, "").slice(0, 3))
              }
              placeholder="000 - 999"
              inputMode="numeric"
              maxLength={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-gray-900 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <p className="mt-2 text-xs text-gray-400">
              Enter a 3-digit number from 000 to 999.
            </p>
          </div>

          {/* =================================================
              BET AMOUNT
          ================================================== */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Bet Amount
            </label>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                min="100"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-16 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                MMK
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Minimum bet amount: 100 MMK
            </p>
          </div>

          {/* =================================================
              ADD BET BUTTON
          ================================================== */}
          <button
            type="button"
            onClick={addBet}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
          >
            <Boxes className="h-4 w-4" />
            Add Selected Bet
          </button>
        </div>

        {/* =================================================
            SELECTED BETS
        ================================================== */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Selected Bets</h2>

              <p className="mt-1 text-xs text-gray-400">
                Review your selected numbers
              </p>
            </div>

            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700">
              {bets.length}
            </span>
          </div>

          {/* Bet List */}
          <div className="mt-5 space-y-3">
            {bets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <Boxes className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  No bets selected
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Select a number and amount to add a bet.
                </p>
              </div>
            ) : (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-blue-100 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    {/* Number */}
                    <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-white text-lg font-bold tracking-widest text-gray-900 shadow-sm ring-1 ring-gray-100">
                      {bet.number}
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {bet.amount.toLocaleString()} MMK
                      </p>

                      <p className="mt-1 text-xs text-gray-400">3D Number</p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeBet(bet.id)}
                    className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                    title="Remove bet"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* =================================================
              TOTAL
          ================================================== */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Total Bet Amount
              </span>

              <span className="text-xl font-bold text-gray-900">
                {totalAmount.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-400">MMK</span>
              </span>
            </div>

            {/* Place Bets */}
            <button
              type="button"
              disabled={bets.length === 0}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
            >
              Place 3D Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
