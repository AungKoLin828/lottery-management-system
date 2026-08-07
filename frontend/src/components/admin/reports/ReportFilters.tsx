import Select from "@/components/common/Select";

interface ReportFiltersProps {
  fromDate: string;
  toDate: string;
  reportType: string;
  paymentMethod: string;

  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onReportTypeChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;

  onReset: () => void;
  onExport: () => void;
  onPrint: () => void;
}

export default function ReportFilters({
  fromDate,
  toDate,
  reportType,
  paymentMethod,
  onFromDateChange,
  onToDateChange,
  onReportTypeChange,
  onPaymentMethodChange,
  onReset,
  onExport,
  onPrint,
}: ReportFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="text-lg font-bold mb-4">Report Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              px-3
              py-2
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>

          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="
              w-full
              rounded-lg
              border
              border-gray-300
              px-3
              py-2
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
            "
          />
        </div>

        {/* Report Type */}
        <Select
          label="Report Type"
          value={reportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
          options={[
            {
              label: "All Reports",
              value: "All",
            },
            {
              label: "Sales",
              value: "Sales",
            },
            {
              label: "Deposit",
              value: "Deposit",
            },
            {
              label: "Withdraw",
              value: "Withdraw",
            },
            {
              label: "Transaction",
              value: "Transaction",
            },
          ]}
        />

        {/* Payment Method */}
        <Select
          label="Payment Method"
          value={paymentMethod}
          onChange={(e) => onPaymentMethodChange(e.target.value)}
          options={[
            {
              label: "All Methods",
              value: "All",
            },
            {
              label: "KBZPay",
              value: "KBZPay",
            },
            {
              label: "WavePay",
              value: "WavePay",
            },
            {
              label: "AYA Pay",
              value: "AYA Pay",
            },
            {
              label: "Bank Transfer",
              value: "Bank Transfer",
            },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-end gap-3 mt-5">
        <button
          type="button"
          onClick={onReset}
          className="
            px-4
            py-2
            border
            rounded-lg
            hover:bg-gray-50
          "
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onPrint}
          className="
            px-4
            py-2
            border
            rounded-lg
            hover:bg-gray-50
          "
        >
          🖨 Print
        </button>

        <button
          type="button"
          onClick={onExport}
          className="
            px-4
            py-2
            rounded-lg
            bg-green-600
            text-white
            hover:bg-green-700
          "
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
