// src/pages/player/MyTickets.tsx

import { Ticket } from "lucide-react";

const tickets = [
  {
    id: "TKT-10001",
    type: "2D",
    date: "12 Aug 2026",
    amount: 5000,
    status: "Pending",
  },
  {
    id: "TKT-10002",
    type: "3D",
    date: "11 Aug 2026",
    amount: 10000,
    status: "Won",
  },
  {
    id: "TKT-10003",
    type: "2D",
    date: "10 Aug 2026",
    amount: 3000,
    status: "Lost",
  },
];

export default function MyTickets() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-emerald-400">Player</p>

        <h1 className="mt-1 text-3xl font-bold">My Tickets</h1>
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Ticket size={20} />
              </div>

              <div>
                <p className="font-semibold">{ticket.id}</p>

                <p className="mt-1 text-sm text-slate-500">
                  {ticket.type} · {ticket.date}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="font-semibold">
                {ticket.amount.toLocaleString()} MMK
              </p>

              <span className="text-sm text-slate-400">{ticket.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
