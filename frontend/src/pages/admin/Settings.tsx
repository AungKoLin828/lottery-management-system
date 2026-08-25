// src/pages/admin/Settings.tsx

import { useMemo, useState } from "react";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

import LotteryNumberSettings from "@/components/admin/settings/LotteryNumberSettings";
import DrawSettings from "@/components/admin/settings/DrawSettings";
import NumberRestrictions from "@/components/admin/settings/NumberRestrictions";

import type {
  GeneralSettings,
  PaymentMethod,
  PaymentMethodType,
  DepositSettings,
  WithdrawSettings,
  MaintenanceSettings,
} from "@/types/settings";

/* ============================================================
   TYPES
============================================================ */

type SettingsTab =
  | "general"
  | "lottery"
  | "payment"
  | "deposit"
  | "withdraw"
  | "maintenance";

type Holiday = {
  date: string;
  name: string;
};

/* ============================================================
   DEFAULT 2D PUBLIC HOLIDAYS
============================================================ */

const defaultTwoDOffDays: Record<string, string> = {
  /* January */
  "2026-01-01": "New Year's Day",
  "2026-01-02": "New Year Holiday",
  "2026-01-04": "Independence Day",

  /* February */
  "2026-02-12": "Union Day",
  "2026-02-13": "Union Day Holiday",
  "2026-02-16": "Chinese New Year",
  "2026-02-17": "Chinese New Year Holiday",

  /* March */
  "2026-03-27": "Armed Forces Day",

  /* May */
  "2026-05-01": "Labour Day",
  "2026-05-28": "Eid Al-Adha",

  /* July */
  "2026-07-19": "Martyrs' Day",

  /* December */
  "2026-12-04": "National Day",
  "2026-12-25": "Christmas Day",
};

/* ============================================================
   DEFAULT HOLIDAY LIST
============================================================ */

