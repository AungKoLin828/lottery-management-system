// src/pages/player/MyTickets.tsx

import { useState } from "react";

import {
  Ticket,
  X,
  Hash,
  CalendarDays,
  CircleDollarSign,
  Trophy,
  Clock3,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Timer,
  WalletCards,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type TicketBet = {
  number: string;
  amount: number;
  session?: "AM" | "PM";
};

type TicketData = {
  id: string;
  type: "2D" | "3D";
  date: string;
  amount: number;
  status: "Pending" | "Won" | "Lost";
  bets: TicketBet[];
};

/* ============================================================
   DEMO DATA
============================================================ */

const tickets: TicketData[] = [
  {
    id: "TKT-10001",
    type: "2D",
    date: "12 Aug 2026",
    amount: 5000,
    status: "Pending",
    bets: [
      {
        number: "12",
        amount: 1000,
        session: "AM",
      },
      {
        number: "25",
        amount: 1000,
        session: "AM",
      },
      {
        number: "48",
        amount: 1000,
        session: "PM",
      },
      {
        number: "66",
        amount: 2000,
        session: "PM",
      },
    ],
  },
  {
    id: "TKT-10002",
    type: "3D",
    date: "11 Aug 2026",
    amount: 10000,
    status: "Won",
    bets: [
      {
        number: "123",
        amount: 5000,
      },
      {
        number: "789",
        amount: 5000,
      },
    ],
  },
  {
    id: "TKT-10003",
    type: "2D",
    date: "10 Aug 2026",
    amount: 3000,
    status: "Lost",
    bets: [
      {
        number: "08",
        amount: 1000,
        session: "AM",
      },
      {
        number: "31",
        amount: 1000,
        session: "PM",
      },
      {
        number: "57",
        amount: 1000,
        session: "PM",
      },
    ],
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function MyTickets() {
  const [selectedTicket, setSelectedTicket] =
    useState<TicketData | null>(null);

  /* ============================================================
     STATUS CONFIG
  ============================================================ */

  const getStatusConfig = (
    status: TicketData["status"],
  ) => {
    switch (status) {
      case "Won":
        return {
          label: "Won",
          icon: Trophy,
          badge:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
          iconBox:
            "bg-emerald-100 text-emerald-600",
          accent:
            "from-emerald-500 to-green-500",
          amount:
            "text-emerald-600",
        };

      case "Lost":
        return {
          label: "Lost",
          icon: XCircle,
          badge:
            "border-red-200 bg-red-50 text-red-700",
          iconBox:
            "bg-red-100 text-red-600",
          accent:
            "from-red-500 to-rose-500",
          amount:
            "text-red-600",
        };

      default:
        return {
          label: "Pending",
          icon: Timer,
          badge:
            "border-amber-200 bg-amber-50 text-amber-700",
          iconBox:
            "bg-amber-100 text-amber-600",
          accent:
            "from-amber-400 to-orange-500",
          amount:
            "text-amber-600",
        };
    }
  };

  /* ============================================================
     TYPE CONFIG
  ============================================================ */

  const getTypeConfig = (
    type: TicketData["type"],
  ) => {
    if (type === "3D") {
      return {
        label: "3D",
        badge:
          "bg-violet-50 text-violet-700 border-violet-200",
        icon:
          "bg-gradient-to-br from-violet-500 to-purple-600",
        number:
          "border-violet-200 bg-violet-50 text-violet-700",
      };
    }

    return {
      label: "2D",
      badge:
        "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon:
        "bg-gradient-to-br from-indigo-500 to-blue-600",
      number:
        "border-indigo-200 bg-indigo-50 text-indigo-700",
    };
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      <div className="space-y-7">

        {/* ======================================================
            PAGE HEADER
        ======================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

          {/* Background decoration */}

          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-100/60 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            {/* TITLE */}

            <div>
              <div className="mb-2 flex items-center gap-2">

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                  <Ticket className="h-4 w-4" />
                </span>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Player
                </p>
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                My Tickets
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                View your lottery tickets, selected numbers,
                bet amounts and results.
              </p>
            </div>

            {/* SUMMARY */}

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <Ticket className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Total Tickets
                </p>

                <p className="text-lg font-extrabold text-slate-900">
                  {tickets.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================
            TICKET LIST
        ======================================================= */}

        <div className="space-y-3">

          {tickets.map((ticket) => {
            const status =
              getStatusConfig(ticket.status);

            const type =
              getTypeConfig(ticket.type);

            const StatusIcon = status.icon;

            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() =>
                  setSelectedTicket(ticket)
                }
                className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 sm:p-5"
              >

                {/* LEFT COLOR LINE */}

                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b ${status.accent}`}
                />

                <div className="flex items-center gap-3 sm:gap-4">

                  {/* TICKET ICON */}

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${type.icon}`}
                  >
                    <Ticket className="h-5 w-5" />
                  </div>

                  {/* MAIN */}

                  <div className="min-w-0 flex-1">

                    {/* TOP ROW */}

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="truncate text-sm font-extrabold text-slate-900">
                        {ticket.id}
                      </span>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${type.badge}`}
                      >
                        {type.label}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${status.badge}`}
                      >
                        <StatusIcon className="h-3 w-3" />

                        {status.label}
                      </span>
                    </div>

                    {/* DATE */}

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">

                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                      <span>
                        {ticket.date}
                      </span>

                      <span className="text-slate-300">
                        •
                      </span>

                      <span>
                        {ticket.bets.length} bet
                        {ticket.bets.length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {/* NUMBER PREVIEW */}

                    <div className="mt-3 flex items-center gap-1.5 overflow-hidden">

                      {ticket.bets
                        .slice(0, 4)
                        .map((bet, index) => (
                          <span
                            key={`${bet.number}-${index}`}
                            className={`flex h-7 min-w-8 items-center justify-center rounded-md border px-1.5 text-[11px] font-extrabold ${type.number}`}
                          >
                            {bet.number}
                          </span>
                        ))}

                      {ticket.bets.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{ticket.bets.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}

                  <div className="flex shrink-0 items-center gap-3">

                    <div className="hidden text-right sm:block">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Total
                      </p>

                      <p
                        className={`mt-0.5 text-base font-extrabold ${status.amount}`}
                      >
                        {ticket.amount.toLocaleString()}
                        <span className="ml-1 text-[10px] font-bold text-slate-400">
                          MMK
                        </span>
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>

                {/* MOBILE AMOUNT */}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 sm:hidden">

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <WalletCards className="h-3.5 w-3.5" />

                    <span>Total Amount</span>
                  </div>

                  <p
                    className={`text-sm font-extrabold ${status.amount}`}
                  >
                    {ticket.amount.toLocaleString()}{" "}
                    <span className="text-[10px] text-slate-400">
                      MMK
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ======================================================
            EMPTY STATE
        ======================================================= */}

        {tickets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <Ticket className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-base font-bold text-slate-900">
              No tickets yet
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Your lottery tickets will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================
          TICKET DETAIL MODAL
      ========================================================= */}

      {selectedTicket && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-5"
          onClick={() =>
            setSelectedTicket(null)
          }
        >

          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-slate-950/40"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* ==================================================
                MODAL HEADER
            =================================================== */}

            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-5 py-5 sm:px-6">

              {/* DECORATION */}

              <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />

              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />

              <div className="relative flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/50">
                    <Ticket className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">

                      <h2 className="text-sm font-extrabold text-white">
                        Ticket Details
                      </h2>

                      <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                    </div>

                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {selectedTicket.id}
                    </p>
                  </div>
                </div>

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedTicket(null)
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95"
                  title="Close"
                  aria-label="Close ticket details"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* STATUS */}

              <div className="relative mt-4 flex items-center justify-between">

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Lottery
                  </p>

                  <p className="mt-1 text-lg font-extrabold text-white">
                    {selectedTicket.type}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusConfig(selectedTicket.status).badge}`}
                >
                  {(() => {
                    const Icon =
                      getStatusConfig(
                        selectedTicket.status,
                      ).icon;

                    return (
                      <Icon className="h-3.5 w-3.5" />
                    );
                  })()}

                  {selectedTicket.status}
                </div>
              </div>
            </div>

            {/* ==================================================
                MODAL CONTENT
            =================================================== */}

            <div className="max-h-[68vh] overflow-y-auto p-4 sm:p-5">

              {/* =================================================
                  INFO CARDS
              ================================================== */}

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">

                {/* TYPE */}

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                    <Hash className="h-4 w-4" />
                  </div>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Type
                  </p>

                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                    {selectedTicket.type}
                  </p>
                </div>

                {/* DATE */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                    <CalendarDays className="h-4 w-4" />
                  </div>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Date
                  </p>

                  <p className="mt-0.5 truncate text-sm font-extrabold text-slate-900">
                    {selectedTicket.date}
                  </p>
                </div>

                {/* AMOUNT */}

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Amount
                  </p>

                  <p className="mt-0.5 text-sm font-extrabold text-emerald-700">
                    {selectedTicket.amount.toLocaleString()}
                  </p>
                </div>

                {/* STATUS */}

                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
                    {selectedTicket.status ===
                    "Won" ? (
                      <Trophy className="h-4 w-4" />
                    ) : selectedTicket.status ===
                      "Lost" ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <Clock3 className="h-4 w-4" />
                    )}
                  </div>

                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </p>

                  <p
                    className={`mt-0.5 text-sm font-extrabold ${
                      selectedTicket.status ===
                      "Won"
                        ? "text-emerald-600"
                        : selectedTicket.status ===
                          "Lost"
                          ? "text-red-600"
                          : "text-amber-600"
                    }`}
                  >
                    {selectedTicket.status}
                  </p>
                </div>
              </div>

              {/* =================================================
                  NUMBERS HEADER
              ================================================== */}

              <div className="mt-6 flex items-end justify-between">

                <div>
                  <div className="flex items-center gap-2">

                    <h3 className="text-sm font-extrabold text-slate-900">
                      Selected Numbers
                    </h3>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {selectedTicket.bets.length}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] font-medium text-slate-500">
                    Numbers included in this ticket
                  </p>
                </div>

                <span
                  className={`rounded-lg border px-2.5 py-1 text-[10px] font-extrabold ${getTypeConfig(selectedTicket.type).badge}`}
                >
                  {selectedTicket.type}
                </span>
              </div>

              {/* =================================================
                  BET LIST
              ================================================== */}

              <div className="mt-3 space-y-2">

                {selectedTicket.bets.map(
                  (bet, index) => {

                    const type =
                      getTypeConfig(
                        selectedTicket.type,
                      );

                    return (
                      <div
                        key={`${bet.number}-${index}`}
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-100 hover:bg-slate-50/70"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          {/* NUMBER */}

                          <div
                            className={`flex h-11 min-w-14 items-center justify-center rounded-xl border px-2 text-base font-black tracking-widest ${type.number}`}
                          >
                            {bet.number}
                          </div>

                          <div className="min-w-0">

                            <p className="text-sm font-extrabold text-slate-900">
                              {bet.amount.toLocaleString()}{" "}
                              <span className="text-[10px] font-bold text-slate-400">
                                MMK
                              </span>
                            </p>

                            {selectedTicket.type ===
                              "2D" &&
                              bet.session && (
                                <div className="mt-1 flex items-center gap-1.5">

                                  <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                    <Clock3 className="h-3 w-3" />

                                    Session
                                  </span>

                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold ${
                                      bet.session ===
                                      "AM"
                                        ? "bg-sky-50 text-sky-600"
                                        : "bg-violet-50 text-violet-600"
                                    }`}
                                  >
                                    {bet.session}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* INDEX */}

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-500">
                          {index + 1}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {/* =================================================
                  TOTAL BET
              ================================================== */}

              <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">

                <div className="flex items-center justify-between p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <CircleDollarSign className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        Total Bet
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                        {selectedTicket.bets.length} selected number
                        {selectedTicket.bets.length !==
                        1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <p className="text-lg font-black text-emerald-700">
                    {selectedTicket.bets
                      .reduce(
                        (sum, bet) =>
                          sum + bet.amount,
                        0,
                      )
                      .toLocaleString()}
                    <span className="ml-1 text-[10px] font-bold text-emerald-600">
                      MMK
                    </span>
                  </p>
                </div>
              </div>

              {/* =================================================
                  TICKET TOTAL VS BET TOTAL
              ================================================== */}

              <div className="mt-2 flex items-center justify-between px-1 text-[10px] font-medium text-slate-400">

                <span>
                  Ticket Amount
                </span>

                <span className="font-bold text-slate-600">
                  {selectedTicket.amount.toLocaleString()} MMK
                </span>
              </div>
            </div>

            {/* ==================================================
                MODAL FOOTER
            =================================================== */}

            <div className="border-t border-slate-100 bg-slate-50/80 p-3 sm:p-4">

              <button
                type="button"
                onClick={() =>
                  setSelectedTicket(null)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:from-slate-700 hover:to-slate-900 active:translate-y-0"
              >
                <CheckCircle2 className="h-4 w-4" />

                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}