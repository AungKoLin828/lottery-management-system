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

  const getStatusStyle = (status: TicketData["status"]) => {
    switch (status) {
      case "Won":
        return "bg-emerald-500/10 text-emerald-400";

      case "Lost":
        return "bg-red-500/10 text-red-400";

      default:
        return "bg-amber-500/10 text-amber-400";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div>
          <p className="text-sm text-emerald-400">Player</p>

          <h1 className="mt-1 text-3xl font-bold text-white">My Tickets</h1>

          <p className="mt-2 text-sm text-slate-400">
            View your lottery tickets and selected numbers.
          </p>
        </div>

        {/* =====================================================
            TICKET LIST
        ====================================================== */}

        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedTicket(ticket)}
              className="group flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-200 hover:border-emerald-500/30 hover:bg-white/[0.05] hover:shadow-lg hover:shadow-emerald-500/5 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Left */}

              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400 transition group-hover:bg-emerald-500/20">
                  <Ticket size={20} />
                </div>

                <div>
                  <p className="font-semibold text-white">{ticket.id}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.type} · {ticket.date}
                  </p>
                </div>
              </div>

              {/* Right */}

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="font-semibold text-white">
                    {ticket.amount.toLocaleString()} MMK
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>

                <span className="text-xs font-semibold text-slate-500 transition group-hover:text-emerald-400">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* =================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-emerald-400" />

                  <h2 className="font-bold text-white">Ticket Details</h2>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedTicket.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* =================================================
                TICKET INFORMATION
            ================================================== */}

            <div className="max-h-[75vh] overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3">
                {/* Type */}

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Hash className="h-4 w-4" />

                    <span className="text-xs">Lottery Type</span>
                  </div>

                  <p className="mt-2 font-bold text-white">
                    {selectedTicket.type}
                  </p>
                </div>

                {/* Date */}

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarDays className="h-4 w-4" />

                    <span className="text-xs">Date</span>
                  </div>

                  <p className="mt-2 font-bold text-white">
                    {selectedTicket.date}
                  </p>
                </div>

                {/* Amount */}

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CircleDollarSign className="h-4 w-4" />

                    <span className="text-xs">Total Amount</span>
                  </div>

                  <p className="mt-2 font-bold text-white">
                    {selectedTicket.amount.toLocaleString()} MMK
                  </p>
                </div>

                {/* Status */}

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    {selectedTicket.status === "Won" ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      <Clock3 className="h-4 w-4" />
                    )}

                    <span className="text-xs">Status</span>
                  </div>

                  <p
                    className={`mt-2 font-bold ${
                      selectedTicket.status === "Won"
                        ? "text-emerald-400"
                        : selectedTicket.status === "Lost"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {selectedTicket.status}
                  </p>
                </div>
              </div>

              {/* =================================================
                  SELECTED NUMBERS
              ================================================== */}

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Selected Numbers</h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {selectedTicket.bets.length} number
                      {selectedTicket.bets.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    {selectedTicket.type}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTicket.bets.map((bet, index) => (
                    <div
                      key={`${bet.number}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* Number */}

                        <div className="flex h-10 min-w-12 items-center justify-center rounded-lg bg-emerald-500/10 px-2 font-bold tracking-wider text-emerald-400">
                          {bet.number}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">
                            {bet.amount.toLocaleString()} MMK
                          </p>

                          {selectedTicket.type === "2D" && bet.session && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {bet.session} Session
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================
                  TOTAL
              ================================================== */}

              <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <span className="text-sm text-slate-400">Total Bet</span>

                <span className="text-lg font-bold text-emerald-400">
                  {selectedTicket.bets
                    .reduce((sum, bet) => sum + bet.amount, 0)
                    .toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            </div>

            {/* =================================================
                CLOSE
            ================================================== */}

            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
