// src/pages/player/Play3D.tsx

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Dice5,
  Lock,
  Pencil,
  Trash2,
  X,
  ShoppingBasket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type Bet3D = {
  id: string;
  number: string;
  amount: number;
};

type NumberUsage = Record<string, number>;

/* ============================================================
   ADMIN CONFIGURATION
============================================================ */

const MAX_BET_AMOUNT = 10_000;

/*
 * Numbers that cannot be selected.
 *
 * Example:
 * const BLOCKED_NUMBERS = ["123", "456"];
 */
const BLOCKED_NUMBERS: string[] = [];

/*
 * Mock usage data.
 *
 * Since AM / PM session has been removed,
 * usage is now stored in one single object.
 *
 * Replace this with API/database data later.
 */
const INITIAL_USAGE: NumberUsage = {
  "000": 2_000,
  "001": 5_000,
  "003": 3_000,
  "012": 7_500,
  "018": 6_000,
  "055": 8_500,
  "088": 10_000,
  "125": 10_000,
  "222": 8_000,
  "333": 7_500,
  "555": 9_000,
  "888": 9_500,
};

/* ============================================================
   NUMBER LIST
============================================================ */

/*
 * 000 - 999
 */
const NUMBER_LIST = Array.from(
  { length: 1000 },
  (_, index) => index.toString().padStart(3, "0"),
);

/*
 * 100 numbers per page
 *
 * Page 1  = 000 - 099
 * Page 2  = 100 - 199
 * Page 3  = 200 - 299
 * ...
 * Page 10 = 900 - 999
 */
const NUMBERS_PER_PAGE = 100;

const TOTAL_PAGES = Math.ceil(
  NUMBER_LIST.length / NUMBERS_PER_PAGE,
);

/* ============================================================
   COMPONENT
============================================================ */

