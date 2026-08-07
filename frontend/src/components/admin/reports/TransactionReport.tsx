export interface TransactionRecord {
  id: number;
  date: string;
  player: string;
  type: "Deposit" | "Withdraw" | "Sale";
  amount: number;
  paymentMethod: string;
  transactionNumber: string;
}

interface TransactionReportProps {
  data: TransactionRecord[];
}

export default function TransactionReport({ data }: TransactionReportProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold mb-4">Transaction Report</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Date</th>

              <th className="p-3 text-left">Player</th>

              <th className="p-3 text-left">Type</th>

              <th className="p-3 text-right">Amount</th>

              <th className="p-3 text-left">Payment Method</th>

              <th className="p-3 text-left">Transaction No</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-5 text-center text-gray-500">
                  No transaction records found.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.date}</td>

                  <td className="p-3">{item.player}</td>

                  <td className="p-3">
                    <span
                      className={
                        item.type === "Deposit"
                          ? "text-green-600"
                          : item.type === "Withdraw"
                            ? "text-red-600"
                            : "text-blue-600"
                      }
                    >
                      {item.type}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    {item.amount.toLocaleString()} MMK
                  </td>

                  <td className="p-3">{item.paymentMethod}</td>

                  <td className="p-3">{item.transactionNumber}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
