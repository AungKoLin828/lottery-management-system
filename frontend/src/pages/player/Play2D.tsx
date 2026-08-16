// src/pages/player/Play2D.tsx

import { useMemo, useState } from "react";
import {
  Check,
  Dice5,
  Lock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { Bet2D, Session2D } from "@/types/player";

/* ============================================================
   TYPES
============================================================ */

type NumberUsage = Record<string, number>;

/* ============================================================
   ADMIN CONFIGURATION
============================================================ */

const MAX_BET_AMOUNT = 10_000;

const BLOCKED_NUMBERS: string[] = [];

/*
 * Mock usage data.
 * Replace with API/database data later.
 */
const INITIAL_USAGE: Record<Session2D, NumberUsage> = {
  AM: {
    "00": 2_000,
    "01": 5_000,
    "12": 7_500,
    "25": 10_000,
  },

  PM: {
    "03": 3_000,
    "18": 6_000,
    "55": 8_500,
    "88": 10_000,
  },
};

/* ============================================================
   NUMBER LIST
============================================================ */

const NUMBER_LIST = Array.from(
  { length: 100 },
  (_, index) => index.toString().padStart(2, "0"),
);

/* ============================================================
   COMPONENT
============================================================ */

export default function Play2D() {
  const [session, setSession] = useState<Session2D>("AM");

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  const [amount, setAmount] = useState("");

  const [bets, setBets] = useState<Bet2D[]>([]);

  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  const [editingAmount, setEditingAmount] = useState("");

  const [numberUsage] =
    useState<Record<Session2D, NumberUsage>>(INITIAL_USAGE);

  /* ============================================================
     CALCULATIONS
  ============================================================ */

  const currentSessionUsage = numberUsage[session];

  const totalAmount = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amount, 0),
    [bets],
  );

  const selectedTotal = useMemo(() => {
    const betAmount = Number(amount);

    if (!betAmount || betAmount <= 0) {
      return 0;
    }

    return selectedNumbers.length * betAmount;
  }, [selectedNumbers, amount]);

  /* ============================================================
     NUMBER STATUS
  ============================================================ */

  const getUsedAmount = (number: string) => {
    return currentSessionUsage[number] ?? 0;
  };

  const getRemainingAmount = (number: string) => {
    return Math.max(
      MAX_BET_AMOUNT - getUsedAmount(number),
      0,
    );
  };

  const getProgress = (number: string) => {
    const used = getUsedAmount(number);

    return Math.min(
      (used / MAX_BET_AMOUNT) * 100,
      100,
    );
  };

  const isBlocked = (number: string) => {
    return BLOCKED_NUMBERS.includes(number);
  };

  const isLimitReached = (number: string) => {
    return getRemainingAmount(number) <= 0;
  };

  const isSelected = (number: string) => {
    return selectedNumbers.includes(number);
  };

  /* ============================================================
     NUMBER SELECTION
  ============================================================ */

  const toggleNumber = (number: string) => {
    if (isBlocked(number) || isLimitReached(number)) {
      return;
    }

    setSelectedNumbers((current) => {
      if (current.includes(number)) {
        return current.filter((item) => item !== number);
      }

      return [...current, number];
    });
  };

  /* ============================================================
     SESSION
  ============================================================ */

  const changeSession = (newSession: Session2D) => {
    setSession(newSession);
    setSelectedNumbers([]);
    setAmount("");
  };

  /* ============================================================
     SELECT / CLEAR
  ============================================================ */

  const selectAllAvailable = () => {
    const availableNumbers = NUMBER_LIST.filter(
      (item) =>
        !isBlocked(item) &&
        !isLimitReached(item),
    );

    setSelectedNumbers(availableNumbers);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  /* ============================================================
     ADD BET
  ============================================================ */

  const addBet = () => {
    const betAmount = Number(amount);

    if (
      selectedNumbers.length === 0 ||
      !betAmount ||
      betAmount <= 0
    ) {
      return;
    }

    const validNumbers = selectedNumbers.filter((item) => {
      const remaining = getRemainingAmount(item);

      return (
        !isBlocked(item) &&
        remaining >= betAmount
      );
    });

    if (validNumbers.length === 0) {
      return;
    }

    const newBets: Bet2D[] = validNumbers.map((item) => ({
      id: crypto.randomUUID(),
      number: item,
      amount: betAmount,
      session,
    }));

    setBets((current) => {
      const filtered = current.filter(
        (existing) =>
          !newBets.some(
            (newBet) =>
              newBet.number === existing.number &&
              newBet.session === existing.session,
          ),
      );

      return [...filtered, ...newBets];
    });

    setSelectedNumbers([]);
    setAmount("");
  };

  /* ============================================================
     EDIT BET
  ============================================================ */

  const startEditBet = (bet: Bet2D) => {
    setEditingBetId(bet.id);
    setEditingAmount(String(bet.amount));
  };

  const cancelEditBet = () => {
    setEditingBetId(null);
    setEditingAmount("");
  };

  const saveEditBet = (bet: Bet2D) => {
    const newAmount = Number(editingAmount);

    if (!newAmount || newAmount < 100) {
      return;
    }

    const currentAmount = bet.amount;
    const usedAmount = getUsedAmount(bet.number);

    const availableForEdit =
      MAX_BET_AMOUNT -
      (usedAmount - currentAmount);

    if (newAmount > availableForEdit) {
      return;
    }

    setBets((current) =>
      current.map((item) =>
        item.id === bet.id
          ? {
              ...item,
              amount: newAmount,
            }
          : item,
      ),
    );

    cancelEditBet();
  };

  /* ============================================================
     REMOVE BET
  ============================================================ */

  const removeBet = (id: string) => {
    setBets((current) =>
      current.filter((bet) => bet.id !== id),
    );
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const submitBets = () => {
    if (bets.length === 0) {
      return;
    }

    console.log("2D Bets:", bets);
  };

  /* ============================================================
     FORMAT
  ============================================================ */

  const formatAmount = (value: number) =>
    value.toLocaleString();

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <span className="text-slate-500">
            Lottery
          </span>

          <span className="text-violet-600">
            /
          </span>

          <span className="text-violet-600">
            Play
          </span>
        </div>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          2D Play
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select your lucky numbers and enter your bet amount.
        </p>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* ====================================================
            LEFT - BET FORM
        ==================================================== */}

        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">

          {/* HEADER */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200">
              <Dice5 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Place 2D Bet
              </h2>

              <p className="text-xs text-slate-400">
                Choose one or more numbers
              </p>
            </div>
          </div>

          {/* ==================================================
              SESSION
          ================================================== */}

          <div className="mt-6">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Session
            </label>

            <div className="grid grid-cols-2 gap-2.5">

              {(["AM", "PM"] as Session2D[]).map(
                (item) => {
                  const active =
                    session === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        changeSession(item)
                      }
                      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? item === "AM"
                            ? "border-blue-400 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-100"
                            : "border-violet-400 bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md shadow-violet-100"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">

                        <span
                          className={`h-2 w-2 rounded-full ${
                            active
                              ? "bg-white"
                              : "bg-slate-300"
                          }`}
                        />

                        {item} Session
                      </div>
                    </button>
                  );
                },
              )}

            </div>
          </div>

          {/* ==================================================
              NUMBER SELECTION
          ================================================== */}

          <div className="mt-6">

            {/* NUMBER HEADER */}

            <div className="flex items-center justify-between gap-3">

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Select Numbers
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  Choose your 2D numbers
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">

                {/* SELECT ALL */}

                <button
                  type="button"
                  onClick={selectAllAvailable}
                  className="rounded-md border border-violet-200 bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-200"
                >
                  Select All
                </button>

                {/* CLEAR */}

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={
                    selectedNumbers.length === 0
                  }
                  className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

              </div>
            </div>

            {/* =================================================
                NUMBER GRID
            ================================================= */}

            <div className="mt-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-100 p-2.5 shadow-inner sm:p-3">

              <div className="grid grid-cols-10 gap-1">

                {NUMBER_LIST.map((item) => {

                  const selected =
                    isSelected(item);

                  const blocked =
                    isBlocked(item);

                  const limitReached =
                    isLimitReached(item);

                  const used =
                    getUsedAmount(item);

                  const progress =
                    getProgress(item);

                  const unavailable =
                    blocked || limitReached;

                  const nearLimit =
                    progress >= 80 &&
                    progress < 100;

                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={unavailable}
                      onClick={() =>
                        toggleNumber(item)
                      }
                      title={
                        blocked
                          ? `${item} is blocked`
                          : limitReached
                            ? `${item} is full`
                            : `${formatAmount(
                                getRemainingAmount(
                                  item,
                                ),
                              )} MMK remaining`
                      }
                      className={`
                        relative flex
                        h-8
                        min-w-0
                        flex-col
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-md
                        border
                        px-0
                        transition-all
                        duration-150
                        sm:h-9
                        ${
                          blocked
                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-300"
                            : limitReached
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                              : selected
                                ? "border-violet-600 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-sm shadow-violet-300 ring-1 ring-violet-400"
                                : nearLimit
                                  ? "border-orange-300 bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 hover:border-orange-400 hover:bg-orange-200"
                                  : "border-violet-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-100 hover:text-violet-700 hover:shadow-sm"
                        }
                      `}
                    >

                      {/* NUMBER */}

                      <div className="flex items-center justify-center gap-0.5">

                        {blocked && (
                          <Lock className="h-2 w-2" />
                        )}

                        {selected && (
                          <Check className="h-2 w-2" />
                        )}

                        <span className="text-[10px] font-bold leading-none sm:text-[11px]">
                          {item}
                        </span>

                      </div>

                      {/* MINI PROGRESS */}

                      <div
                        className={`mt-0.5 h-0.5 w-3/4 overflow-hidden rounded-full ${
                          selected
                            ? "bg-white/30"
                            : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            blocked
                              ? "bg-red-300"
                              : limitReached
                                ? "bg-slate-400"
                                : selected
                                  ? "bg-white"
                                  : nearLimit
                                    ? "bg-orange-400"
                                    : "bg-violet-400"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      {/* USED */}

                      <span
                        className={`mt-0.5 text-[6px] font-medium leading-none ${
                          selected
                            ? "text-violet-100"
                            : blocked
                              ? "text-red-300"
                              : limitReached
                                ? "text-slate-400"
                                : nearLimit
                                  ? "text-orange-500"
                                  : "text-slate-400"
                        }`}
                      >
                        {blocked
                          ? "OFF"
                          : limitReached
                            ? "FULL"
                            : formatAmount(used)}
                      </span>

                    </button>
                  );
                })}

              </div>
            </div>

            {/* =================================================
                LEGEND
            ================================================= */}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Available
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                Near limit
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Full
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-300" />
                Blocked
              </div>

            </div>
          </div>

          {/* ==================================================
              SELECTED SUMMARY
          ================================================== */}

          <div className="mt-5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-100 via-indigo-50 to-blue-100 p-4">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[11px] font-semibold text-violet-600">
                  Selected Numbers
                </p>

                <p className="mt-0.5 text-lg font-bold text-violet-800">
                  {selectedNumbers.length}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-semibold text-indigo-600">
                  Selected Bet Total
                </p>

                <p className="mt-0.5 text-lg font-bold text-indigo-800">
                  {formatAmount(selectedTotal)}{" "}
                  <span className="text-xs">
                    MMK
                  </span>
                </p>
              </div>

            </div>

            {selectedNumbers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">

                {selectedNumbers.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        toggleNumber(item)
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-violet-700 shadow-sm ring-1 ring-violet-200 transition hover:bg-violet-100"
                    >
                      {item}

                      <X className="h-3 w-3" />
                    </button>
                  ),
                )}

              </div>
            )}

          </div>

          {/* ==================================================
              BET AMOUNT
          ================================================== */}

          <div className="mt-5">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Bet Amount Per Number
            </label>

            <div className="relative">

              <input
                type="number"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="Enter amount"
                min="100"
                className="w-full rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 pr-16 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-500">
                MMK
              </span>

            </div>

            <p className="mt-2 text-xs text-slate-400">
              Minimum bet: 100 MMK per number.
            </p>

          </div>

          {/* ==================================================
              ADD BET BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={addBet}
            disabled={
              selectedNumbers.length === 0 ||
              !Number(amount) ||
              Number(amount) <= 0
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <Dice5 className="h-4 w-4" />

            Add{" "}
            {selectedNumbers.length > 0
              ? `${selectedNumbers.length} Numbers`
              : "Selected Bet"}
          </button>

        </div>

        {/* ====================================================
            RIGHT - SELECTED BETS
        ==================================================== */}

        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">

          {/* HEADER */}

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Selected Bets
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Review your selected numbers
              </p>
            </div>

            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-2 text-xs font-bold text-white shadow-sm">
              {bets.length}
            </span>

          </div>

          {/* BET LIST */}

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">

            {bets.length === 0 ? (

              <div className="rounded-xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">

                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                  <Dice5 className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  No bets selected
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Select numbers and enter an amount.
                </p>

              </div>

            ) : (

              bets.map((bet) => {

                const isEditing =
                  editingBetId === bet.id;

                const usedAmount =
                  getUsedAmount(bet.number);

                const maxEditableAmount =
                  MAX_BET_AMOUNT -
                  (usedAmount - bet.amount);

                return (
                  <div
                    key={bet.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-violet-200 hover:bg-violet-50/50"
                  >

                    <div className="flex items-center justify-between gap-3">

                      {/* NUMBER */}

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold tracking-wider text-white shadow-sm shadow-violet-200">
                          {bet.number}
                        </div>

                        <div>

                          <div className="flex items-center gap-2">

                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                                bet.session === "AM"
                                  ? "bg-blue-500"
                                  : "bg-violet-500"
                              }`}
                            >
                              {bet.session}
                            </span>

                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {bet.session} Session
                          </p>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      {!isEditing && (
                        <div className="flex items-center gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              startEditBet(bet)
                            }
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-violet-100 hover:text-violet-600"
                            title="Edit amount"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeBet(bet.id)
                            }
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                            title="Delete bet"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      )}

                    </div>

                    {/* AMOUNT */}

                    {isEditing ? (

                      <div className="mt-4">

                        <label className="mb-2 block text-xs font-semibold text-slate-600">
                          Bet Amount
                        </label>

                        <div className="flex gap-2">

                          <div className="relative flex-1">

                            <input
                              type="number"
                              min="100"
                              max={maxEditableAmount}
                              value={editingAmount}
                              onChange={(event) =>
                                setEditingAmount(
                                  event.target.value,
                                )
                              }
                              autoFocus
                              className="w-full rounded-lg border border-violet-300 bg-white px-3 py-2 pr-12 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-violet-50"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                              MMK
                            </span>

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              saveEditBet(bet)
                            }
                            disabled={
                              !Number(
                                editingAmount,
                              ) ||
                              Number(
                                editingAmount,
                              ) < 100 ||
                              Number(
                                editingAmount,
                              ) >
                                maxEditableAmount
                            }
                            className="rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={
                              cancelEditBet
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                          >
                            Cancel
                          </button>

                        </div>

                      </div>

                    ) : (

                      <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">

                        <span className="text-xs text-slate-400">
                          Amount
                        </span>

                        <span className="text-sm font-bold text-slate-800">
                          {formatAmount(
                            bet.amount,
                          )}{" "}
                          MMK
                        </span>

                      </div>

                    )}

                  </div>
                );
              })

            )}

          </div>

          {/* ==================================================
              TOTAL
          ================================================== */}

          <div className="mt-6 border-t border-slate-100 pt-5">

            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-slate-500">
                Total Bet Amount
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatAmount(totalAmount)}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  MMK
                </span>
              </span>

            </div>

            <button
              type="button"
              onClick={submitBets}
              disabled={bets.length === 0}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              Place 2D Bets
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}