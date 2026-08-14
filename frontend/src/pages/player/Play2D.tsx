// src/pages/player/Play2D.tsx

import { useMemo, useState } from "react";
import { Check, Dice5, Lock, Pencil, Trash2, X } from "lucide-react";
import type { Bet2D, Session2D } from "@/types/player";

/* ============================================================
   TYPES
============================================================ */

type NumberUsage = Record<string, number>;

/* ============================================================
   ADMIN CONFIGURATION
   Replace these values later with API/database settings.
============================================================ */

// Maximum amount allowed for ONE number in each session.
const MAX_BET_AMOUNT = 10_000;

// Numbers blocked by admin.
const BLOCKED_NUMBERS: string[] = [
  // "13",
  // "25",
  // "66",
];

/*
 * Already-used amount for each number.
 *
 * In the real application this should come from the backend.
 * Example:
 *
 * {
 *   AM: {
 *     "00": 2000,
 *     "01": 5000,
 *   },
 *   PM: {
 *     "00": 7000,
 *   }
 * }
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
   HELPERS
============================================================ */

const NUMBER_LIST = Array.from({ length: 100 }, (_, index) =>
  index.toString().padStart(2, "0"),
);

export default function Play2D() {
  const [session, setSession] = useState<Session2D>("AM");

  /*
   * Multiple number selection.
   *
   * Example:
   * ["00", "05", "23", "88"]
   */
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  const [amount, setAmount] = useState("");

  const [bets, setBets] = useState<Bet2D[]>([]);

  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  const [editingAmount, setEditingAmount] = useState("");

  /*
   * Usage from backend/admin configuration.
   *
   * This is local mock data for now.
   */
  const [numberUsage] = useState<Record<Session2D, NumberUsage>>(INITIAL_USAGE);

  /* ==========================================================
     CALCULATIONS
  ========================================================== */

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

  /* ==========================================================
     NUMBER STATUS
  ========================================================== */

  const getUsedAmount = (number: string) => {
    return currentSessionUsage[number] ?? 0;
  };

  const getRemainingAmount = (number: string) => {
    return Math.max(MAX_BET_AMOUNT - getUsedAmount(number), 0);
  };

  const getProgress = (number: string) => {
    const used = getUsedAmount(number);

    return Math.min((used / MAX_BET_AMOUNT) * 100, 100);
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

  /* ==========================================================
     NUMBER SELECTION
  ========================================================== */

  const toggleNumber = (number: string) => {
    if (isBlocked(number)) {
      return;
    }

    if (isLimitReached(number)) {
      return;
    }

    setSelectedNumbers((current) => {
      if (current.includes(number)) {
        return current.filter((item) => item !== number);
      }

      // No maximum selection limit.
      return [...current, number];
    });
  };

  /* ==========================================================
     SESSION CHANGE
  ========================================================== */

  const changeSession = (newSession: Session2D) => {
    setSession(newSession);

    // Clear number selection when changing AM / PM.
    setSelectedNumbers([]);

    setAmount("");
  };

  /* ==========================================================
     SELECT / CLEAR
  ========================================================== */

  const selectAllAvailable = () => {
    const availableNumbers = NUMBER_LIST.filter(
      (item) => !isBlocked(item) && !isLimitReached(item),
    );

    setSelectedNumbers(availableNumbers);
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  /* ==========================================================
     ADD BETS
  ========================================================== */

  const addBet = () => {
    const betAmount = Number(amount);

    if (selectedNumbers.length === 0 || !betAmount || betAmount <= 0) {
      return;
    }

    /*
     * Validate every selected number against its
     * remaining admin limit.
     */
    const validNumbers = selectedNumbers.filter((item) => {
      const remaining = getRemainingAmount(item);

      return !isBlocked(item) && remaining >= betAmount;
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
      /*
       * Prevent duplicate number/session combinations.
       */
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
   EDIT BET AMOUNT
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

    /*
     * The current bet amount is already included in the
     * backend/admin usage, so add it back when calculating
     * how much this edited bet can use.
     */
    const currentAmount = bet.amount;
    const usedAmount = getUsedAmount(bet.number);

    const availableForEdit = MAX_BET_AMOUNT - (usedAmount - currentAmount);

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

  /* ==========================================================
     REMOVE BET
  ========================================================== */

  const removeBet = (id: string) => {
    setBets((current) => current.filter((bet) => bet.id !== id));
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const submitBets = () => {
    if (bets.length === 0) {
      return;
    }

    console.log("2D Bets:", bets);
  };

  /* ==========================================================
     FORMAT
  ========================================================== */

  const formatAmount = (value: number) => value.toLocaleString();

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <span className="text-gray-900">Lottery</span>

          <span className="text-indigo-600">Play</span>
        </div>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
          2D Play
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Select multiple numbers and enter your bet amount.
        </p>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* =================================================
            LEFT - BET FORM
        ================================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Header */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Dice5 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Place 2D Bet</h2>

              <p className="text-xs text-gray-400">
                Choose one or more numbers
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
                    onClick={() => changeSession(item)}
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
              NUMBER SELECTION HEADER
          ================================================== */}

          <div className="mt-7">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  2D Number
                </label>

                <p className="mt-1 text-xs text-gray-400">
                  Select multiple numbers
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllAvailable}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={selectedNumbers.length === 0}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* =================================================
                NUMBER GRID
            ================================================== */}

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {NUMBER_LIST.map((item) => {
                  const selected = isSelected(item);

                  const blocked = isBlocked(item);

                  const limitReached = isLimitReached(item);

                  const used = getUsedAmount(item);

                  const progress = getProgress(item);

                  const unavailable = blocked || limitReached;

                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={unavailable}
                      onClick={() => toggleNumber(item)}
                      className={`group relative overflow-hidden rounded-lg border px-1 py-2 text-center transition-all duration-150 ${
                        blocked
                          ? "cursor-not-allowed border-red-100 bg-red-50 text-red-300"
                          : limitReached
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300"
                            : selected
                              ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                              : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                      title={
                        blocked
                          ? `${item} is blocked`
                          : limitReached
                            ? `${item} has reached the maximum limit`
                            : `${formatAmount(
                                getRemainingAmount(item),
                              )} MMK remaining`
                      }
                    >
                      {/* Number */}

                      <div className="relative z-10 flex items-center justify-center gap-0.5">
                        {blocked && <Lock className="h-2.5 w-2.5" />}

                        {selected && <Check className="h-2.5 w-2.5" />}

                        <span className="text-xs font-bold">{item}</span>
                      </div>

                      {/* Progress */}

                      <div
                        className={`mx-1.5 mt-1.5 h-1 overflow-hidden rounded-full ${
                          selected ? "bg-blue-400" : "bg-gray-100"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${
                            blocked
                              ? "bg-red-300"
                              : limitReached
                                ? "bg-gray-400"
                                : selected
                                  ? "bg-white"
                                  : progress >= 80
                                    ? "bg-orange-400"
                                    : "bg-blue-500"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      {/* Usage */}

                      <p
                        className={`relative z-10 mt-1 truncate text-[8px] font-medium ${
                          selected
                            ? "text-blue-100"
                            : blocked
                              ? "text-red-300"
                              : limitReached
                                ? "text-gray-400"
                                : "text-gray-400"
                        }`}
                      >
                        {blocked
                          ? "Blocked"
                          : limitReached
                            ? "Full"
                            : `${formatAmount(used)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Available
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                Near limit
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Limit reached
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-300" />
                Blocked
              </div>
            </div>
          </div>

          {/* =================================================
              SELECTION SUMMARY
          ================================================== */}

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-500">
                  Selected Numbers
                </p>

                <p className="mt-0.5 text-lg font-bold text-blue-700">
                  {selectedNumbers.length}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-medium text-blue-500">
                  Selected Bet Total
                </p>

                <p className="mt-0.5 text-lg font-bold text-blue-700">
                  {formatAmount(selectedTotal)}{" "}
                  <span className="text-xs">MMK</span>
                </p>
              </div>
            </div>

            {selectedNumbers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedNumbers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleNumber(item)}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100"
                  >
                    {item}

                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              BET AMOUNT
          ================================================== */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Bet Amount Per Number
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
              Minimum bet: 100 MMK per number.
            </p>
          </div>

          {/* =================================================
              ADD BET
          ================================================== */}

          <button
            type="button"
            onClick={addBet}
            disabled={
              selectedNumbers.length === 0 ||
              !Number(amount) ||
              Number(amount) <= 0
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
          >
            <Dice5 className="h-4 w-4" />
            Add{" "}
            {selectedNumbers.length > 0
              ? `${selectedNumbers.length} Numbers`
              : "Selected Bet"}
          </button>
        </div>

        {/* =================================================
            RIGHT - SELECTED BETS
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

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {bets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <Dice5 className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  No bets selected
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Select numbers and enter an amount.
                </p>
              </div>
            ) : (
              bets.map((bet) => {
                const isEditing = editingBetId === bet.id;

                const usedAmount = getUsedAmount(bet.number);

                /*
                 * Since this bet already exists, its current amount
                 * should be excluded from the used amount when editing.
                 */
                const maxEditableAmount =
                  MAX_BET_AMOUNT - (usedAmount - bet.amount);

                return (
                  <div
                    key={bet.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-blue-100 hover:bg-blue-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Number */}

                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold tracking-wider text-gray-900 shadow-sm ring-1 ring-gray-100">
                          {bet.number}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {bet.session}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-gray-400">
                            {bet.session} Session
                          </p>
                        </div>
                      </div>

                      {/* Actions */}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditBet(bet)}
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                            title="Edit amount"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeBet(bet.id)}
                            className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                            title="Delete bet"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Amount */}

                    {isEditing ? (
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
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
                                setEditingAmount(event.target.value)
                              }
                              autoFocus
                              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 pr-12 text-sm font-semibold text-gray-900 outline-none focus:ring-4 focus:ring-blue-50"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400">
                              MMK
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => saveEditBet(bet)}
                            disabled={
                              !Number(editingAmount) ||
                              Number(editingAmount) < 100 ||
                              Number(editingAmount) > maxEditableAmount
                            }
                            className="rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditBet}
                            className="rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-500 transition hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>

                        <p className="mt-2 text-[11px] text-gray-400">
                          Maximum allowed:{" "}
                          <span className="font-semibold text-gray-600">
                            {formatAmount(maxEditableAmount)} MMK
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-gray-100">
                        <span className="text-xs text-gray-400">Amount</span>

                        <span className="text-sm font-bold text-gray-800">
                          {formatAmount(bet.amount)} MMK
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
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
                {formatAmount(totalAmount)}{" "}
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
