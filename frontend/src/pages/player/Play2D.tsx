// src/pages/player/Play2D.tsx

import { useMemo, useState } from "react";
import { Trash2, Dice5 } from "lucide-react";
import type { Bet2D, Session2D } from "@/types/player";

export default function Play2D() {
  const [session, setSession] = useState<Session2D>("AM");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [bets, setBets] = useState<Bet2D[]>([]);

  const totalAmount = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amount, 0),
    [bets],
  );

  const addBet = () => {
    if (!/^\d{2}$/.test(number)) {
      return;
    }

    const betAmount = Number(amount);

    if (!betAmount || betAmount <= 0) {
      return;
    }

    const newBet: Bet2D = {
      id: crypto.randomUUID(),
      number,
      amount: betAmount,
      session,
    };

    setBets((current) => [...current, newBet]);

    setNumber("");
    setAmount("");
  };

  const removeBet = (id: string) => {
    setBets((current) => current.filter((bet) => bet.id !== id));
  };

  const submitBets = () => {
    if (bets.length === 0) {
      return;
    }

    console.log("2D Bets:", bets);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Dice5 className="h-4 w-4" />

          <span>Lottery</span>
        </div>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          2D Play
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Select your session, number and bet amount.
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
              <Dice5 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Place 2D Bet</h2>

              <p className="text-xs text-gray-400">
                Choose your session and number
              </p>
            </div>
          </div>

          {/* =================================================
              SESSION
          ================================================== */}
          <div className="mt-7">
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              Session
            </label>

            <div className="grid grid-cols-2 gap-3">
              {(["AM", "PM"] as Session2D[]).map((item) => {
                const active = session === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSession(item)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      active
                        ? "border-blue-200 bg-blue-100 text-blue-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          active ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                      {item} Session
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              NUMBER
          ================================================== */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              2D Number
            </label>

            <input
              value={number}
              onChange={(event) =>
                setNumber(event.target.value.replace(/\D/g, "").slice(0, 2))
              }
              placeholder="00 - 99"
              inputMode="numeric"
              maxLength={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-lg font-semibold tracking-[0.3em] text-gray-900 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

            <p className="mt-2 text-xs text-gray-400">
              Enter a 2-digit number from 00 to 99.
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
            <Dice5 className="h-4 w-4" />
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
                  <Dice5 className="h-5 w-5" />
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-bold tracking-wider text-gray-900 shadow-sm ring-1 ring-gray-100">
                      {bet.number}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {bet.amount.toLocaleString()} MMK
                        </span>

                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {bet.session}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-400">
                        {bet.session} Session
                      </p>
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
              onClick={submitBets}
              disabled={bets.length === 0}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
            >
              Place 2D Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
