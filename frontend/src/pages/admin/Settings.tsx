import { useState } from "react";

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

type SettingsTab =
  | "general"
  | "lottery"
  | "payment"
  | "deposit"
  | "withdraw"
  | "maintenance";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  //   const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

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

  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);

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
    setMaintenanceSettings((prev) => ({
      ...prev,
    }));

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

        <p className="text-gray-500 mt-1">
          Manage your lottery system settings.
        </p>
      </div>
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow p-4">
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
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">General Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="System Name"
              value={generalSettings.systemName}
              onChange={(e) =>
                handleGeneralChange("systemName", e.target.value)
              }
            />

            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>

              <select
                className="border rounded-lg p-2 w-full"
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
              <label className="block text-sm font-medium mb-1">
                Time Zone
              </label>

              <select
                className="border rounded-lg p-2 w-full"
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
              <label className="block text-sm font-medium mb-1">Language</label>

              <select
                className="border rounded-lg p-2 w-full"
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
            <label className="block text-sm font-medium mb-1">Address</label>

            <textarea
              className="border rounded-lg p-3 w-full"
              rows={3}
              value={generalSettings.address}
              onChange={(e) => handleGeneralChange("address", e.target.value)}
            />
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium mb-1">
              Announcement
            </label>

            <textarea
              className="border rounded-lg p-3 w-full"
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
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-5">
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
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
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
                  {paymentMethods
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((method) => (
                      <tr key={method.id} className="border-b">
                        <td className="p-3">{method.displayOrder}</td>

                        <td className="p-3 font-medium">{method.name}</td>

                        <td className="p-3">
                          <span className="px-2 py-1 rounded bg-gray-100">
                            {method.type}
                          </span>
                        </td>

                        <td className="p-3">{method.accountName}</td>

                        <td className="p-3">{method.accountNumber}</td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => togglePaymentMethod(method.id)}
                            className={`
                              px-3
                              py-1
                              rounded-full
                              text-sm
                              ${
                                method.enabled
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }
                            `}
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

            <div className="flex justify-end mt-6">
              <Button variant="success" onClick={savePaymentMethods}>
                Save Payment Methods
              </Button>
            </div>
          </div>

          {/* Add / Edit Payment Method */}

          <Modal
            open={showPaymentModal}
            title={
              editingPaymentId ? "Edit Payment Method" : "Add Payment Method"
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
                <label className="block text-sm font-medium mb-1">Type</label>

                <select
                  className="border rounded-lg p-2 w-full"
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
                <label className="block text-sm font-medium mb-1">
                  QR Code
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="
 border
 rounded-lg
 p-2
 w-full
 "
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
                    className="
 mt-3
 w-32
 h-32
 object-contain
 border
 rounded
 "
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 ">
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
    LOTTERY NUMBER CONTROL
    ====================================================== */}
      {activeTab === "lottery" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-6">Lottery Number Control</h2>

            {/* Lottery Number Settings */}
            <section className="border rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Lottery Number Settings
              </h3>

              <LotteryNumberSettings />
            </section>

            {/* Draw Settings */}
            <section className="border rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold mb-4">Draw Control</h3>

              <DrawSettings />
            </section>

            {/* Number Restrictions */}
            <section className="border rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-4">
                Number Restrictions
              </h3>

              <NumberRestrictions />
            </section>
          </div>
        </div>
      )}

      {/* ======================================================
          DEPOSIT SETTINGS
          ====================================================== */}
      {activeTab === "deposit" && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">Deposit Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <h3 className="font-semibold mb-3">Allowed Payment Methods</h3>

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
            <label className="block text-sm font-medium mb-1">
              Deposit Note
            </label>

            <textarea
              className="border rounded-lg p-3 w-full"
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

          <div className="flex justify-end mt-6">
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
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-6">Withdraw Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            <h3 className="font-semibold mb-3">Allowed Payment Methods</h3>

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

          <div className="flex justify-end mt-6">
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
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">Maintenance</h2>

              <p className="text-sm text-gray-500">
                Control system availability.
              </p>
            </div>

            <span
              className={`
                px-3
                py-1
                rounded-full
                text-sm
                ${
                  maintenanceSettings.maintenanceMode
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }
              `}
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
              <label className="block text-sm font-medium mb-1">
                Maintenance Message
              </label>

              <textarea
                className="border rounded-lg p-3 w-full"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Scheduled Start
                </label>

                <input
                  type="datetime-local"
                  className="border rounded-lg p-2 w-full"
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
                <label className="block text-sm font-medium mb-1">
                  Scheduled End
                </label>

                <input
                  type="datetime-local"
                  className="border rounded-lg p-2 w-full"
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

          <div className="flex justify-end mt-6">
            <Button variant="success" onClick={saveMaintenanceSettings}>
              Save Maintenance Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
