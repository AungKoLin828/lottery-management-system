export interface WithdrawRecord {
  id: number;
  date: string;
  player: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  status: string;
}

interface WithdrawReportProps {
  data: WithdrawRecord[];
}

export default function WithdrawReport({ data }: WithdrawReportProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold mb-4">Withdraw Report</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Date</th>

              <th className="p-3 text-left">Player</th>

              <th className="p-3 text-right">Amount</th>

              <th className="p-3 text-left">Payment Method</th>

              <th className="p-3 text-left">Account Number</th>

              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-5 text-center text-gray-500">
                  No withdraw records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.date}</td>

                  <td className="p-3">{item.player}</td>

                  <td className="p-3 text-right">
                    {item.amount.toLocaleString()} MMK
                  </td>

                  <td className="p-3">{item.paymentMethod}</td>

                  <td className="p-3">{item.accountNumber}</td>

                  <td className="p-3">
                    <span
                      className={
                        item.status === "Approved"
                          ? "text-green-600"
                          : item.status === "Pending"
                            ? "text-yellow-600"
                            : "text-red-600"
                      }
                    >
                      {item.status}
                    </span>
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
