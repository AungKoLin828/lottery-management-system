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
} from "lucide-react";

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

export default function MyTickets() {
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);

  /* ============================================================
     STATUS
  ============================================================ */

  const getStatusStyle = (status: TicketData["status"]) => {
    switch (status) {
      case "Won":
        return "border border-emerald-200 bg-emerald-50 text-emerald-700";

      case "Lost":
        return "border border-red-200 bg-red-50 text-red-700";

      default:
        return "border border-amber-200 bg-amber-50 text-amber-700";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div>
          <p className="text-sm font-medium text-indigo-600">Player</p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">My Tickets</h1>

          <p className="mt-2 text-sm text-slate-500">
            View your lottery tickets and selected numbers.
          </p>
        </div>

        {/* =====================================================
            TICKET LIST
        ====================================================== */}

        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedTicket(ticket)}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-150 hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              {/* LEFT */}

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                  <Ticket size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {ticket.id}
                  </p>

                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-700">
                      {ticket.type}
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="text-slate-500">{ticket.date}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT */}

              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {ticket.amount.toLocaleString()}{" "}
                    <span className="text-xs font-semibold text-slate-500">
                      MMK
                    </span>
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${getStatusStyle(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <span className="hidden text-xs font-semibold text-slate-500 transition group-hover:text-indigo-600 sm:block">
                  View
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          TICKET DETAIL MODAL
      ====================================================== */}

      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Ticket size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Ticket Details
                  </h2>

                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {selectedTicket.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                CONTENT
            ================================================== */}

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {/* =================================================
                  TICKET INFORMATION
              ================================================== */}

              <div className="grid grid-cols-2 gap-2.5">
                {/* Type */}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Hash className="h-3.5 w-3.5" />

                    <span className="text-[11px] font-medium">
                      Lottery Type
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedTicket.type}
                  </p>
                </div>

                {/* Date */}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span className="text-[11px] font-medium">Date</span>
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedTicket.date}
                  </p>
                </div>

                {/* Amount */}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CircleDollarSign className="h-3.5 w-3.5" />

                    <span className="text-[11px] font-medium">
                      Total Amount
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedTicket.amount.toLocaleString()}{" "}
                    <span className="text-xs font-semibold text-slate-500">
                      MMK
                    </span>
                  </p>
                </div>

                {/* Status */}

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    {selectedTicket.status === "Won" ? (
                      <Trophy className="h-3.5 w-3.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5" />
                    )}

                    <span className="text-[11px] font-medium">Status</span>
                  </div>

                  <p
                    className={`mt-1 text-sm font-bold ${
                      selectedTicket.status === "Won"
                        ? "text-emerald-600"
                        : selectedTicket.status === "Lost"
                          ? "text-red-600"
                          : "text-amber-600"
                    }`}
                  >
                    {selectedTicket.status}
                  </p>
                </div>
              </div>

              {/* =================================================
                  SELECTED NUMBERS
              ================================================== */}

              <div className="mt-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Selected Numbers
                    </h3>

                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                      {selectedTicket.bets.length} number
                      {selectedTicket.bets.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">
                    {selectedTicket.type}
                  </span>
                </div>

                {/* BET LIST */}

                <div className="space-y-1.5">
                  {selectedTicket.bets.map((bet, index) => (
                    <div
                      key={`${bet.number}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        {/* Number */}

                        <div className="flex h-8 min-w-12 items-center justify-center rounded-md bg-indigo-50 px-2 text-sm font-bold tracking-wider text-indigo-700">
                          {bet.number}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {bet.amount.toLocaleString()}{" "}
                            <span className="text-xs font-semibold text-slate-500">
                              MMK
                            </span>
                          </p>

                          {selectedTicket.type === "2D" && bet.session && (
                            <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                              {bet.session} Session
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-slate-400">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================
                  TOTAL
              ================================================== */}

              <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-700">
                  Total Bet
                </span>

                <span className="text-base font-bold text-emerald-700">
                  {selectedTicket.bets
                    .reduce((sum, bet) => sum + bet.amount, 0)
                    .toLocaleString()}{" "}
                  <span className="text-xs font-semibold text-emerald-600">
                    MMK
                  </span>
                </span>
              </div>
            </div>

            {/* =================================================
                CLOSE
            ================================================== */}

            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