const defaultHolidays: Holiday[] = Object.entries(defaultTwoDOffDays)
  .map(([date, name]) => ({
    date,
    name,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  /* ============================================================
     PAYMENT MODAL
  ============================================================ */

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

  /* ============================================================
     HOLIDAY MODAL
  ============================================================ */

  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [editingHolidayDate, setEditingHolidayDate] = useState<string | null>(
    null,
  );

  const [holidayForm, setHolidayForm] = useState<Holiday>({
    date: "",
    name: "",
  });

  const [holidayYear, setHolidayYear] = useState("2026");

  const [holidaySearch, setHolidaySearch] = useState("");

  /*
   * ============================================================
   * GENERAL SETTINGS
   * ============================================================
   */

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: "2D Lottery System",

    currency: "MMK",

    timeZone: "Asia/Yangon",

    language: "English",

    logo: "",

    favicon: "",

    contactPhone: "09123456789",

    contactEmail: "admin@lottery.com",

    address: "Yangon, Myanmar",

    facebook: "https://facebook.com",

    telegram: "https://t.me/lottery",

    viber: "09123456789",

    announcement: "Welcome to our 2D Lottery System.",
  });

  /*
   * ============================================================
   * PAYMENT METHODS
   * ============================================================
   */

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,

      name: "KBZPay",

      type: "Both",

      enabled: true,

      qrCode: "",

      accountName: "Lottery Admin",

      accountNumber: "09123456789",

      bankName: "",

      branch: "",

      displayOrder: 1,
    },

    {
      id: 2,

      name: "WavePay",

      type: "Deposit",

      enabled: true,

      qrCode: "",

      accountName: "Lottery Admin",

      accountNumber: "09987654321",

      bankName: "",

      branch: "",

      displayOrder: 2,
    },

    {
      id: 3,

      name: "AYA Pay",

      type: "Both",

      enabled: false,

      qrCode: "",

      accountName: "Lottery Admin",

      accountNumber: "09777777777",

      bankName: "",

      branch: "",

      displayOrder: 3,
    },

    {
      id: 4,

      name: "Bank Transfer",

      type: "Withdraw",

      enabled: true,

      qrCode: "",

      accountName: "Lottery Company",

      accountNumber: "1234567890",

      bankName: "KBZ Bank",

      branch: "Yangon Main Branch",

      displayOrder: 4,
    },
  ]);

  const emptyPaymentMethod: PaymentMethod = {
    id: 0,

    name: "",

    type: "Both",

    enabled: true,

    qrCode: "",

    accountName: "",

    accountNumber: "",

    bankName: "",

    branch: "",

    displayOrder: 1,
  };

  const [paymentForm, setPaymentForm] =
    useState<PaymentMethod>(emptyPaymentMethod);

  /*
   * ============================================================
   * DEPOSIT SETTINGS
   * ============================================================
   */

  const [depositSettings, setDepositSettings] = useState<DepositSettings>({
    minimumDeposit: 1000,

    maximumDeposit: 1000000,

    autoApproval: false,

    manualApproval: true,

    allowedPaymentMethods: [1, 2, 3],

    depositNote: "Please make sure your transaction number is correct.",

    dailyDepositLimit: 5000000,

    processingTime: "5-15 minutes",
  });

  /*
   * ============================================================
   * WITHDRAW SETTINGS
   * ============================================================
   */

  const [withdrawSettings, setWithdrawSettings] = useState<WithdrawSettings>({
    minimumWithdraw: 5000,

    maximumWithdraw: 500000,

    dailyWithdrawLimit: 1000000,

    approvalRequired: true,

    allowedPaymentMethods: [1, 4],

    withdrawFee: 0,

    processingTime: "10-30 minutes",

    autoWithdraw: false,
  });

  /*
   * ============================================================
   * MAINTENANCE SETTINGS
   * ============================================================
   */

  const [maintenanceSettings, setMaintenanceSettings] =
    useState<MaintenanceSettings>({
      maintenanceMode: false,

      maintenanceMessage:
        "System is currently under maintenance. Please try again later.",

      allowAdminLogin: true,

      disablePlayerLogin: false,

      disableTicketPurchase: false,

      disableDeposit: false,

      disableWithdraw: false,

      scheduledStart: "",

      scheduledEnd: "",
    });

  /*
   * ============================================================
   * 2D PUBLIC HOLIDAYS
   * ============================================================
   */

  const [holidays, setHolidays] = useState<Holiday[]>(defaultHolidays);

  /*
   * ============================================================
   * GENERAL FUNCTIONS
   * ============================================================
   */

  const handleGeneralChange = (field: keyof GeneralSettings, value: string) => {
    setGeneralSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveGeneralSettings = () => {
    console.log("General Settings:", generalSettings);

    alert("General settings saved successfully.");
  };

  /*
   * ============================================================
   * PAYMENT METHODS FUNCTIONS
   * ============================================================
   */

  const openAddPaymentMethod = () => {
    setPaymentForm({
      id: Date.now(),

      name: "",

      type: "Both",

      enabled: true,

      qrCode: "",

      accountName: "",

      accountNumber: "",

      bankName: "",

      branch: "",

      displayOrder: paymentMethods.length + 1,
    });

    setEditingPaymentId(null);

    setShowPaymentModal(true);
  };

  const openEditPaymentMethod = (method: PaymentMethod) => {
    setPaymentForm({
      ...method,
    });

    setEditingPaymentId(method.id);

    setShowPaymentModal(true);
  };

  const savePaymentMethod = () => {
    if (!paymentForm.name.trim()) {
      alert("Payment method name is required.");
      return;
    }

    if (!paymentForm.accountName.trim()) {
      alert("Account name is required.");
      return;
    }

    if (!paymentForm.accountNumber.trim()) {
      alert("Account number is required.");
      return;
    }

    if (editingPaymentId !== null) {
      setPaymentMethods((prev) =>
        prev.map((method) =>
          method.id === editingPaymentId ? paymentForm : method,
        ),
      );

      alert("Payment method updated successfully.");
    } else {
      setPaymentMethods((prev) => [...prev, paymentForm]);

      alert("Payment method added successfully.");
    }

    setShowPaymentModal(false);

    setEditingPaymentId(null);
  };

  const deletePaymentMethod = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment method?",
    );

    if (!confirmed) {
      return;
    }

    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));

    setDepositSettings((prev) => ({
      ...prev,

      allowedPaymentMethods: prev.allowedPaymentMethods.filter(
        (methodId) => methodId !== id,
      ),
    }));

    setWithdrawSettings((prev) => ({
      ...prev,

      allowedPaymentMethods: prev.allowedPaymentMethods.filter(
        (methodId) => methodId !== id,
      ),
    }));
  };

  const togglePaymentMethod = (id: number) => {
    setPaymentMethods((prev) =>
      prev.map((method) =>
        method.id === id
          ? {
              ...method,
              enabled: !method.enabled,
            }
          : method,
      ),
    );
  };

  const savePaymentMethods = () => {
    console.log("Payment Methods:", paymentMethods);

    alert("Payment methods saved successfully.");
  };

  /*
   * ============================================================
   * HOLIDAY MANAGEMENT
   * ============================================================
   */

  const availableHolidayYears = useMemo(() => {
    const years = new Set<string>();

    holidays.forEach((holiday) => {
      if (holiday.date.length >= 4) {
        years.add(holiday.date.substring(0, 4));
      }
    });

    const currentYear = new Date().getFullYear().toString();

    years.add(currentYear);

    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [holidays]);

  /*
   * Automatically use the first available year when necessary.
   */

  const filteredHolidays = useMemo(() => {
    const search = holidaySearch.trim().toLowerCase();

    return [...holidays]
      .filter((holiday) => holiday.date.startsWith(`${holidayYear}-`))
      .filter((holiday) => {
        if (!search) {
          return true;
        }

        return holiday.name.toLowerCase().includes(search);
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, holidayYear, holidaySearch]);

  const openAddHoliday = () => {
    setHolidayForm({
      date: `${holidayYear}-01-01`,
      name: "",
    });

    setEditingHolidayDate(null);

    setShowHolidayModal(true);
  };

  const openEditHoliday = (holiday: Holiday) => {
    setHolidayForm({
      date: holiday.date,
      name: holiday.name,
    });

    setEditingHolidayDate(holiday.date);

    setShowHolidayModal(true);
  };

  const saveHoliday = () => {
    const date = holidayForm.date.trim();

    const name = holidayForm.name.trim();

    if (!date) {
      alert("Holiday date is required.");
      return;
    }

    if (!name) {
      alert("Holiday name is required.");
      return;
    }

    /*
     * Validate date format.
     */

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      alert("Please enter a valid holiday date.");
      return;
    }

    /*
     * Prevent duplicate dates.
     *
     * When editing, the current record is excluded from
     * the duplicate check.
     */

    const duplicate = holidays.some(
      (holiday) => holiday.date === date && holiday.date !== editingHolidayDate,
    );

    if (duplicate) {
      alert("A holiday already exists for this date.");
      return;
    }

    /*
     * Editing existing holiday.
     */

    if (editingHolidayDate !== null) {
      setHolidays((prev) =>
        prev.map((holiday) =>
          holiday.date === editingHolidayDate
            ? {
                date,
                name,
              }
            : holiday,
        ),
      );

      alert("Holiday updated successfully.");
    } else {
      /*
       * Adding new holiday.
       */

      setHolidays((prev) => [
        ...prev,
        {
          date,
          name,
        },
      ]);

      /*
       * Switch the year filter to the newly added holiday's year.
       */

      setHolidayYear(date.substring(0, 4));

      alert("Holiday added successfully.");
    }

    setShowHolidayModal(false);

    setEditingHolidayDate(null);

    setHolidayForm({
      date: "",
      name: "",
    });
  };

  const deleteHoliday = (holiday: Holiday) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${holiday.name}" on ${holiday.date}?`,
    );

    if (!confirmed) {
      return;
    }

    setHolidays((prev) => prev.filter((item) => item.date !== holiday.date));

    alert("Holiday deleted successfully.");
  };

  const saveHolidaySettings = () => {
    /*
     * Convert the admin-managed array back to the existing
     * Record<string, string> structure.
     *
     * This keeps compatibility with the existing twoDOffDays
     * format used by the 2D lottery system.
     */

    const twoDOffDays: Record<string, string> = {};

    holidays
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((holiday) => {
        twoDOffDays[holiday.date] = holiday.name;
      });

    console.log("2D Public Holidays:", twoDOffDays);

    alert("2D public holidays saved successfully.");
  };

  /*
   * ============================================================
   * DEPOSIT FUNCTIONS
   * ============================================================
   */

  const saveDepositSettings = () => {
    if (depositSettings.minimumDeposit > depositSettings.maximumDeposit) {
      alert("Minimum deposit cannot exceed maximum deposit.");

      return;
    }

    console.log("Deposit Settings:", depositSettings);

    alert("Deposit settings saved successfully.");
  };

  const toggleDepositPaymentMethod = (id: number) => {
    setDepositSettings((prev) => {
      const exists = prev.allowedPaymentMethods.includes(id);

      return {
        ...prev,

        allowedPaymentMethods: exists
          ? prev.allowedPaymentMethods.filter((methodId) => methodId !== id)
          : [...prev.allowedPaymentMethods, id],
      };
    });
  };

  /*
   * ============================================================
   * WITHDRAW FUNCTIONS
   * ============================================================
   */

  const saveWithdrawSettings = () => {
    if (withdrawSettings.minimumWithdraw > withdrawSettings.maximumWithdraw) {
      alert("Minimum withdraw cannot exceed maximum withdraw.");

      return;
    }

    console.log("Withdraw Settings:", withdrawSettings);

    alert("Withdraw settings saved successfully.");
  };

  const toggleWithdrawPaymentMethod = (id: number) => {
    setWithdrawSettings((prev) => {
      const exists = prev.allowedPaymentMethods.includes(id);

      return {
        ...prev,

        allowedPaymentMethods: exists
          ? prev.allowedPaymentMethods.filter((methodId) => methodId !== id)
          : [...prev.allowedPaymentMethods, id],
      };
    });
  };

  /*
   * ============================================================
   * MAINTENANCE FUNCTIONS
   * ============================================================
   */

  const saveMaintenanceSettings = () => {
    console.log("Maintenance Settings:", maintenanceSettings);

    alert("Maintenance settings saved successfully.");
  };

  /*
   * ============================================================
   * TAB BUTTON
   * ============================================================
   */

  const tabClass = (tab: SettingsTab) => {
    return `
      px-4
      py-2
      rounded-lg
      font-medium
      transition
      ${
        activeTab === tab
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }
    `;
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

        <p className="mt-1 text-gray-500">
          Manage your lottery system settings.
        </p>
      </div>

      {/* ======================================================
          TABS
      ====================================================== */}

      <div className="rounded-xl bg-white p-4 shadow">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={tabClass("general")}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>

          <button
            type="button"
            className={tabClass("payment")}
            onClick={() => setActiveTab("payment")}
          >
            Payment Methods
          </button>

          <button
            type="button"
            className={tabClass("lottery")}
            onClick={() => setActiveTab("lottery")}
          >
            Lottery Number Control
          </button>

          <button
            type="button"
            className={tabClass("deposit")}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit Settings
          </button>

          <button
            type="button"
            className={tabClass("withdraw")}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw Settings
          </button>

          <button
            type="button"
            className={tabClass("maintenance")}
            onClick={() => setActiveTab("maintenance")}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* ======================================================
          GENERAL
      ====================================================== */}

      {activeTab === "general" && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold">General Settings</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="System Name"
              value={generalSettings.systemName}
              onChange={(e) =>
                handleGeneralChange("systemName", e.target.value)
              }
            />

            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>

              <select
                className="w-full rounded-lg border p-2"
                value={generalSettings.currency}
                onChange={(e) =>
                  handleGeneralChange("currency", e.target.value)
                }
              >
                <option value="MMK">MMK</option>
                <option value="THB">THB</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Time Zone
              </label>

              <select
                className="w-full rounded-lg border p-2"
                value={generalSettings.timeZone}
                onChange={(e) =>
                  handleGeneralChange("timeZone", e.target.value)
                }
              >
                <option value="Asia/Yangon">Asia/Yangon</option>
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>

              <select
                className="w-full rounded-lg border p-2"
                value={generalSettings.language}
                onChange={(e) =>
                  handleGeneralChange("language", e.target.value)
                }
              >
                <option value="English">English</option>
                <option value="Myanmar">Myanmar</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>

            <Input
              label="Contact Phone"
              value={generalSettings.contactPhone}
              onChange={(e) =>
                handleGeneralChange("contactPhone", e.target.value)
              }
            />

            <Input
              label="Contact Email"
              type="email"
              value={generalSettings.contactEmail}
              onChange={(e) =>
                handleGeneralChange("contactEmail", e.target.value)
              }
            />

            <Input
              label="Facebook"
              value={generalSettings.facebook}
              onChange={(e) => handleGeneralChange("facebook", e.target.value)}
            />

            <Input
              label="Telegram"
              value={generalSettings.telegram}
              onChange={(e) => handleGeneralChange("telegram", e.target.value)}
            />

            <Input
              label="Viber"
              value={generalSettings.viber}
              onChange={(e) => handleGeneralChange("viber", e.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium">Address</label>

            <textarea
              className="w-full rounded-lg border p-3"
              rows={3}
              value={generalSettings.address}
              onChange={(e) => handleGeneralChange("address", e.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-1 block text-sm font-medium">
              Announcement
            </label>

            <textarea
              className="w-full rounded-lg border p-3"
              rows={4}
              value={generalSettings.announcement}
              onChange={(e) =>
                handleGeneralChange("announcement", e.target.value)
              }
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="success" onClick={saveGeneralSettings}>
              Save General Settings
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================
          PAYMENT METHODS
      ====================================================== */}

      {activeTab === "payment" && (
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Payment Methods</h2>

                <p className="text-sm text-gray-500">
                  Manage deposit and withdraw payment methods.
                </p>
              </div>

              <Button variant="success" onClick={openAddPaymentMethod}>
                + Add Payment Method
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-3 text-left">#</th>

                    <th className="p-3 text-left">Name</th>

                    <th className="p-3 text-left">Type</th>

                    <th className="p-3 text-left">Account</th>

                    <th className="p-3 text-left">Account Number</th>

                    <th className="p-3 text-left">Status</th>

                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {[...paymentMethods]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((method) => (
                      <tr key={method.id} className="border-b">
                        <td className="p-3">{method.displayOrder}</td>

                        <td className="p-3 font-medium">{method.name}</td>

                        <td className="p-3">
                          <span className="rounded bg-gray-100 px-2 py-1">
                            {method.type}
                          </span>
                        </td>

                        <td className="p-3">{method.accountName}</td>

                        <td className="p-3">{method.accountNumber}</td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => togglePaymentMethod(method.id)}
                            className={`rounded-full px-3 py-1 text-sm ${
                              method.enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {method.enabled ? "Enabled" : "Disabled"}
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => openEditPaymentMethod(method)}
                            >
                              Edit
                            </Button>

                            <Button
                              variant="danger"
                              onClick={() => deletePaymentMethod(method.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="success" onClick={savePaymentMethods}>
                Save Payment Methods
              </Button>
            </div>
          </div>

          {/* PAYMENT MODAL */}

          <Modal
            open={showPaymentModal}
            title={
              editingPaymentId !== null
                ? "Edit Payment Method"
                : "Add Payment Method"
            }
            onClose={() => setShowPaymentModal(false)}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();

                savePaymentMethod();
              }}
              className="space-y-4"
            >
              <Input
                label="Payment Method Name"
                value={paymentForm.name}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="KBZPay"
              />

              <div>
                <label className="mb-1 block text-sm font-medium">Type</label>

                <select
                  className="w-full rounded-lg border p-2"
                  value={paymentForm.type}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      type: e.target.value as PaymentMethodType,
                    }))
                  }
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Withdraw">Withdraw</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <Input
                label="Account Name"
                value={paymentForm.accountName}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    accountName: e.target.value,
                  }))
                }
              />

              <Input
                label="Account Number"
                value={paymentForm.accountNumber}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
              />

              <Input
                label="Bank Name"
                value={paymentForm.bankName}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    bankName: e.target.value,
                  }))
                }
              />

              <Input
                label="Branch"
                value={paymentForm.branch}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    branch: e.target.value,
                  }))
                }
              />

              <Input
                label="Display Order"
                type="number"
                value={String(paymentForm.displayOrder)}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    displayOrder: Number(e.target.value),
                  }))
                }
              />

              <div>
                <label className="mb-1 block text-sm font-medium">
                  QR Code
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-lg border p-2"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      const url = URL.createObjectURL(file);

                      setPaymentForm((prev) => ({
                        ...prev,
                        qrCode: url,
                      }));
                    }
                  }}
                />

                {paymentForm.qrCode && (
                  <img
                    src={paymentForm.qrCode}
                    alt={`${paymentForm.name} QR Code`}
                    className="mt-3 h-32 w-32 rounded border object-contain"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="success">
                  Save
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ======================================================
          LOTTERY NUMBER CONTROL + HOLIDAY MANAGEMENT
      ====================================================== */}

      {activeTab === "lottery" && (
        <div className="space-y-6">
          {/* LOTTERY NUMBER CONTROL */}

          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-6 text-xl font-bold">Lottery Number Control</h2>

            {/* Lottery Number Settings */}

            <section className="mb-6 rounded-lg border p-5">
              <h3 className="mb-4 text-lg font-semibold">
                Lottery Number Settings
              </h3>

              <LotteryNumberSettings />
            </section>

            {/* Draw Settings */}

            <section className="mb-6 rounded-lg border p-5">
              <h3 className="mb-4 text-lg font-semibold">Draw Control</h3>

              <DrawSettings />
            </section>

            {/* Number Restrictions */}

            <section className="rounded-lg border p-5">
              <h3 className="mb-4 text-lg font-semibold">
                Number Restrictions
              </h3>

              <NumberRestrictions />
            </section>
          </div>

          {/* ==================================================
              2D PUBLIC HOLIDAY MANAGEMENT
          ================================================== */}

          <div className="rounded-xl bg-white p-6 shadow">
            {/* Header */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  2D Public Holiday Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Manage public holidays and off days when 2D draws should not
                  be available.
                </p>
              </div>

              <Button variant="success" onClick={openAddHoliday}>
                + Add Holiday
              </Button>
            </div>

            {/* Information */}

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex gap-3">
                <div className="mt-0.5 text-blue-600">ⓘ</div>

                <div>
                  <p className="font-medium text-blue-800">2D Draw Off Days</p>

                  <p className="mt-1 text-sm text-blue-700">
                    Dates configured here can be used by the 2D draw schedule to
                    prevent AM and PM draws on public holidays.
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_auto]">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Year
                </label>

                <select
                  className="w-full rounded-lg border p-2.5"
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(e.target.value)}
                >
                  {availableHolidayYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Search Holiday
                </label>

                <input
                  type="text"
                  value={holidaySearch}
                  onChange={(e) => setHolidaySearch(e.target.value)}
                  placeholder="Search holiday name..."
                  className="w-full rounded-lg border p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <div className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700">
                  {filteredHolidays.length} Holiday
                  {filteredHolidays.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            {/* Holiday Table */}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 font-semibold text-gray-700">#</th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Date
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Day
                    </th>

                    <th className="px-4 py-3 font-semibold text-gray-700">
                      Holiday
                    </th>

                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredHolidays.map((holiday, index) => {
                    const date = new Date(`${holiday.date}T00:00:00`);

                    const dayName = date.toLocaleDateString("en-US", {
                      weekday: "long",
                    });

                    return (
                      <tr
                        key={holiday.date}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 text-gray-500">{index + 1}</td>

                        <td className="px-4 py-4">
                          <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-sm text-gray-700">
                            {holiday.date}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-gray-600">{dayName}</td>

                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {holiday.name}
                          </div>

                          <div className="mt-1 text-xs text-red-600">
                            2D AM / PM Draw Off
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => openEditHoliday(holiday)}
                            >
                              Edit
                            </Button>

                            <Button
                              variant="danger"
                              onClick={() => deleteHoliday(holiday)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredHolidays.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        <div className="text-base font-medium">
                          No holidays found
                        </div>

                        <p className="mt-1 text-sm">
                          Add a new public holiday or change the selected
                          year/search.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Save */}

            <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Total configured holidays:{" "}
                <span className="font-semibold text-gray-700">
                  {holidays.length}
                </span>
              </p>

              <Button variant="success" onClick={saveHolidaySettings}>
                Save Public Holidays
              </Button>
            </div>
          </div>

          {/* ==================================================
              HOLIDAY ADD / EDIT MODAL
          ================================================== */}

          <Modal
            open={showHolidayModal}
            title={
              editingHolidayDate !== null
                ? "Edit Public Holiday"
                : "Add Public Holiday"
            }
            onClose={() => {
              setShowHolidayModal(false);
              setEditingHolidayDate(null);
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();

                saveHoliday();
              }}
              className="space-y-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Holiday Date
                </label>

                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) =>
                    setHolidayForm((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <Input
                label="Holiday Name"
                value={holidayForm.name}
                onChange={(e) =>
                  setHolidayForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="e.g. New Year's Day"
                required
              />

              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                <strong>Important:</strong> This date will be treated as a 2D
                draw off day. Both AM and PM sessions can be blocked for this
                date.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowHolidayModal(false);
                    setEditingHolidayDate(null);
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="success">
                  {editingHolidayDate !== null
                    ? "Update Holiday"
                    : "Add Holiday"}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ======================================================
          DEPOSIT SETTINGS
      ====================================================== */}

      {activeTab === "deposit" && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold">Deposit Settings</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Minimum Deposit"
              type="number"
              value={String(depositSettings.minimumDeposit)}
              onChange={(e) =>
                setDepositSettings((prev) => ({
                  ...prev,
                  minimumDeposit: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Maximum Deposit"
              type="number"
              value={String(depositSettings.maximumDeposit)}
              onChange={(e) =>
                setDepositSettings((prev) => ({
                  ...prev,
                  maximumDeposit: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Daily Deposit Limit"
              type="number"
              value={String(depositSettings.dailyDepositLimit)}
              onChange={(e) =>
                setDepositSettings((prev) => ({
                  ...prev,
                  dailyDepositLimit: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Processing Time"
              value={depositSettings.processingTime}
              onChange={(e) =>
                setDepositSettings((prev) => ({
                  ...prev,
                  processingTime: e.target.value,
                }))
              }
              placeholder="5-15 minutes"
            />
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={depositSettings.autoApproval}
                onChange={(e) =>
                  setDepositSettings((prev) => ({
                    ...prev,
                    autoApproval: e.target.checked,
                    manualApproval: !e.target.checked,
                  }))
                }
              />

              <span>Auto Approval</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={depositSettings.manualApproval}
                onChange={(e) =>
                  setDepositSettings((prev) => ({
                    ...prev,
                    manualApproval: e.target.checked,
                    autoApproval: !e.target.checked,
                  }))
                }
              />

              <span>Manual Approval</span>
            </label>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-semibold">Allowed Payment Methods</h3>

            <div className="space-y-2">
              {paymentMethods
                .filter(
                  (method) =>
                    method.enabled &&
                    (method.type === "Deposit" || method.type === "Both"),
                )
                .map((method) => (
                  <label key={method.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={depositSettings.allowedPaymentMethods.includes(
                        method.id,
                      )}
                      onChange={() => toggleDepositPaymentMethod(method.id)}
                    />

                    <span>{method.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1 block text-sm font-medium">
              Deposit Note
            </label>

            <textarea
              className="w-full rounded-lg border p-3"
              rows={4}
              value={depositSettings.depositNote}
              onChange={(e) =>
                setDepositSettings((prev) => ({
                  ...prev,
                  depositNote: e.target.value,
                }))
              }
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="success" onClick={saveDepositSettings}>
              Save Deposit Settings
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================
          WITHDRAW SETTINGS
      ====================================================== */}

      {activeTab === "withdraw" && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-bold">Withdraw Settings</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Minimum Withdraw"
              type="number"
              value={String(withdrawSettings.minimumWithdraw)}
              onChange={(e) =>
                setWithdrawSettings((prev) => ({
                  ...prev,
                  minimumWithdraw: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Maximum Withdraw"
              type="number"
              value={String(withdrawSettings.maximumWithdraw)}
              onChange={(e) =>
                setWithdrawSettings((prev) => ({
                  ...prev,
                  maximumWithdraw: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Daily Withdraw Limit"
              type="number"
              value={String(withdrawSettings.dailyWithdrawLimit)}
              onChange={(e) =>
                setWithdrawSettings((prev) => ({
                  ...prev,
                  dailyWithdrawLimit: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Withdraw Fee"
              type="number"
              value={String(withdrawSettings.withdrawFee)}
              onChange={(e) =>
                setWithdrawSettings((prev) => ({
                  ...prev,
                  withdrawFee: Number(e.target.value),
                }))
              }
            />

            <Input
              label="Processing Time"
              value={withdrawSettings.processingTime}
              onChange={(e) =>
                setWithdrawSettings((prev) => ({
                  ...prev,
                  processingTime: e.target.value,
                }))
              }
              placeholder="10-30 minutes"
            />
          </div>

          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={withdrawSettings.approvalRequired}
                onChange={(e) =>
                  setWithdrawSettings((prev) => ({
                    ...prev,
                    approvalRequired: e.target.checked,
                  }))
                }
              />

              <span>Approval Required</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={withdrawSettings.autoWithdraw}
                onChange={(e) =>
                  setWithdrawSettings((prev) => ({
                    ...prev,
                    autoWithdraw: e.target.checked,
                  }))
                }
              />

              <span>Auto Withdraw</span>
            </label>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-semibold">Allowed Payment Methods</h3>

            <div className="space-y-2">
              {paymentMethods
                .filter(
                  (method) =>
                    method.enabled &&
                    (method.type === "Withdraw" || method.type === "Both"),
                )
                .map((method) => (
                  <label key={method.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={withdrawSettings.allowedPaymentMethods.includes(
                        method.id,
                      )}
                      onChange={() => toggleWithdrawPaymentMethod(method.id)}
                    />

                    <span>{method.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="success" onClick={saveWithdrawSettings}>
              Save Withdraw Settings
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================
          MAINTENANCE
      ====================================================== */}

      {activeTab === "maintenance" && (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Maintenance</h2>

              <p className="text-sm text-gray-500">
                Control system availability.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm ${
                maintenanceSettings.maintenanceMode
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {maintenanceSettings.maintenanceMode
                ? "Maintenance ON"
                : "System Active"}
            </span>
          </div>

          <div className="space-y-5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.maintenanceMode}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    maintenanceMode: e.target.checked,
                  }))
                }
              />

              <span className="font-medium">Maintenance Mode</span>
            </label>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Maintenance Message
              </label>

              <textarea
                className="w-full rounded-lg border p-3"
                rows={4}
                value={maintenanceSettings.maintenanceMessage}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    maintenanceMessage: e.target.value,
                  }))
                }
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.allowAdminLogin}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    allowAdminLogin: e.target.checked,
                  }))
                }
              />

              <span>Allow Admin Login</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.disablePlayerLogin}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    disablePlayerLogin: e.target.checked,
                  }))
                }
              />

              <span>Disable Player Login</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.disableTicketPurchase}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    disableTicketPurchase: e.target.checked,
                  }))
                }
              />

              <span>Disable Ticket Purchase</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.disableDeposit}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    disableDeposit: e.target.checked,
                  }))
                }
              />

              <span>Disable Deposit</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={maintenanceSettings.disableWithdraw}
                onChange={(e) =>
                  setMaintenanceSettings((prev) => ({
                    ...prev,
                    disableWithdraw: e.target.checked,
                  }))
                }
              />

              <span>Disable Withdraw</span>
            </label>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Scheduled Start
                </label>

                <input
                  type="datetime-local"
                  className="w-full rounded-lg border p-2"
                  value={maintenanceSettings.scheduledStart}
                  onChange={(e) =>
                    setMaintenanceSettings((prev) => ({
                      ...prev,
                      scheduledStart: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Scheduled End
                </label>

                <input
                  type="datetime-local"
                  className="w-full rounded-lg border p-2"
                  value={maintenanceSettings.scheduledEnd}
                  onChange={(e) =>
                    setMaintenanceSettings((prev) => ({
                      ...prev,
                      scheduledEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="success" onClick={saveMaintenanceSettings}>
              Save Maintenance Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
