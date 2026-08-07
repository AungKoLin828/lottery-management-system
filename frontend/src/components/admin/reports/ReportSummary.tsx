interface ReportSummaryProps {
  totalSales: number;
  totalDeposits: number;
  totalWithdraws: number;
  totalTickets: number;
  totalPlayers: number;
  netRevenue: number;
}

export default function ReportSummary({
  totalSales,
  totalDeposits,
  totalWithdraws,
  totalTickets,
  totalPlayers,
  netRevenue,
}: ReportSummaryProps) {
  const cards = [
    {
      title: "Total Sales",
      value: totalSales,
      icon: "🎟️",
    },
    {
      title: "Total Deposits",
      value: totalDeposits,
      icon: "💰",
    },
    {
      title: "Total Withdraws",
      value: totalWithdraws,
      icon: "💸",
    },
    {
      title: "Net Revenue",
      value: netRevenue,
      icon: "📈",
    },
    {
      title: "Total Tickets",
      value: totalTickets,
      icon: "🎫",
    },
    {
      title: "Total Players",
      value: totalPlayers,
      icon: "👥",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="
            bg-white
            rounded-xl
            shadow
            p-5
            flex
            items-center
            justify-between
          "
        >
          <div>
            <p className="text-sm text-gray-500">{card.title}</p>

            <h2 className="text-xl font-bold mt-2">
              {card.value.toLocaleString()}{" "}
              {card.title === "Total Tickets" || card.title === "Total Players"
                ? ""
                : "MMK"}
            </h2>
          </div>

          <div className="text-3xl">{card.icon}</div>
        </div>
      ))}
    </div>
  );
}
