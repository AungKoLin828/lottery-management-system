import { useState } from "react";

export default function PendingWithdraws() {
  const withdraws = [
    {
      player: "Aye Aye",
      amount: 30000,
    },

    {
      player: "Su Su",
      amount: 50000,
    },

    {
      player: "Mg Mg",
      amount: 20000,
    },

    {
      player: "Kyaw Kyaw",
      amount: 45000,
    },

    {
      player: "Aung Aung",
      amount: 60000,
    },

    {
      player: "May May",
      amount: 25000,
    },

    {
      player: "Hla Hla",
      amount: 70000,
    },

    {
      player: "Kyaw Kyaw",
      amount: 35000,
    },

    {
      player: "Su Su",
      amount: 50000,
    },

    {
      player: "Aye Aye",
      amount: 30000,
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  const totalPages = Math.ceil(withdraws.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentWithdraws = withdraws.slice(
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
        Pending Withdraws
      </h2>

      {currentWithdraws.map((item, index) => (
        <div
          key={index}
          className="
            flex
            justify-between
            border-b
            py-3
            "
        >
          <span>{item.player}</span>

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
