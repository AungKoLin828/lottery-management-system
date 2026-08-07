export interface SalesRecord {
  id: number;
  date: string;
  player: string;
  ticketNumber: string;
  amount: number;
}

interface SalesReportProps {
  data: SalesRecord[];
}

export default function SalesReport({ data }: SalesReportProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold mb-4">Sales Report</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Player</th>
              <th className="p-3 text-left">Ticket Number</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-5 text-center text-gray-500">
                  No sales records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.date}</td>

                  <td className="p-3">{item.player}</td>

                  <td className="p-3">{item.ticketNumber}</td>

                  <td className="p-3 text-right font-medium">
                    {item.amount.toLocaleString()} MMK
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
