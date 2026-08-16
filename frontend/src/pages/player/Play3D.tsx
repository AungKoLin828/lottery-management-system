// src/pages/player/Play3D.tsx

import { useMemo, useState } from "react";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { Bet3D } from "@/types/player";

/* ============================================================
   CONFIGURATION
============================================================ */

const MAX_BET_PER_NUMBER = 50_000;

const NUMBERS_PER_PAGE = 100;

const MIN_BET_AMOUNT = 100;

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

/* ============================================================
   COMPONENT
============================================================ */

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

    const end = Math.min(
      start + NUMBERS_PER_PAGE,
      1000,
    );

    return Array.from(
      { length: end - start },
      (_, index) => formatNumber(start + index),
    );
  }, [currentPage]);

  /* ============================================================
     GET BET AMOUNT FOR NUMBER
  ============================================================ */

  const getNumberBetAmount = (value: string) => {
    return bets
      .filter((bet) => bet.number === value)
      .reduce(
        (sum, bet) => sum + bet.amount,
        0,
      );
  };

  /* ============================================================
     PROGRESS
  ============================================================ */

  const getNumberProgress = (value: string) => {
    const currentAmount =
      getNumberBetAmount(value);

    return Math.min(
      (currentAmount /
        MAX_BET_PER_NUMBER) *
        100,
      100,
    );
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
    return (
      getNumberBetAmount(value) >=
      MAX_BET_PER_NUMBER
    );
  };

  /* ============================================================
     SELECTED
  ============================================================ */

  const isSelected = (value: string) => {
    return selectedNumbers.includes(value);
  };

  /* ============================================================
     SELECT / DESELECT NUMBER
  ============================================================ */

  const toggleNumber = (value: string) => {
    if (
      isBlocked(value) ||
      isLimitReached(value)
    ) {
      return;
    }

    setSelectedNumbers((current) => {
      if (current.includes(value)) {
        return current.filter(
          (item) => item !== value,
        );
      }

      return [...current, value];
    });

    setNumber(value);
  };

  /* ============================================================
     SELECT ALL AVAILABLE ON PAGE
  ============================================================ */

  const selectAvailableOnPage = () => {
    const availableNumbers =
      pageNumbers.filter(
        (value) =>
          !isBlocked(value) &&
          !isLimitReached(value),
      );

    setSelectedNumbers((current) => {
      const merged = new Set([
        ...current,
        ...availableNumbers,
      ]);

      return Array.from(merged);
    });
  };

  /* ============================================================
     CLEAR
  ============================================================ */

  const clearSelectedNumbers = () => {
    setSelectedNumbers([]);
    setNumber("");
  };

  /* ============================================================
     MANUAL NUMBER INPUT
  ============================================================ */

  const handleNumberInput = (
    value: string,
  ) => {
    const cleaned = value
      .replace(/\D/g, "")
      .slice(0, 3);

    setNumber(cleaned);

    if (cleaned.length === 3) {
      if (
        !isBlocked(cleaned) &&
        !isLimitReached(cleaned)
      ) {
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
     ADD BET
  ============================================================ */

  const addBet = () => {
    const betAmount = Number(amount);

    if (
      !betAmount ||
      betAmount < MIN_BET_AMOUNT
    ) {
      return;
    }

    if (selectedNumbers.length === 0) {
      return;
    }

    setBets((current) => {
      const updated = [...current];

      selectedNumbers.forEach(
        (selectedNumber) => {
          if (isBlocked(selectedNumber)) {
            return;
          }

          const existingIndex =
            updated.findIndex(
              (bet) =>
                bet.number === selectedNumber,
            );

          const currentAmount =
            existingIndex >= 0
              ? updated[existingIndex].amount
              : 0;

          const newAmount =
            currentAmount + betAmount;

          if (
            newAmount >
            MAX_BET_PER_NUMBER
          ) {
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
        },
      );

      return updated;
    });

    setSelectedNumbers([]);
    setNumber("");
    setAmount("");
  };

  /* ============================================================
     EDIT BET
  ============================================================ */

  const startEditBet = (bet: Bet3D) => {
    setEditingBetId(bet.id);
    setEditingAmount(
      String(bet.amount),
    );
  };

  const cancelEditBet = () => {
    setEditingBetId(null);
    setEditingAmount("");
  };

  const saveEditBet = (bet: Bet3D) => {
    const newAmount =
      Number(editingAmount);

    if (
      !newAmount ||
      newAmount < MIN_BET_AMOUNT
    ) {
      return;
    }

    const currentNumberAmount =
      getNumberBetAmount(bet.number);

    const maxEditableAmount =
      MAX_BET_PER_NUMBER -
      (currentNumberAmount -
        bet.amount);

    if (
      newAmount >
      maxEditableAmount
    ) {
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
      current.filter(
        (bet) => bet.id !== id,
      ),
    );
  };

  /* ============================================================
     REMOVE SELECTED NUMBER
  ============================================================ */

  const removeSelectedNumber = (
    value: string,
  ) => {
    setSelectedNumbers((current) =>
      current.filter(
        (item) => item !== value,
      ),
    );

    if (number === value) {
      setNumber("");
    }
  };

  /* ============================================================
     PAGE NAVIGATION
  ============================================================ */

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }

    setCurrentPage(page);
    setNumber("");
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

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1 text-xs font-semibold sm:text-sm">
          <span className="text-slate-500">
            Lottery
          </span>

          <span className="text-blue-500">
            /
          </span>

          <span className="text-blue-600">
            3D Play
          </span>
        </div>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          3D Play
        </h1>

        <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">
          Select your numbers and enter your
          betting amount.
        </p>
      </div>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <div
        className="
          grid
          min-w-0
          grid-cols-1
          gap-5
          xl:grid-cols-[minmax(0,1fr)_380px]
          xl:gap-6
        "
      >

        {/* ====================================================
            LEFT
        ==================================================== */}

        <div className="min-w-0 space-y-5 sm:space-y-6">

          {/* ==================================================
              NUMBER SELECTOR
          ================================================== */}

          <div
            className="
              min-w-0
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              sm:p-6
            "
          >

            {/* HEADER */}

            <div
              className="
                flex
                min-w-0
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-10 sm:w-10 sm:rounded-xl">
                  <Boxes className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    Select 3D Numbers
                  </h2>

                  <p className="text-[10px] text-slate-400 sm:text-xs">
                    100 numbers per page
                  </p>
                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="flex w-full min-w-0 gap-1.5 sm:w-auto">

                <button
                  type="button"
                  onClick={
                    selectAvailableOnPage
                  }
                  className="
                    min-w-0
                    flex-1
                    rounded-md
                    border
                    border-blue-200
                    bg-blue-50
                    px-2
                    py-1.5
                    text-[9px]
                    font-bold
                    text-blue-600
                    transition
                    hover:border-blue-300
                    hover:bg-blue-100
                    sm:flex-none
                    sm:px-2.5
                    sm:text-[10px]
                  "
                >
                  Select Available
                </button>

                <button
                  type="button"
                  onClick={
                    clearSelectedNumbers
                  }
                  disabled={
                    selectedNumbers.length ===
                    0
                  }
                  className="
                    flex-1
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-2
                    py-1.5
                    text-[9px]
                    font-bold
                    text-slate-500
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:flex-none
                    sm:px-2.5
                    sm:text-[10px]
                  "
                >
                  Clear
                </button>

              </div>

            </div>

            {/* ==================================================
                SELECTED COUNT
            ================================================== */}

            <div
              className="
                mt-4
                flex
                items-center
                justify-between
                gap-3
                rounded-xl
                border
                border-blue-100
                bg-gradient-to-r
                from-blue-50
                to-indigo-50
                px-3
                py-2.5
                sm:mt-5
                sm:px-4
                sm:py-3
              "
            >

              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-blue-500 sm:text-[11px]">
                  Selected Numbers
                </p>

                <p className="mt-0.5 text-base font-bold text-blue-700 sm:text-lg">
                  {selectedNumbers.length}
                </p>
              </div>

              <div className="shrink-0 rounded-md bg-white px-2 py-1 text-[9px] font-bold text-blue-600 shadow-sm sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-[10px]">
                Page {currentPage} /{" "}
                {totalPages}
              </div>

            </div>

            {/* ==================================================
                NUMBER GRID
            ================================================== */}

            <div
              className="
                mt-3
                min-w-0
                overflow-hidden
                rounded-xl
                border
                border-blue-100
                bg-gradient-to-br
                from-blue-50
                via-indigo-50/60
                to-slate-50
                p-1.5
                sm:mt-4
                sm:p-2.5
              "
            >

              {/*
                MOBILE  = 5 columns
                SMALL   = 8 columns
                MEDIUM  = 10 columns

                This prevents the buttons from becoming
                too narrow on phones.
              */}

              <div
                className="
                  grid
                  w-full
                  min-w-0
                  grid-cols-5
                  gap-1
                  sm:grid-cols-8
                  md:grid-cols-10
                  sm:gap-1
                "
              >

                {pageNumbers.map((value) => {

                  const selected =
                    isSelected(value);

                  const blocked =
                    isBlocked(value);

                  const currentAmount =
                    getNumberBetAmount(value);

                  const progress =
                    getNumberProgress(value);

                  const limitReached =
                    isLimitReached(value);

                  const nearLimit =
                    progress >= 80 &&
                    progress < 100;

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={
                        blocked ||
                        limitReached
                      }
                      onClick={() =>
                        toggleNumber(value)
                      }
                      title={
                        blocked
                          ? "This number is blocked"
                          : limitReached
                            ? "Maximum betting limit reached"
                            : `${currentAmount.toLocaleString()} / ${MAX_BET_PER_NUMBER.toLocaleString()} MMK`
                      }
                      className={`
                        relative
                        flex
                        h-7
                        min-w-0
                        w-full
                        items-center
                        justify-center
                        overflow-hidden
                        rounded-[5px]
                        border
                        px-0
                        text-[9px]
                        font-bold
                        leading-none
                        transition-all
                        duration-150

                        sm:h-7
                        sm:text-[10px]

                        md:h-8
                        md:text-[11px]

                        ${
                          blocked
                            ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400"
                            : limitReached
                              ? "cursor-not-allowed border-red-200 bg-red-100 text-red-400"
                              : selected
                                ? "border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-200 ring-1 ring-blue-300"
                                : nearLimit
                                  ? "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100"
                                  : "border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700"
                        }
                      `}
                    >

                      {/* NUMBER */}

                      <span className="relative z-10 flex items-center gap-0.5">
                        {selected && (
                          <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        )}

                        {value}
                      </span>

                      {/* PROGRESS */}

                      {!blocked && (
                        <span
                          className={`
                            absolute
                            bottom-0
                            left-0
                            h-0.5
                            w-full
                            ${
                              selected
                                ? "bg-white/30"
                                : "bg-slate-100"
                            }
                          `}
                        >
                          <span
                            className={`
                              block
                              h-full
                              ${
                                selected
                                  ? "bg-white"
                                  : limitReached
                                    ? "bg-red-400"
                                    : nearLimit
                                      ? "bg-orange-400"
                                      : "bg-blue-400"
                              }
                            `}
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </span>
                      )}

                    </button>
                  );
                })}

              </div>

            </div>

            {/* ==================================================
                LEGEND
            ================================================== */}

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-slate-400 sm:gap-x-4 sm:text-[10px]">

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-white ring-1 ring-blue-200" />
                Available
              </div>

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-blue-600" />
                Selected
              </div>

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-orange-400" />
                Near limit
              </div>

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-red-400" />
                Limit
              </div>

              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-slate-300" />
                Blocked
              </div>

            </div>

            {/* ==================================================
                PAGINATION
            ================================================== */}

            <div
              className="
                mt-4
                flex
                min-w-0
                flex-col
                gap-3
                border-t
                border-slate-100
                pt-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              {/* SHOWING */}

              <p className="shrink-0 text-[9px] text-slate-400 sm:text-[10px]">
                Showing{" "}
                <span className="font-semibold text-slate-600">
                  {formatNumber(
                    (currentPage - 1) *
                      NUMBERS_PER_PAGE,
                  )}
                </span>

                {" - "}

                <span className="font-semibold text-slate-600">
                  {formatNumber(
                    Math.min(
                      currentPage *
                        NUMBERS_PER_PAGE -
                        1,
                      999,
                    ),
                  )}
                </span>

                {" "}of 1,000
              </p>

              {/* PAGINATION CONTROLS */}

              <div
                className="
                  flex
                  min-w-0
                  max-w-full
                  items-center
                  gap-1
                "
              >

                {/* PREVIOUS */}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage - 1,
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="
                    flex
                    h-7
                    shrink-0
                    items-center
                    gap-0.5
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-1.5
                    text-[9px]
                    font-semibold
                    text-slate-500
                    transition
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-600
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:px-2
                    sm:text-[10px]
                  "
                >
                  <ChevronLeft className="h-3 w-3" />

                  <span className="hidden xs:inline">
                    Prev
                  </span>

                  <span className="xs:hidden">
                    Prev
                  </span>
                </button>

                {/* PAGE NUMBERS */}

                <div
                  className="
                    flex
                    min-w-0
                    flex-1
                    items-center
                    gap-0.5
                    overflow-x-auto
                    scrollbar-none
                  "
                >

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, index) =>
                      index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        goToPage(page)
                      }
                      className={`
                        flex
                        h-7
                        w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-md
                        text-[9px]
                        font-bold
                        transition
                        sm:text-[10px]
                        ${
                          currentPage ===
                          page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        }
                      `}
                    >
                      {page}
                    </button>
                  ))}

                </div>

                {/* NEXT */}

                <button
                  type="button"
                  onClick={() =>
                    goToPage(
                      currentPage + 1,
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="
                    flex
                    h-7
                    shrink-0
                    items-center
                    gap-0.5
                    rounded-md
                    border
                    border-slate-200
                    bg-white
                    px-1.5
                    text-[9px]
                    font-semibold
                    text-slate-500
                    transition
                    hover:border-blue-200
                    hover:bg-blue-50
                    hover:text-blue-600
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:px-2
                    sm:text-[10px]
                  "
                >
                  <span>Next</span>

                  <ChevronRight className="h-3 w-3" />
                </button>

              </div>

            </div>

          </div>

          {/* ==================================================
              BET AMOUNT
          ================================================== */}

          <div
            className="
              min-w-0
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
              sm:p-6
            "
          >

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 sm:h-10 sm:w-10 sm:rounded-xl">
                <Boxes className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Betting Amount
                </h2>

                <p className="truncate text-[10px] text-slate-400 sm:text-xs">
                  Apply this amount to all selected numbers
                </p>
              </div>

            </div>

            {/* ==================================================
                SELECTED NUMBER CHIPS
            ================================================== */}

            {selectedNumbers.length > 0 && (
              <div className="mt-4 sm:mt-5">

                <div className="mb-2 flex items-center justify-between gap-2">

                  <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                    Selected Numbers
                  </label>

                  <span className="shrink-0 text-[9px] font-semibold text-blue-500 sm:text-[10px]">
                    {selectedNumbers.length} selected
                  </span>

                </div>

                <div
                  className="
                    flex
                    max-h-28
                    min-w-0
                    flex-wrap
                    gap-1.5
                    overflow-y-auto
                    rounded-xl
                    border
                    border-blue-100
                    bg-blue-50/60
                    p-2
                    sm:p-2.5
                  "
                >

                  {selectedNumbers.map(
                    (selectedNumber) => (
                      <button
                        key={selectedNumber}
                        type="button"
                        onClick={() =>
                          removeSelectedNumber(
                            selectedNumber,
                          )
                        }
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          gap-1
                          rounded-md
                          bg-blue-600
                          px-1.5
                          py-1
                          text-[9px]
                          font-bold
                          text-white
                          shadow-sm
                          transition
                          hover:bg-red-500
                          sm:px-2
                          sm:text-[10px]
                        "
                      >
                        {selectedNumber}

                        <X className="h-2.5 w-2.5" />
                      </button>
                    ),
                  )}

                </div>

              </div>
            )}

            {/* ==================================================
                MANUAL NUMBER
            ================================================== */}

            <div className="mt-4 sm:mt-5">

              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">
                3D Number
              </label>

              <input
                value={number}
                onChange={(event) =>
                  handleNumberInput(
                    event.target.value,
                  )
                }
                placeholder="000 - 999"
                inputMode="numeric"
                maxLength={3}
                className="
                  w-full
                  min-w-0
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  py-3
                  text-center
                  text-xl
                  font-bold
                  tracking-[0.3em]
                  text-slate-900
                  outline-none
                  transition-all
                  placeholder:tracking-normal
                  placeholder:text-slate-400
                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-50
                  sm:px-4
                  sm:tracking-[0.35em]
                "
              />

              <p className="mt-2 text-[10px] text-slate-400 sm:text-xs">
                You can also enter a number manually.
              </p>

            </div>

            {/* ==================================================
                AMOUNT
            ================================================== */}

            <div className="mt-4 sm:mt-5">

              <label className="mb-2 block text-xs font-semibold text-slate-700 sm:text-sm">
                Bet Amount
              </label>

              <div className="relative min-w-0">

                <input
                  type="number"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value,
                    )
                  }
                  placeholder="Enter amount"
                  min={MIN_BET_AMOUNT}
                  className="
                    w-full
                    min-w-0
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    py-3
                    pr-14
                    text-sm
                    text-slate-900
                    outline-none
                    transition-all
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-50
                    sm:px-4
                  "
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 sm:right-4 sm:text-xs">
                  MMK
                </span>

              </div>

              <p className="mt-2 text-[10px] text-slate-400 sm:text-xs">
                Minimum bet:{" "}
                {MIN_BET_AMOUNT.toLocaleString()} MMK
              </p>

            </div>

            {/* ==================================================
                ADD BET
            ================================================== */}

            <button
              type="button"
              onClick={addBet}
              disabled={
                selectedNumbers.length ===
                  0 ||
                Number(amount) <
                  MIN_BET_AMOUNT
              }
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-blue-200
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:from-blue-700
                hover:to-indigo-700
                hover:shadow-lg
                disabled:cursor-not-allowed
                disabled:from-slate-300
                disabled:to-slate-300
                disabled:shadow-none
                sm:mt-5
              "
            >
              <Boxes className="h-4 w-4 shrink-0" />

              <span className="truncate">
                Add{" "}
                {selectedNumbers.length > 0
                  ? `${selectedNumbers.length} Numbers`
                  : "Selected Bet"}
              </span>
            </button>

          </div>

        </div>

        {/* ====================================================
            RIGHT - SELECTED BETS
        ==================================================== */}

        <div
          className="
            min-w-0
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            sm:p-6
          "
        >

          {/* HEADER */}

          <div className="flex min-w-0 items-center justify-between gap-3">

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                Selected Bets
              </h2>

              <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
                Review your selected numbers
              </p>
            </div>

            <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 px-2 text-[10px] font-bold text-blue-700 sm:h-8 sm:min-w-8 sm:text-xs">
              {bets.length}
            </span>

          </div>

          {/* BET LIST */}

          <div className="mt-4 max-h-[560px] min-w-0 space-y-3 overflow-y-auto pr-0.5 sm:mt-5 sm:pr-1">

            {bets.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center sm:p-8">

                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500 sm:h-11 sm:w-11">
                  <Boxes className="h-5 w-5" />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600 sm:text-sm">
                  No bets selected
                </p>

                <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                  Select numbers and add your bet.
                </p>

              </div>

            ) : (

              bets.map((bet) => {

                const progress =
                  getNumberProgress(
                    bet.number,
                  );

                const isEditing =
                  editingBetId ===
                  bet.id;

                const currentNumberAmount =
                  getNumberBetAmount(
                    bet.number,
                  );

                const maxEditableAmount =
                  MAX_BET_PER_NUMBER -
                  (
                    currentNumberAmount -
                    bet.amount
                  );

                return (
                  <div
                    key={bet.id}
                    className="
                      min-w-0
                      rounded-xl
                      border
                      border-slate-100
                      bg-slate-50
                      p-3
                      transition-all
                      hover:border-blue-100
                      hover:bg-blue-50/40
                      sm:p-4
                    "
                  >

                    {/* BET HEADER */}

                    <div className="flex min-w-0 items-center justify-between gap-2">

                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">

                        <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold tracking-widest text-slate-900 shadow-sm ring-1 ring-slate-100 sm:h-10 sm:w-14 sm:text-base">
                          {bet.number}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">
                            {bet.amount.toLocaleString()} MMK
                          </p>

                          <p className="mt-1 truncate text-[9px] text-slate-400 sm:text-[10px]">
                            Current number usage
                          </p>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      {!isEditing && (
                        <div className="flex shrink-0 items-center gap-0.5">

                          <button
                            type="button"
                            onClick={() =>
                              startEditBet(
                                bet,
                              )
                            }
                            className="
                              rounded-lg
                              p-1.5
                              text-slate-400
                              transition-all
                              hover:bg-blue-50
                              hover:text-blue-600
                              sm:p-2
                            "
                            title="Edit amount"
                          >
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              removeBet(
                                bet.id,
                              )
                            }
                            className="
                              rounded-lg
                              p-1.5
                              text-slate-400
                              transition-all
                              hover:bg-red-50
                              hover:text-red-500
                              sm:p-2
                            "
                            title="Delete bet"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>

                        </div>
                      )}

                    </div>

                    {/* EDIT */}

                    {isEditing && (
                      <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 sm:mt-4 sm:p-3">

                        <label className="mb-2 block text-[10px] font-semibold text-slate-600 sm:text-xs">
                          Edit Bet Amount
                        </label>

                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

                          <div className="relative min-w-0 flex-1">

                            <input
                              type="number"
                              min={
                                MIN_BET_AMOUNT
                              }
                              max={
                                maxEditableAmount
                              }
                              value={
                                editingAmount
                              }
                              onChange={(
                                event,
                              ) =>
                                setEditingAmount(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              autoFocus
                              className="
                                w-full
                                min-w-0
                                rounded-lg
                                border
                                border-blue-200
                                bg-white
                                px-3
                                py-2
                                pr-12
                                text-sm
                                font-semibold
                                text-slate-900
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-4
                                focus:ring-blue-50
                              "
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400">
                              MMK
                            </span>

                          </div>

                          <div className="flex shrink-0 gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                saveEditBet(
                                  bet,
                                )
                              }
                              disabled={
                                !Number(
                                  editingAmount,
                                ) ||
                                Number(
                                  editingAmount,
                                ) <
                                  MIN_BET_AMOUNT ||
                                Number(
                                  editingAmount,
                                ) >
                                  maxEditableAmount
                              }
                              className="
                                flex-1
                                rounded-lg
                                bg-blue-600
                                px-3
                                py-2
                                text-[10px]
                                font-semibold
                                text-white
                                transition
                                hover:bg-blue-700
                                disabled:cursor-not-allowed
                                disabled:bg-slate-300
                                sm:flex-none
                              "
                            >
                              Save
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelEditBet
                              }
                              className="
                                flex-1
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-2
                                text-[10px]
                                font-semibold
                                text-slate-500
                                transition
                                hover:bg-slate-50
                                sm:flex-none
                              "
                            >
                              Cancel
                            </button>

                          </div>

                        </div>

                      </div>
                    )}

                    {/* PROGRESS */}

                    <div className="mt-3">

                      <div className="mb-1 flex items-center justify-between text-[9px] sm:text-[10px]">

                        <span className="text-slate-400">
                          Number usage
                        </span>

                        <span className="font-semibold text-blue-600">
                          {Math.round(
                            progress,
                          )}
                          %
                        </span>

                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className={`
                            h-full
                            rounded-full
                            transition-all
                            ${
                              progress >=
                              100
                                ? "bg-red-500"
                                : progress >=
                                    80
                                  ? "bg-orange-400"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
                            }
                          `}
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

          {/* ==================================================
              TOTAL
          ================================================== */}

          <div className="mt-5 border-t border-slate-100 pt-4 sm:mt-6 sm:pt-5">

            <div className="flex items-center justify-between gap-3">

              <span className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Bet Amount
              </span>

              <span className="shrink-0 text-lg font-bold text-slate-900 sm:text-xl">
                {totalAmount.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-slate-400 sm:text-sm">
                  MMK
                </span>
              </span>

            </div>

            {/* PLACE BETS */}

            <button
              type="button"
              onClick={submitBets}
              disabled={bets.length === 0}
              className="
                mt-3
                w-full
                rounded-xl
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                shadow-md
                shadow-blue-200
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:from-blue-700
                hover:to-indigo-700
                hover:shadow-lg
                disabled:cursor-not-allowed
                disabled:from-slate-300
                disabled:to-slate-300
                disabled:shadow-none
                sm:mt-4
              "
            >
              Place 3D Bets
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}