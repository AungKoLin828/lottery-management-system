import { useMemo, useState } from "react";

import ReportSummary from "@/components/admin/reports/ReportSummary";
import ReportFilters from "@/components/admin/reports/ReportFilters";

import SalesReport, {
  type SalesRecord,
} from "@/components/admin/reports/SalesReport";

import DepositReport, {
  type DepositRecord,
} from "@/components/admin/reports/DepositReport";

import WithdrawReport, {
  type WithdrawRecord,
} from "@/components/admin/reports/WithdrawReport";

import TransactionReport, {
  type TransactionRecord,
} from "@/components/admin/reports/TransactionReport";

export default function Reports() {
  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  const [reportType, setReportType] = useState("All");

  const [paymentMethod, setPaymentMethod] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  /*
   * MOCK SALES DATA
   */

  const salesData: SalesRecord[] = [
    {
      id: 1,
      date: "2026-08-01",
      player: "Mg Mg",
      ticketNumber: "T001",
      amount: 5000,
    },
    {
      id: 2,
      date: "2026-08-02",
      player: "Aung Aung",
      ticketNumber: "T002",
      amount: 10000,
    },
    {
      id: 3,
      date: "2026-08-03",
      player: "Su Su",
      ticketNumber: "T003",
      amount: 15000,
    },
    {
      id: 4,
      date: "2026-08-04",
      player: "Kyaw Kyaw",
      ticketNumber: "T004",
      amount: 20000,
    },
    {
      id: 5,
      date: "2026-08-05",
      player: "Aye Aye",
      ticketNumber: "T005",
      amount: 8000,
    },
    {
      id: 6,
      date: "2026-08-06",
      player: "May May",
      ticketNumber: "T006",
      amount: 12000,
    },
  ];

  /*
   * MOCK DEPOSIT DATA
   */

  const depositData: DepositRecord[] = [
    {
      id: 1,
      date: "2026-08-01",
      player: "Mg Mg",
      amount: 5000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ001",
      status: "Approved",
    },
    {
      id: 2,
      date: "2026-08-02",
      player: "Aung Aung",
      amount: 10000,
      paymentMethod: "WavePay",
      transactionNumber: "WV001",
      status: "Approved",
    },
    {
      id: 3,
      date: "2026-08-03",
      player: "Su Su",
      amount: 15000,
      paymentMethod: "AYA Pay",
      transactionNumber: "AYA001",
      status: "Pending",
    },
    {
      id: 4,
      date: "2026-08-04",
      player: "Kyaw Kyaw",
      amount: 20000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ002",
      status: "Approved",
    },
    {
      id: 5,
      date: "2026-08-05",
      player: "Aye Aye",
      amount: 8000,
      paymentMethod: "WavePay",
      transactionNumber: "WV002",
      status: "Rejected",
    },
    {
      id: 6,
      date: "2026-08-06",
      player: "May May",
      amount: 12000,
      paymentMethod: "AYA Pay",
      transactionNumber: "AYA002",
      status: "Approved",
    },
  ];

  /*
   * MOCK WITHDRAW DATA
   */

  const withdrawData: WithdrawRecord[] = [
    {
      id: 1,
      date: "2026-08-01",
      player: "Aye Aye",
      amount: 30000,
      paymentMethod: "KBZPay",
      accountNumber: "09111111111",
      status: "Approved",
    },
    {
      id: 2,
      date: "2026-08-02",
      player: "Su Su",
      amount: 50000,
      paymentMethod: "WavePay",
      accountNumber: "09222222222",
      status: "Pending",
    },
    {
      id: 3,
      date: "2026-08-03",
      player: "Mg Mg",
      amount: 20000,
      paymentMethod: "AYA Pay",
      accountNumber: "09333333333",
      status: "Approved",
    },
    {
      id: 4,
      date: "2026-08-04",
      player: "Kyaw Kyaw",
      amount: 45000,
      paymentMethod: "KBZPay",
      accountNumber: "09444444444",
      status: "Approved",
    },
    {
      id: 5,
      date: "2026-08-05",
      player: "Aung Aung",
      amount: 60000,
      paymentMethod: "WavePay",
      accountNumber: "09555555555",
      status: "Rejected",
    },
    {
      id: 6,
      date: "2026-08-06",
      player: "May May",
      amount: 25000,
      paymentMethod: "AYA Pay",
      accountNumber: "09666666666",
      status: "Approved",
    },
  ];

  /*
   * MOCK TRANSACTION DATA
   */

  const transactionData: TransactionRecord[] = [
    {
      id: 1,
      date: "2026-08-01",
      player: "Mg Mg",
      type: "Deposit",
      amount: 5000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ001",
    },
    {
      id: 2,
      date: "2026-08-02",
      player: "Aung Aung",
      type: "Withdraw",
      amount: 20000,
      paymentMethod: "WavePay",
      transactionNumber: "WV001",
    },
    {
      id: 3,
      date: "2026-08-03",
      player: "Su Su",
      type: "Sale",
      amount: 15000,
      paymentMethod: "Cash",
      transactionNumber: "SALE001",
    },
    {
      id: 4,
      date: "2026-08-04",
      player: "Kyaw Kyaw",
      type: "Deposit",
      amount: 20000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ002",
    },
    {
      id: 5,
      date: "2026-08-05",
      player: "Aye Aye",
      type: "Withdraw",
      amount: 30000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ003",
    },
    {
      id: 6,
      date: "2026-08-06",
      player: "May May",
      type: "Sale",
      amount: 12000,
      paymentMethod: "Cash",
      transactionNumber: "SALE002",
    },
  ];

  /*
   * FILTER FUNCTION
   */

  const filterByDate = (date: string) => {
    if (fromDate && date < fromDate) {
      return false;
    }

    if (toDate && date > toDate) {
      return false;
    }

    return true;
  };

  /*
   * FILTER DATA
   */

  const filteredSales = useMemo(() => {
    if (reportType !== "All" && reportType !== "Sales") {
      return [];
    }

    return salesData.filter((item) => filterByDate(item.date));
  }, [fromDate, toDate, reportType]);

  const filteredDeposits = useMemo(() => {
    if (reportType !== "All" && reportType !== "Deposit") {
      return [];
    }

    return depositData.filter(
      (item) =>
        filterByDate(item.date) &&
        (paymentMethod === "All" || item.paymentMethod === paymentMethod),
    );
  }, [fromDate, toDate, reportType, paymentMethod]);

  const filteredWithdraws = useMemo(() => {
    if (reportType !== "All" && reportType !== "Withdraw") {
      return [];
    }

    return withdrawData.filter(
      (item) =>
        filterByDate(item.date) &&
        (paymentMethod === "All" || item.paymentMethod === paymentMethod),
    );
  }, [fromDate, toDate, reportType, paymentMethod]);

  const filteredTransactions = useMemo(() => {
    if (reportType !== "All" && reportType !== "Transaction") {
      return [];
    }

    return transactionData.filter(
      (item) =>
        filterByDate(item.date) &&
        (paymentMethod === "All" || item.paymentMethod === paymentMethod),
    );
  }, [fromDate, toDate, reportType, paymentMethod]);

  /*
   * SUMMARY
   */

  const totalSales = salesData
    .filter((item) => filterByDate(item.date))
    .reduce((total, item) => total + item.amount, 0);

  const totalDeposits = depositData
    .filter((item) => filterByDate(item.date) && item.status === "Approved")
    .reduce((total, item) => total + item.amount, 0);

  const totalWithdraws = withdrawData
    .filter((item) => filterByDate(item.date) && item.status === "Approved")
    .reduce((total, item) => total + item.amount, 0);

  const totalTickets = salesData.filter((item) =>
    filterByDate(item.date),
  ).length;

  const totalPlayers = new Set(
    salesData
      .filter((item) => filterByDate(item.date))
      .map((item) => item.player),
  ).size;

  const netRevenue = totalSales + totalDeposits - totalWithdraws;

  /*
   * PAGINATION
   */

  const getCurrentData = () => {
    if (reportType === "Sales") {
      return filteredSales;
    }

    if (reportType === "Deposit") {
      return filteredDeposits;
    }

    if (reportType === "Withdraw") {
      return filteredWithdraws;
    }

    if (reportType === "Transaction") {
      return filteredTransactions;
    }

    return filteredTransactions;
  };

  const currentData = getCurrentData();

  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedData = currentData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  /*
   * RESET
   */

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setReportType("All");
    setPaymentMethod("All");
    setCurrentPage(1);
  };

  /*
   * CSV EXPORT
   */

  const handleExport = () => {
    const rows = currentData.map((item: any) => Object.values(item));

    const headers =
      currentData.length > 0 ? Object.keys(currentData[0] as object) : [];

    if (headers.length === 0) {
      alert("No data available to export.");
      return;
    }

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `report-${new Date().toISOString().split("T")[0]}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /*
   * PRINT
   */

  const handlePrint = () => {
    window.print();
  };

  /*
   * PAGE CHANGE
   */

  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  };

  return (
    <div
      className="
        space-y-6
        print:space-y-4
      "
    >
      {/* Header */}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      {/* Summary */}

      <ReportSummary
        totalSales={totalSales}
        totalDeposits={totalDeposits}
        totalWithdraws={totalWithdraws}
        totalTickets={totalTickets}
        totalPlayers={totalPlayers}
        netRevenue={netRevenue}
      />

      {/* Filters */}

      <div className="print:hidden">
        <ReportFilters
          fromDate={fromDate}
          toDate={toDate}
          reportType={reportType}
          paymentMethod={paymentMethod}
          onFromDateChange={(value) => {
            setFromDate(value);
            setCurrentPage(1);
          }}
          onToDateChange={(value) => {
            setToDate(value);
            setCurrentPage(1);
          }}
          onReportTypeChange={(value) => {
            setReportType(value);
            setCurrentPage(1);
          }}
          onPaymentMethodChange={(value) => {
            setPaymentMethod(value);
            setCurrentPage(1);
          }}
          onReset={handleReset}
          onExport={handleExport}
          onPrint={handlePrint}
        />
      </div>

      {/* Reports */}

      {reportType === "Sales" && (
        <SalesReport data={paginatedData as SalesRecord[]} />
      )}

      {reportType === "Deposit" && (
        <DepositReport data={paginatedData as DepositRecord[]} />
      )}

      {reportType === "Withdraw" && (
        <WithdrawReport data={paginatedData as WithdrawRecord[]} />
      )}

      {reportType === "Transaction" && (
        <TransactionReport data={paginatedData as TransactionRecord[]} />
      )}

      {reportType === "All" && (
        <TransactionReport data={paginatedData as TransactionRecord[]} />
      )}

      {/* Pagination */}

      <div
        className="
          bg-white
          rounded-xl
          shadow
          p-4
          flex
          justify-between
          items-center
        "
      >
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          className="
            px-4
            py-2
            border
            rounded-lg
            disabled:opacity-50
          "
        >
          Previous
        </button>

        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => changePage(currentPage + 1)}
          className="
            px-4
            py-2
            border
            rounded-lg
            disabled:opacity-50
          "
        >
          Next
        </button>
      </div>
    </div>
  );
}
