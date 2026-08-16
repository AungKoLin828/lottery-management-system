// src/pages/player/Play2D.tsx

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Dice5,
  Lock,
  Pencil,
  Trash2,
  X,
  ShoppingBasket,
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

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>(
    [],
  );

  const [amount, setAmount] = useState("");

  const [bets, setBets] = useState<Bet2D[]>([]);

  const [editingBetId, setEditingBetId] = useState<string | null>(
    null,
  );

  const [editingAmount, setEditingAmount] = useState("");

  /*
   * Mobile selected bets modal.
   */
  const [mobileBetsOpen, setMobileBetsOpen] = useState(false);

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

    /*
     * Automatically open mobile bets modal
     * after adding a bet.
     */
    if (window.innerWidth < 1024) {
      setMobileBetsOpen(true);
    }
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

    if (editingBetId === id) {
      cancelEditBet();
    }
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const submitBets = () => {
    if (bets.length === 0) {
      return;
    }

    console.log("2D Bets:", bets);

    setMobileBetsOpen(false);
  };

  /* ============================================================
     FORMAT
  ============================================================ */

  const formatAmount = (value: number) =>
    value.toLocaleString();

  /* ============================================================
     MOBILE MODAL BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (!mobileBetsOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileBetsOpen]);

  /* ============================================================
     BET CARD
     
     compact = true
     Used inside mobile modal to keep cards small.
  ============================================================ */

  const renderBetCard = (
    bet: Bet2D,
    compact = false,
  ) => {
    const isEditing = editingBetId === bet.id;

    const usedAmount = getUsedAmount(bet.number);

    const maxEditableAmount =
      MAX_BET_AMOUNT -
      (usedAmount - bet.amount);

    /*
     * COMPACT MOBILE CARD
     */
    if (compact) {
      return (
        <div
          key={bet.id}
          className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/50"
        >
          {/* ================================================
              COMPACT HEADER
          ================================================= */}

          <div className="flex items-center gap-2">
            {/* NUMBER */}

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 text-sm font-bold tracking-wide text-white shadow-sm">
              {bet.number}
            </div>

            {/* SESSION + AMOUNT */}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-bold leading-none text-white ${
                    bet.session === "AM"
                      ? "bg-blue-500"
                      : "bg-emerald-500"
                  }`}
                >
                  {bet.session}
                </span>

                <span className="truncate text-[10px] text-slate-400">
                  Session
                </span>
              </div>

              {!isEditing && (
                <div className="mt-1">
                  <span className="text-sm font-bold text-slate-800">
                    {formatAmount(bet.amount)}
                  </span>

                  <span className="ml-1 text-[9px] font-semibold text-slate-400">
                    MMK
                  </span>
                </div>
              )}
            </div>

            {/* ACTIONS */}

            {!isEditing && (
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => startEditBet(bet)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-emerald-100 hover:text-emerald-600"
                  title="Edit amount"
                  aria-label={`Edit bet ${bet.number}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => removeBet(bet.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Delete bet"
                  aria-label={`Delete bet ${bet.number}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ================================================
              COMPACT EDIT
          ================================================= */}

          {isEditing && (
            <div className="mt-2.5 border-t border-slate-200 pt-2.5">
              <label className="mb-1.5 block text-[10px] font-semibold text-slate-600">
                Bet Amount
              </label>

              <div className="flex gap-1.5">
                <div className="relative min-w-0 flex-1">
                  <input
                    type="number"
                    min="100"
                    max={maxEditableAmount}
                    value={editingAmount}
                    onChange={(event) =>
                      setEditingAmount(event.target.value)
                    }
                    autoFocus
                    className="w-full rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 pr-10 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-50"
                  />

                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-semibold text-slate-400">
                    MMK
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => saveEditBet(bet)}
                  disabled={
                    !Number(editingAmount) ||
                    Number(editingAmount) < 100 ||
                    Number(editingAmount) >
                      maxEditableAmount
                  }
                  className="rounded-md bg-emerald-600 px-2.5 text-[10px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={cancelEditBet}
                  className="rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-1 text-[8px] text-slate-400">
                Maximum: {formatAmount(maxEditableAmount)} MMK
              </p>
            </div>
          )}
        </div>
      );
    }

    /*
     * NORMAL DESKTOP CARD
     */
    return (
      <div
        key={bet.id}
        className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50"
      >
        {/* ====================================================
            BET HEADER
        ==================================================== */}

        <div className="flex items-center justify-between gap-3">
          {/* NUMBER */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-lg font-bold tracking-wider text-white shadow-sm shadow-emerald-200">
              {bet.number}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
                    bet.session === "AM"
                      ? "bg-blue-500"
                      : "bg-emerald-500"
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
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => startEditBet(bet)}
                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-emerald-100 hover:text-emerald-600"
                title="Edit amount"
                aria-label={`Edit bet ${bet.number}`}
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => removeBet(bet.id)}
                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                title="Delete bet"
                aria-label={`Delete bet ${bet.number}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ====================================================
            EDIT
        ==================================================== */}

        {isEditing ? (
          <div className="mt-4">
            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Bet Amount
            </label>

            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  type="number"
                  min="100"
                  max={maxEditableAmount}
                  value={editingAmount}
                  onChange={(event) =>
                    setEditingAmount(event.target.value)
                  }
                  autoFocus
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 pr-12 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-50"
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">
                  MMK
                </span>
              </div>

              <button
                type="button"
                onClick={() => saveEditBet(bet)}
                disabled={
                  !Number(editingAmount) ||
                  Number(editingAmount) < 100 ||
                  Number(editingAmount) >
                    maxEditableAmount
                }
                className="rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Save
              </button>

              <button
                type="button"
                onClick={cancelEditBet}
                className="rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Maximum: {formatAmount(maxEditableAmount)} MMK
            </p>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
            <span className="text-xs text-slate-400">
              Amount
            </span>

            <span className="text-sm font-bold text-slate-800">
              {formatAmount(bet.amount)}{" "}
              <span className="text-xs font-semibold text-slate-400">
                MMK
              </span>
            </span>
          </div>
        )}
      </div>
    );
  };

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div>
        <div className="flex items-center gap-1 text-sm font-semibold">
          <span className="text-slate-500">
            Lottery
          </span>

          <span className="text-emerald-600">
            /
          </span>

          <span className="text-emerald-600">
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
      ======================================================= */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ====================================================
            LEFT - BET FORM
        ==================================================== */}

        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          {/* HEADER */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-200">
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
                  const active = session === item;

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
                            : "border-emerald-400 bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-100"
                          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
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
                <button
                  type="button"
                  onClick={selectAllAvailable}
                  className="rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-200"
                >
                  Select All
                </button>

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

            {/* NUMBER GRID */}

            <div className="mt-3 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-2.5 shadow-inner sm:p-3">
              <div className="grid grid-cols-10 gap-1">
                {NUMBER_LIST.map((item) => {
                  const selected = isSelected(item);

                  const blocked = isBlocked(item);

                  const limitReached =
                    isLimitReached(item);

                  const used = getUsedAmount(item);

                  const progress = getProgress(item);

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
                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-400"
                            : limitReached
                              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                              : selected
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-1 ring-emerald-500"
                                : nearLimit
                                  ? "border-orange-300 bg-orange-100 text-orange-800 hover:border-orange-400 hover:bg-orange-200"
                                  : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm"
                        }
                      `}
                    >
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

                      <div
                        className={`mt-0.5 h-0.5 w-3/4 overflow-hidden rounded-full ${
                          selected
                            ? "bg-white/40"
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
                                    : "bg-emerald-400"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>

                      <span
                        className={`mt-0.5 text-[6px] font-medium leading-none ${
                          selected
                            ? "text-emerald-100"
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

            {/* LEGEND */}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
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

          <div className="mt-5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-600">
                  Selected Numbers
                </p>

                <p className="mt-0.5 text-lg font-bold text-emerald-800">
                  {selectedNumbers.length}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-semibold text-teal-600">
                  Selected Bet Total
                </p>

                <p className="mt-0.5 text-lg font-bold text-teal-800">
                  {formatAmount(selectedTotal)}{" "}
                  <span className="text-xs">
                    MMK
                  </span>
                </p>
              </div>
            </div>

            {selectedNumbers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedNumbers.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      toggleNumber(item)
                    }
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    {item}

                    <X className="h-3 w-3" />
                  </button>
                ))}
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
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 pr-16 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-500">
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
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-5 py-3 font-semibold text-white shadow-md shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <Dice5 className="h-4 w-4" />

            Add{" "}
            {selectedNumbers.length > 0
              ? `${selectedNumbers.length} Numbers`
              : "Selected Bet"}
          </button>
        </div>

        {/* ====================================================
            DESKTOP - SELECTED BETS
        ==================================================== */}

        <div className="hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 xl:block">
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

            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 text-xs font-bold text-white shadow-sm">
              {bets.length}
            </span>
          </div>

          {/* BET LIST */}

          <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {bets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-8 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600">
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
              bets.map((bet) => renderBetCard(bet))
            )}
          </div>

          {/* TOTAL */}

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
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-5 py-3 font-semibold text-white shadow-md shadow-emerald-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              Place 2D Bets
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MOBILE FIXED SELECTED BETS BAR
      ======================================================= */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileBetsOpen(true)}
          className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-4 py-3 text-left text-white shadow-lg shadow-emerald-200 transition active:scale-[0.99]"
        >
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBasket className="h-5 w-5" />

              {bets.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-900 ring-2 ring-emerald-600">
                  {bets.length}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-100">
                Selected Bets
              </p>

              <p className="truncate text-sm font-bold">
                {bets.length === 0
                  ? "No bets selected"
                  : `${bets.length} ${
                      bets.length === 1
                        ? "bet"
                        : "bets"
                    } selected`}
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-medium text-emerald-100">
                Total
              </p>

              <p className="text-sm font-extrabold">
                {formatAmount(totalAmount)} MMK
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="text-lg">↑</span>
            </div>
          </div>
        </button>
      </div>

      {/* ======================================================
          MOBILE SELECTED BETS MODAL
      ======================================================= */}

      {mobileBetsOpen && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Selected Bets"
        >
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close selected bets"
            onClick={() => setMobileBetsOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-[2px]"
          />

          {/* ==================================================
              COMPACT BOTTOM SHEET
          ================================================== */}

          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[22px] bg-white shadow-2xl">
            {/* HANDLE */}

            <div className="flex shrink-0 justify-center pt-2">
              <div className="h-1 w-9 rounded-full bg-slate-200" />
            </div>

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2.5 sm:px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-sm">
                  <ShoppingBasket className="h-4 w-4" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-slate-900">
                      Selected Bets
                    </h2>

                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-700">
                      {bets.length}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[9px] text-slate-400">
                    Review your bets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileBetsOpen(false)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close selected bets"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ==================================================
                COMPACT BET LIST
            ================================================== */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 sm:px-5">
              {bets.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600">
                    <Dice5 className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-xs font-bold text-slate-700">
                    No bets selected
                  </p>

                  <p className="mt-1 max-w-xs text-[10px] leading-4 text-slate-400">
                    Select numbers, enter your amount,
                    then add the bet.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileBetsOpen(false)
                    }
                    className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Choose Numbers
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {bets.map((bet) =>
                    renderBetCard(bet, true),
                  )}
                </div>
              )}
            </div>

            {/* ==================================================
                COMPACT MOBILE TOTAL / SUBMIT
            ================================================== */}

            <div className="shrink-0 border-t border-slate-100 bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+0.65rem)] pt-2.5 shadow-[0_-6px_20px_rgba(15,23,42,0.06)] sm:px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-medium text-slate-400">
                    Total Bet Amount
                  </p>

                  <p className="mt-0.5 text-base font-extrabold text-slate-900">
                    {formatAmount(totalAmount)}{" "}
                    <span className="text-[10px] font-bold text-slate-400">
                      MMK
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-medium text-slate-400">
                    Numbers
                  </p>

                  <p className="mt-0.5 text-base font-extrabold text-emerald-600">
                    {bets.length}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={submitBets}
                disabled={bets.length === 0}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                <Check className="h-3.5 w-3.5" />
                Place 2D Bets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}