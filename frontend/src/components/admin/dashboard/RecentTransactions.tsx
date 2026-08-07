import { useState } from "react";

export default function RecentTransactions() {
  const transactions = [
    {
      player: "Mg Mg",
      type: "Deposit",
      amount: 5000,
    },

    {
      player: "Aung Aung",
      type: "Withdraw",
      amount: 20000,
    },

    {
      player: "Kyaw Kyaw",
      type: "Deposit",
      amount: 10000,
    },

    {
      player: "Su Su",
      type: "Withdraw",
      amount: 15000,
    },

    {
      player: "May May",
      type: "Deposit",
      amount: 8000,
    },

    {
      player: "Zaw Zaw",
      type: "Deposit",
      amount: 12000,
    },

    {
      player: "Hla Hla",
      type: "Withdraw",
      amount: 30000,
    },

    {
      player: "Ko Ko",
      type: "Deposit",
      amount: 25000,
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentTransactions = transactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div
      className="
      bg-white
      rounded-xl
      shadow
      p-5
      "
    >
      <h2
        className="
        font-bold
        text-lg
        mb-4
        "
      >
        Recent Transactions
      </h2>

      <table
        className="
        w-full
        "
      >
        <thead>
          <tr
            className="
            border-b
            text-left
            "
          >
            <th className="p-2">Player</th>

            <th>Type</th>

            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {currentTransactions.map((tx, index) => (
            <tr
              key={index}
              className="
                border-b
                "
            >
              <td className="p-2">{tx.player}</td>

              <td>
                <span
                  className={`
                    ${tx.type === "Deposit" ? "text-green-600" : "text-red-600"}
                    `}
                >
                  {tx.type}
                </span>
              </td>

              <td>{tx.amount.toLocaleString()} MMK</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}

      <div
        className="
        flex
        justify-between
        items-center
        mt-5
        "
      >
        <button
          className="
          px-3
          py-1
          border
          rounded
          disabled:opacity-50
          "
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>

        <span
          className="
          text-sm
          "
        >
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="
          px-3
          py-1
          border
          rounded
          disabled:opacity-50
          "
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