export default function Play3D() {
  /* ============================================================
     STATE
  ============================================================ */

  const [selectedNumbers, setSelectedNumbers] = useState<string[]>(
    [],
  );

  const [amount, setAmount] = useState("");

  const [bets, setBets] = useState<Bet3D[]>([]);

  const [editingBetId, setEditingBetId] = useState<string | null>(
    null,
  );

  const [editingAmount, setEditingAmount] = useState("");

  /*
   * Mobile selected bets bottom sheet.
   */
  const [mobileBetsOpen, setMobileBetsOpen] = useState(false);

  /*
   * Number usage.
   */
  const [numberUsage] =
    useState<NumberUsage>(INITIAL_USAGE);

  /*
   * Pagination.
   */
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================================
     PAGINATION CALCULATIONS
  ============================================================ */

  const currentPageNumbers = useMemo(() => {
    const startIndex =
      (currentPage - 1) * NUMBERS_PER_PAGE;

    const endIndex =
      startIndex + NUMBERS_PER_PAGE;

    return NUMBER_LIST.slice(
      startIndex,
      endIndex,
    );
  }, [currentPage]);

  const pageStartNumber =
    (currentPage - 1) * NUMBERS_PER_PAGE;

  const pageEndNumber = Math.min(
    pageStartNumber + NUMBERS_PER_PAGE - 1,
    NUMBER_LIST.length - 1,
  );

  /* ============================================================
     CALCULATIONS
  ============================================================ */

  const totalAmount = useMemo(
    () =>
      bets.reduce(
        (sum, bet) => sum + bet.amount,
        0,
      ),
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
    return numberUsage[number] ?? 0;
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
    if (
      isBlocked(number) ||
      isLimitReached(number)
    ) {
      return;
    }

    setSelectedNumbers((current) => {
      if (current.includes(number)) {
        return current.filter(
          (item) => item !== number,
        );
      }

      return [...current, number];
    });
  };

  /* ============================================================
     PAGINATION
  ============================================================ */

  const goToPage = (page: number) => {
    const safePage = Math.max(
      1,
      Math.min(page, TOTAL_PAGES),
    );

    setCurrentPage(safePage);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(
        (page) => page - 1,
      );
    }
  };

  const goToNextPage = () => {
    if (currentPage < TOTAL_PAGES) {
      setCurrentPage(
        (page) => page + 1,
      );
    }
  };

  /* ============================================================
     SELECT ALL / CLEAR
  ============================================================ */

  const selectAllAvailable = () => {
    const availableNumbers =
      currentPageNumbers.filter(
        (item) =>
          !isBlocked(item) &&
          !isLimitReached(item),
      );

    setSelectedNumbers((current) => {
      const merged = new Set([
        ...current,
        ...availableNumbers,
      ]);

      return Array.from(merged);
    });
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
      betAmount < 100
    ) {
      return;
    }

    const validNumbers =
      selectedNumbers.filter((item) => {
        const remaining =
          getRemainingAmount(item);

        return (
          !isBlocked(item) &&
          remaining >= betAmount
        );
      });

    if (validNumbers.length === 0) {
      return;
    }

    const newBets: Bet3D[] =
      validNumbers.map((item) => ({
        id: crypto.randomUUID(),
        number: item,
        amount: betAmount,
      }));

    setBets((current) => {
      /*
       * If the same number already exists,
       * replace the previous bet.
       */
      const filtered = current.filter(
        (existing) =>
          !newBets.some(
            (newBet) =>
              newBet.number ===
              existing.number,
          ),
      );

      return [...filtered, ...newBets];
    });

    setSelectedNumbers([]);
    setAmount("");

    /*
     * Automatically open selected bets
     * on mobile.
     */
    if (window.innerWidth < 1024) {
      setMobileBetsOpen(true);
    }
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
      newAmount < 100
    ) {
      return;
    }

    const currentAmount =
      bet.amount;

    const usedAmount =
      getUsedAmount(bet.number);

    const availableForEdit =
      MAX_BET_AMOUNT -
      (usedAmount - currentAmount);

    if (
      newAmount >
      availableForEdit
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

    console.log("3D Bets:", bets);

    /*
     * Replace this with your API request.
     *
     * Example:
     *
     * await api.post("/bets/3d", {
     *   bets,
     * });
     */

    setMobileBetsOpen(false);
  };

  /* ============================================================
     FORMAT
  ============================================================ */

  const formatAmount = (value: number) => {
    return value.toLocaleString();
  };

  /* ============================================================
     MOBILE BODY LOCK
  ============================================================ */

  useEffect(() => {
    if (!mobileBetsOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [mobileBetsOpen]);

  /* ============================================================
     BET CARD
  ============================================================ */

  const renderBetCard = (bet: Bet3D) => {
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
        {/* HEADER */}

        <div className="flex items-center justify-between gap-3">
          {/* NUMBER */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-extrabold tracking-widest text-white shadow-sm shadow-violet-200">
              {bet.number}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">
                3D Number
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Selected bet
              </p>
            </div>
          </div>

          {/* ACTIONS */}

          {!isEditing && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  startEditBet(bet)
                }
                className="rounded-lg p-2 text-slate-400 transition-all hover:bg-violet-100 hover:text-violet-600"
                title="Edit amount"
                aria-label={`Edit bet ${bet.number}`}
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
                aria-label={`Delete bet ${bet.number}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* EDIT */}

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
                  max={
                    maxEditableAmount
                  }
                  value={
                    editingAmount
                  }
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

            <p className="mt-2 text-[10px] text-slate-400">
              Maximum:{" "}
              {formatAmount(
                maxEditableAmount,
              )}{" "}
              MMK
            </p>
          </div>
        ) : (
          /* AMOUNT */

          <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
            <span className="text-xs text-slate-400">
              Amount
            </span>

            <span className="text-sm font-bold text-slate-800">
              {formatAmount(
                bet.amount,
              )}{" "}
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
    <div className="w-full max-w-full space-y-6 overflow-x-hidden pb-24 lg:pb-0">
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

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

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          3D Play
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select your lucky 3D numbers and
          enter your bet amount.
        </p>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ====================================================
            LEFT - BET FORM
        ==================================================== */}

        <div className="min-w-0 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:p-6">
          {/* HEADER */}

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200">
              <Dice5 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                Place 3D Bet
              </h2>

              <p className="text-xs text-slate-400">
                Choose one or more 3-digit
                numbers
              </p>
            </div>
          </div>

          {/* ==================================================
              NUMBER SELECTION
          ================================================== */}

          <div className="mt-6 min-w-0">
            {/* NUMBER HEADER */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Numbers
                </label>

                <p className="mt-1 text-xs text-slate-400">
                  Choose your 3D numbers from
                  000 to 999
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 self-start">
                <button
                  type="button"
                  onClick={
                    selectAllAvailable
                  }
                  className="rounded-md border border-violet-200 bg-violet-100 px-2.5 py-1.5 text-[10px] font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-200"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={
                    clearSelection
                  }
                  disabled={
                    selectedNumbers.length ===
                    0
                  }
                  className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* =================================================
                CURRENT PAGE RANGE
            ================================================= */}

            <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
              <span className="truncate text-[10px] font-semibold text-violet-600 sm:text-xs">
                Numbers{" "}
                {pageStartNumber
                  .toString()
                  .padStart(3, "0")}{" "}
                -{" "}
                {pageEndNumber
                  .toString()
                  .padStart(3, "0")}
              </span>

              <span className="shrink-0 text-[10px] font-medium text-slate-400 sm:text-xs">
                Page {currentPage} /{" "}
                {TOTAL_PAGES}
              </span>
            </div>

            {/* =================================================
                3D NUMBER GRID
            ================================================= */}

            <div className="mt-3 w-full min-w-0 overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-violet-100 via-indigo-50 to-blue-100 p-1.5 shadow-inner xs:p-2 sm:p-3">
              <div
                className="
                  grid
                  w-full
                  grid-cols-5
                  gap-1
                  min-[360px]:grid-cols-6
                  min-[420px]:grid-cols-7
                  sm:grid-cols-10
                  md:grid-cols-12
                  lg:grid-cols-15
                "
              >
                {currentPageNumbers.map(
                  (item) => {
                    const selected =
                      isSelected(item);

                    const blocked =
                      isBlocked(item);

                    const limitReached =
                      isLimitReached(
                        item,
                      );

                    const used =
                      getUsedAmount(
                        item,
                      );

                    const progress =
                      getProgress(
                        item,
                      );

                    const unavailable =
                      blocked ||
                      limitReached;

                    const nearLimit =
                      progress >= 80 &&
                      progress < 100;

                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={
                          unavailable
                        }
                        onClick={() =>
                          toggleNumber(
                            item,
                          )
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
                          relative
                          flex
                          h-9
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
                          min-[420px]:h-9
                          sm:h-10

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

                          <span className="text-[8px] font-bold leading-none min-[360px]:text-[8px] min-[420px]:text-[9px] sm:text-[10px]">
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
                          className={`mt-0.5 max-w-full truncate px-0.5 text-[4px] font-medium leading-none min-[360px]:text-[4px] min-[420px]:text-[5px] sm:text-[6px] ${
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
                              : formatAmount(
                                  used,
                                )}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* =================================================
                SMALL RESPONSIVE PAGINATION
            ================================================= */}

            <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 shadow-sm">
              {/* PREVIOUS */}

              <button
                type="button"
                onClick={
                  goToPreviousPage
                }
                disabled={
                  currentPage === 1
                }
                aria-label="Previous page"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>

              {/* PAGE NUMBERS */}

              <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden">
                {Array.from(
                  {
                    length: TOTAL_PAGES,
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
                    aria-label={`Go to page ${page}`}
                    aria-current={
                      currentPage === page
                        ? "page"
                        : undefined
                    }
                    className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[9px] font-bold transition sm:h-7 sm:min-w-7 sm:text-[10px] ${
                      currentPage ===
                      page
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* NEXT */}

              <button
                type="button"
                onClick={
                  goToNextPage
                }
                disabled={
                  currentPage ===
                  TOTAL_PAGES
                }
                aria-label="Next page"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* PAGE INFO */}

            <div className="mt-1.5 text-center text-[9px] text-slate-400">
              Showing{" "}
              <span className="font-bold text-slate-600">
                {pageStartNumber
                  .toString()
                  .padStart(3, "0")}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-600">
                {pageEndNumber
                  .toString()
                  .padStart(3, "0")}
              </span>
            </div>

            {/* LEGEND */}

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

          <div className="mt-5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-100 via-indigo-50 to-blue-100 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-4">
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
                  {formatAmount(
                    selectedTotal,
                  )}{" "}
                  <span className="text-xs">
                    MMK
                  </span>
                </p>
              </div>
            </div>

            {/* SELECTED NUMBERS */}

            {selectedNumbers.length >
              0 && (
              <div className="mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {selectedNumbers.map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        toggleNumber(
                          item,
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-violet-700 shadow-sm ring-1 ring-violet-200 transition hover:bg-violet-100"
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
                  setAmount(
                    event.target.value,
                  )
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
              Minimum bet: 100 MMK per
              number.
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
              !Number(amount) ||
              Number(amount) < 100
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            <Dice5 className="h-4 w-4" />

            Add{" "}
            {selectedNumbers.length >
            0
              ? `${selectedNumbers.length} Numbers`
              : "Selected Bet"}
          </button>
        </div>

        {/* ====================================================
            DESKTOP - SELECTED BETS
        ==================================================== */}

        <div className="hidden min-w-0 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6 xl:block">
          {/* HEADER */}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Selected Bets
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Review your selected 3D
                numbers
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
                  Select 3D numbers and
                  enter an amount.
                </p>
              </div>
            ) : (
              bets.map(renderBetCard)
            )}
          </div>

          {/* TOTAL */}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Total Bet Amount
              </span>

              <span className="text-xl font-bold text-slate-900">
                {formatAmount(
                  totalAmount,
                )}{" "}
                <span className="text-sm font-semibold text-slate-400">
                  MMK
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={submitBets}
              disabled={
                bets.length === 0
              }
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-violet-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
            >
              Place 3D Bets
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MOBILE FIXED SELECTED BETS BAR
      ======================================================= */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() =>
            setMobileBetsOpen(true)
          }
          className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-4 py-3 text-left text-white shadow-lg shadow-violet-200 transition active:scale-[0.99]"
        >
          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBasket className="h-5 w-5" />

              {bets.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-900 ring-2 ring-violet-600">
                  {bets.length}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-violet-100">
                Selected Bets
              </p>

              <p className="truncate text-sm font-bold">
                {bets.length === 0
                  ? "No bets selected"
                  : `${bets.length} ${
                      bets.length ===
                      1
                        ? "bet"
                        : "bets"
                    } selected`}
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-medium text-violet-100">
                Total
              </p>

              <p className="text-sm font-extrabold">
                {formatAmount(
                  totalAmount,
                )}{" "}
                MMK
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              <span className="text-lg">
                ↑
              </span>
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
          aria-label="Selected 3D Bets"
        >
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close selected bets"
            onClick={() =>
              setMobileBetsOpen(false)
            }
            className="absolute inset-0 h-full w-full bg-slate-950/60 backdrop-blur-[2px]"
          />

          {/* BOTTOM SHEET */}

          <div className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            {/* HANDLE */}

            <div className="flex shrink-0 justify-center pt-3">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            {/* HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                  <ShoppingBasket className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold text-slate-900">
                      Selected 3D Bets
                    </h2>

                    <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">
                      {bets.length}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Review and edit your 3D
                    bets
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileBetsOpen(
                    false,
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                aria-label="Close selected bets"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* BET LIST */}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              {bets.length === 0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                    <Dice5 className="h-6 w-6" />
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-700">
                    No bets selected
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                    Select 3D numbers from
                    the grid, enter your
                    amount, then add the bet.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileBetsOpen(
                        false,
                      )
                    }
                    className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    Choose Numbers
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bets.map(
                    renderBetCard,
                  )}
                </div>
              )}
            </div>

            {/* MOBILE TOTAL / SUBMIT */}

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Total Bet Amount
                  </p>

                  <p className="mt-0.5 text-xl font-extrabold text-slate-900">
                    {formatAmount(
                      totalAmount,
                    )}{" "}
                    <span className="text-sm font-bold text-slate-400">
                      MMK
                    </span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-medium text-slate-400">
                    Numbers
                  </p>

                  <p className="mt-0.5 text-lg font-extrabold text-violet-600">
                    {bets.length}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  submitBets
                }
                disabled={
                  bets.length === 0
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-violet-200 transition-all hover:from-violet-700 hover:via-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:via-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                <Check className="h-4 w-4" />

                Place 3D Bets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}