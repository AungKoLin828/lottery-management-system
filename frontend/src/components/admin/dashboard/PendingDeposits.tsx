import { useState } from "react";

export default function PendingDeposits() {
  const deposits = [
    {
      player: "Mg Mg",
      amount: 5000,
      method: "KBZPay",
    },

    {
      player: "Kyaw Kyaw",
      amount: 10000,
      method: "WavePay",
    },

    {
      player: "Aung Aung",
      amount: 15000,
      method: "AYA Pay",
    },

    {
      player: "Su Su",
      amount: 20000,
      method: "KBZPay",
    },

    {
      player: "May May",
      amount: 8000,
      method: "WavePay",
    },

    {
      player: "Ko Ko",
      amount: 12000,
      method: "AYA Pay",
    },

    {
      player: "Hla Hla",
      amount: 25000,
      method: "KBZPay",
    },

    {
      player: "Zaw Zaw",
      amount: 30000,
      method: "WavePay",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const totalPages = Math.ceil(deposits.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentDeposits = deposits.slice(startIndex, startIndex + itemsPerPage);

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
        Pending Deposits
      </h2>

      {currentDeposits.map((item, index) => (
        <div
          key={index}
          className="
            border-b
            py-3
            flex
            justify-between
            "
        >
          <div>
            <p>{item.player}</p>

            <p
              className="
                text-sm
                text-gray-500
                "
            >
              {item.method}
            </p>
          </div>

          <b>{item.amount.toLocaleString()} MMK</b>
        </div>
      ))}

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
