// src/pages/player/Play3D.tsx

import { useMemo, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { Bet3D } from "@/types/player";

/* ============================================================
   CONFIGURATION
   ============================================================ */

// This value should eventually come from the admin/settings API.
const MAX_BET_PER_NUMBER = 50_000;

// Number of numbers displayed on one page.
const NUMBERS_PER_PAGE = 100;

// Minimum betting amount.
const MIN_BET_AMOUNT = 100;

// Mock blocked numbers.
// Eventually this should come from the backend/admin settings.
const BLOCKED_NUMBERS = new Set([
  "007",
  "013",
  "088",
  "111",
  "222",
  "333",
  "444",
  "555",
  "666",
  "777",
  "888",
  "999",
]);

/* ============================================================
   HELPERS
   ============================================================ */

const formatNumber = (value: number) => {
  return value.toString().padStart(3, "0");
};

export default function Play3D() {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);

  const [bets, setBets] = useState<Bet3D[]>([]);

  const [editingBetId, setEditingBetId] = useState<string | null>(null);

  const [editingAmount, setEditingAmount] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(1000 / NUMBERS_PER_PAGE);

  /* ============================================================
     TOTAL AMOUNT
  ============================================================ */

  const totalAmount = useMemo(
    () => bets.reduce((sum, bet) => sum + bet.amount, 0),
    [bets],
  );

  /* ============================================================
     CURRENT PAGE NUMBERS
  ============================================================ */

  const pageNumbers = useMemo(() => {
    const start = (currentPage - 1) * NUMBERS_PER_PAGE;
    const end = start + NUMBERS_PER_PAGE;

    return Array.from({ length: end - start }, (_, index) => {
      return formatNumber(start + index);
    });
  }, [currentPage]);

  /* ============================================================
     GET BET AMOUNT FOR NUMBER
  ============================================================ */

  const getNumberBetAmount = (value: string) => {
    return bets
      .filter((bet) => bet.number === value)
      .reduce((sum, bet) => sum + bet.amount, 0);
  };

  /* ============================================================
     PROGRESS
  ============================================================ */

  const getNumberProgress = (value: string) => {
    const currentAmount = getNumberBetAmount(value);

    return Math.min((currentAmount / MAX_BET_PER_NUMBER) * 100, 100);
  };

  /* ============================================================
     BLOCKED
  ============================================================ */

  const isBlocked = (value: string) => {
    return BLOCKED_NUMBERS.has(value);
  };

  /* ============================================================
     LIMIT REACHED
  ============================================================ */

  const isLimitReached = (value: string) => {
    return getNumberBetAmount(value) >= MAX_BET_PER_NUMBER;
  };

  /* ============================================================
     SELECT / DESELECT NUMBER
  ============================================================ */

  const toggleNumber = (value: string) => {
    if (isBlocked(value) || isLimitReached(value)) {
      return;
    }

    setSelectedNumbers((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });

    setNumber(value);
  };

  /* ============================================================
     SELECT ALL AVAILABLE NUMBERS ON CURRENT PAGE
  ============================================================ */

  const selectAvailableOnPage = () => {
    const availableNumbers = pageNumbers.filter(
      (value) => !isBlocked(value) && !isLimitReached(value),
    );

    setSelectedNumbers((current) => {
      const merged = new Set([...current, ...availableNumbers]);

      return Array.from(merged);
    });
  };

  /* ============================================================
     CLEAR SELECTED NUMBERS
  ============================================================ */

  const clearSelectedNumbers = () => {
    setSelectedNumbers([]);
    setNumber("");
  };

  /* ============================================================
     MANUAL NUMBER INPUT
  ============================================================ */

  const handleNumberInput = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 3);

    setNumber(cleaned);

    if (cleaned.length === 3) {
      if (!isBlocked(cleaned) && !isLimitReached(cleaned)) {
        setSelectedNumbers((current) => {
          if (current.includes(cleaned)) {
            return current;
          }

          return [...current, cleaned];
        });
      }
    }
  };

  /* ============================================================
     ADD SELECTED NUMBERS
  ============================================================ */

  const addBet = () => {
    const betAmount = Number(amount);

    if (!betAmount || betAmount < MIN_BET_AMOUNT) {
      return;
    }

    if (selectedNumbers.length === 0) {
      return;
    }

    setBets((current) => {
      const updated = [...current];

      selectedNumbers.forEach((selectedNumber) => {
        if (isBlocked(selectedNumber)) {
          return;
        }

        const existingIndex = updated.findIndex(
          (bet) => bet.number === selectedNumber,
        );

        const currentAmount =
          existingIndex >= 0 ? updated[existingIndex].amount : 0;

        const newAmount = currentAmount + betAmount;

        if (newAmount > MAX_BET_PER_NUMBER) {
          return;
        }

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            amount: newAmount,
          };
        } else {
          updated.push({
            id: crypto.randomUUID(),
            number: selectedNumber,
            amount: betAmount,
          });
        }
      });

      return updated;
    });

    setSelectedNumbers([]);
    setNumber("");
    setAmount("");
  };

  /* ============================================================
   EDIT BET AMOUNT
============================================================ */

  const startEditBet = (bet: Bet3D) => {
    setEditingBetId(bet.id);
    setEditingAmount(String(bet.amount));
  };

  const cancelEditBet = () => {
    setEditingBetId(null);
    setEditingAmount("");
  };

  const saveEditBet = (bet: Bet3D) => {
    const newAmount = Number(editingAmount);

    if (!newAmount || newAmount < MIN_BET_AMOUNT) {
      return;
    }

    /*
     * Current bet amount is already part of the number's
     * current total. Exclude it before calculating the
     * maximum amount allowed for this edit.
     */
    const currentNumberAmount = getNumberBetAmount(bet.number);

    const maxEditableAmount =
      MAX_BET_PER_NUMBER - (currentNumberAmount - bet.amount);

    if (newAmount > maxEditableAmount) {
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
    setBets((current) => current.filter((bet) => bet.id !== id));
  };

  /* ============================================================
     REMOVE NUMBER FROM SELECTION
  ============================================================ */

  const removeSelectedNumber = (value: string) => {
    setSelectedNumbers((current) => current.filter((item) => item !== value));

    if (number === value) {
      setNumber("");
    }
  };

  /* ============================================================
     PAGE NAVIGATION
  ============================================================ */

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const submitBets = () => {
    if (bets.length === 0) {
      return;
    }

    console.log("3D Bets:", bets);
  };

  return (
    <div>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <span className="text-gray-500">Lottery</span>

          <span className="text-gray-300">/</span>

          <span className="text-indigo-600">3D Play</span>
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          3D Play
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Select one or more numbers and enter your betting amount.
        </p>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* =================================================
            LEFT
        ================================================== */}

        <div className="space-y-6">
          {/* =================================================
              NUMBER SELECTOR
          ================================================== */}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {/* Header */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Boxes className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Select 3D Numbers
                  </h2>

                  <p className="text-xs text-gray-400">100 numbers per page</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAvailableOnPage}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                >
                  Select Available
                </button>

                <button
                  type="button"
                  onClick={clearSelectedNumbers}
                  disabled={selectedNumbers.length === 0}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Limit Info */}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="text-right">
                <p className="text-xs text-indigo-500">Selected</p>

                <p className="text-sm font-bold text-indigo-700">
                  {selectedNumbers.length}
                </p>
              </div>
            </div>

            {/* Number Grid */}

            <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {pageNumbers.map((value) => {
                const selected = selectedNumbers.includes(value);

                const blocked = isBlocked(value);

                const currentAmount = getNumberBetAmount(value);

                const progress = getNumberProgress(value);

                const limitReached = isLimitReached(value);

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={blocked || limitReached}
                    onClick={() => toggleNumber(value)}
                    className={`group relative overflow-hidden rounded-lg border px-1 py-2 transition-all duration-150 ${
                      blocked
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300"
                        : limitReached
                          ? "cursor-not-allowed border-red-100 bg-red-50 text-red-300"
                          : selected
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                    title={
                      blocked
                        ? "This number is blocked"
                        : limitReached
                          ? "Maximum betting limit reached"
                          : `${currentAmount.toLocaleString()} / ${MAX_BET_PER_NUMBER.toLocaleString()} MMK`
                    }
                  >
                    <span className="relative z-10 block text-sm font-bold tracking-wide">
                      {value}
                    </span>

                    {/* Progress */}

                    {!blocked && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full bg-gray-200">
                        <span
                          className={`block h-full transition-all ${
                            selected
                              ? "bg-white"
                              : limitReached
                                ? "bg-red-400"
                                : "bg-blue-500"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </span>
                    )}

                    {/* Blocked */}

                    {blocked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
                        <span className="rotate-[-35deg] text-[8px] font-bold uppercase tracking-wide text-gray-400">
                          Blocked
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Page Information */}

            <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-600">
                  {(currentPage - 1) * NUMBERS_PER_PAGE}-
                  {Math.min(currentPage * NUMBERS_PER_PAGE - 1, 999)
                    .toString()
                    .padStart(3, "0")}
                </span>{" "}
                of 1,000 numbers
              </p>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                        currentPage === page
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Legend */}

            <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gray-200" />
                Available
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                Selected
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-300" />
                Limit reached
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" />
                Blocked
              </div>
            </div>
          </div>

          {/* =================================================
              BET AMOUNT
          ================================================== */}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Boxes className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Betting Amount
                </h2>

                <p className="text-xs text-gray-400">
                  Apply this amount to all selected numbers
                </p>
              </div>
            </div>

            {/* Selected Number Chips */}

            {selectedNumbers.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">
                    Selected Numbers
                  </label>

                  <span className="text-xs text-gray-400">
                    {selectedNumbers.length} selected
                  </span>
                </div>

                <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
                  {selectedNumbers.map((selectedNumber) => (
                    <button
                      key={selectedNumber}
                      type="button"
                      onClick={() => removeSelectedNumber(selectedNumber)}
                      className="group flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-red-50 hover:text-red-500"
                    >
                      {selectedNumber}

                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Number */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                3D Number
              </label>

              <input
                value={number}
                onChange={(event) => handleNumberInput(event.target.value)}
                placeholder="000 - 999"
                inputMode="numeric"
                maxLength={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-bold tracking-[0.4em] text-gray-900 outline-none transition-all placeholder:tracking-normal placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

              <p className="mt-2 text-xs text-gray-400">
                You can also enter a number manually.
              </p>
            </div>

            {/* Amount */}

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
                  min={MIN_BET_AMOUNT}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-16 text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                  MMK
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-400">
                Minimum bet: {MIN_BET_AMOUNT.toLocaleString()} MMK
              </p>
            </div>

            {/* Add */}

            <button
              type="button"
              onClick={addBet}
              disabled={
                selectedNumbers.length === 0 || Number(amount) < MIN_BET_AMOUNT
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
            >
              <Boxes className="h-4 w-4" />
              Add{" "}
              {selectedNumbers.length > 0
                ? `${selectedNumbers.length} Numbers`
                : "Selected Bet"}
            </button>
          </div>
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

          <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {bets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <Boxes className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  No bets selected
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Select one or more numbers and add your bet.
                </p>
              </div>
            ) : (
              bets.map((bet) => {
                const progress = getNumberProgress(bet.number);

                const isEditing = editingBetId === bet.id;

                const currentNumberAmount = getNumberBetAmount(bet.number);

                /*
                 * Exclude this bet's current amount when calculating
                 * how much can be entered during editing.
                 */
                const maxEditableAmount =
                  MAX_BET_PER_NUMBER - (currentNumberAmount - bet.amount);

                return (
                  <div
                    key={bet.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-blue-100 hover:bg-blue-50/40"
                  >
                    {/* =================================================
          BET HEADER
      ================================================== */}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-16 items-center justify-center rounded-xl bg-white text-lg font-bold tracking-widest text-gray-900 shadow-sm ring-1 ring-gray-100">
                          {bet.number}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {bet.amount.toLocaleString()} MMK
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {MAX_BET_PER_NUMBER.toLocaleString()} MMK limit
                          </p>
                        </div>
                      </div>

                      {/* =================================================
            ACTIONS
        ================================================== */}

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

                    {/* =================================================
          EDIT AMOUNT
      ================================================== */}

                    {isEditing && (
                      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                        <label className="mb-2 block text-xs font-semibold text-gray-600">
                          Edit Bet Amount
                        </label>

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min={MIN_BET_AMOUNT}
                              max={maxEditableAmount}
                              value={editingAmount}
                              onChange={(event) =>
                                setEditingAmount(event.target.value)
                              }
                              autoFocus
                              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 pr-12 text-sm font-semibold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
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
                              Number(editingAmount) < MIN_BET_AMOUNT ||
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

                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[11px] text-gray-400">
                            Minimum:{" "}
                            <span className="font-semibold text-gray-600">
                              {MIN_BET_AMOUNT.toLocaleString()} MMK
                            </span>
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Maximum:{" "}
                            <span className="font-semibold text-gray-600">
                              {maxEditableAmount.toLocaleString()} MMK
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* =================================================
                        PROGRESS
                    ================================================== */}

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span className="text-gray-400">Number limit</span>

                        <span className="font-semibold text-blue-600">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            progress >= 100
                              ? "bg-red-500"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
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
              Place 3D Bets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
