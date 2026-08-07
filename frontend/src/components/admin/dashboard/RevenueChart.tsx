export default function RevenueChart() {
  const data = [
    {
      month: "Jan",
      amount: 500000,
    },
    {
      month: "Feb",
      amount: 800000,
    },
    {
      month: "Mar",
      amount: 1200000,
    },
    {
      month: "Apr",
      amount: 900000,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-bold text-lg mb-4">Revenue Overview</h2>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.month}>
            <div className="flex justify-between">
              <span>{item.month}</span>

              <span>{item.amount.toLocaleString()} MMK</span>
            </div>

            <div className="bg-gray-200 h-3 rounded">
              <div
                className="bg-blue-500 h-3 rounded"
                style={{
                  width: `${item.amount / 15000}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
