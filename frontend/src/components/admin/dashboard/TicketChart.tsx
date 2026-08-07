export default function TicketChart() {
  const tickets = [
    {
      name: "00-09",
      count: 1200,
    },
    {
      name: "10-19",
      count: 900,
    },
    {
      name: "20-29",
      count: 1500,
    },
    {
      name: "30-39",
      count: 700,
    },
  ];

  return (
    <div
      className="
bg-white
rounded-xl
shadow
p-5
"
    >
      <h2 className="font-bold text-lg mb-4">Ticket Sales</h2>

      {tickets.map((ticket) => (
        <div
          key={ticket.name}
          className="
flex
justify-between
border-b
py-2
"
        >
          <span>{ticket.name}</span>

          <b>{ticket.count}</b>
        </div>
      ))}
    </div>
  );
}
