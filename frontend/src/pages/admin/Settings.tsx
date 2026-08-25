import { useState } from "react";

import SettingsTabs from "@/components/admin/settings/SettingsTabs";
import GeneralSettingsTab from "@/components/admin/settings/GeneralSettingsTab";
import PaymentMethodsTab from "@/components/admin/settings/PaymentMethodsTab";
import LotterySettingsTab from "@/components/admin/settings/LotterySettingsTab";
import DepositSettingsTab from "@/components/admin/settings/DepositSettingsTab";
import WithdrawSettingsTab from "@/components/admin/settings/WithdrawSettingsTab";
import MaintenanceSettingsTab from "@/components/admin/settings/MaintenanceSettingsTab";

import type {
  GeneralSettings,
  PaymentMethod,
  DepositSettings,
  WithdrawSettings,
  MaintenanceSettings,
} from "@/types/settings";

/* ============================================================
   TYPES
============================================================ */

export type SettingsTab =
  | "general"
  | "lottery"
  | "payment"
  | "deposit"
  | "withdraw"
  | "maintenance";

/* ============================================================
   DEFAULT PAYMENT METHODS
============================================================ */

const defaultPaymentMethods: PaymentMethod[] = [
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
];

/* ============================================================
   DEFAULT GENERAL SETTINGS
============================================================ */

const defaultGeneralSettings: GeneralSettings = {
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
};

/* ============================================================
   DEFAULT DEPOSIT SETTINGS
============================================================ */

const defaultDepositSettings: DepositSettings = {
  minimumDeposit: 1000,
  maximumDeposit: 1000000,
  autoApproval: false,
  manualApproval: true,
  allowedPaymentMethods: [1, 2, 3],
  depositNote: "Please make sure your transaction number is correct.",
  dailyDepositLimit: 5000000,
  processingTime: "5-15 minutes",
};

/* ============================================================
   DEFAULT WITHDRAW SETTINGS
============================================================ */

const defaultWithdrawSettings: WithdrawSettings = {
  minimumWithdraw: 5000,
  maximumWithdraw: 500000,
  dailyWithdrawLimit: 1000000,
  approvalRequired: true,
  allowedPaymentMethods: [1, 4],
  withdrawFee: 0,
  processingTime: "10-30 minutes",
  autoWithdraw: false,
};

/* ============================================================
   DEFAULT MAINTENANCE SETTINGS
============================================================ */

const defaultMaintenanceSettings: MaintenanceSettings = {
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
};

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  /* ==========================================================
     GENERAL
  ========================================================== */

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(
    defaultGeneralSettings,
  );

  /* ==========================================================
     PAYMENT METHODS
     Shared with Deposit + Withdraw tabs
  ========================================================== */

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    defaultPaymentMethods,
  );

  /* ==========================================================
     DEPOSIT
  ========================================================== */

  const [depositSettings, setDepositSettings] = useState<DepositSettings>(
    defaultDepositSettings,
  );

  /* ==========================================================
     WITHDRAW
  ========================================================== */

  const [withdrawSettings, setWithdrawSettings] = useState<WithdrawSettings>(
    defaultWithdrawSettings,
  );

  /* ==========================================================
     MAINTENANCE
  ========================================================== */

  const [maintenanceSettings, setMaintenanceSettings] =
    useState<MaintenanceSettings>(defaultMaintenanceSettings);

  /* ==========================================================
     PAYMENT METHOD DELETE
  ========================================================== */

  const handleDeletePaymentMethod = (id: number) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id));

    /*
     * Also remove deleted payment method from
     * Deposit and Withdraw allowed lists.
     */

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

  /* ==========================================================
     RENDER
  ========================================================== */

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

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* ======================================================
          GENERAL TAB
      ====================================================== */}

      {activeTab === "general" && (
        <GeneralSettingsTab
          settings={generalSettings}
          setSettings={setGeneralSettings}
        />
      )}

      {/* ======================================================
          PAYMENT TAB
      ====================================================== */}

      {activeTab === "payment" && (
        <PaymentMethodsTab
          paymentMethods={paymentMethods}
          setPaymentMethods={setPaymentMethods}
          onDelete={handleDeletePaymentMethod}
        />
      )}

      {/* ======================================================
          LOTTERY TAB
      ====================================================== */}

      {activeTab === "lottery" && <LotterySettingsTab />}

      {/* ======================================================
          DEPOSIT TAB
      ====================================================== */}

      {activeTab === "deposit" && (
        <DepositSettingsTab
          settings={depositSettings}
          setSettings={setDepositSettings}
          paymentMethods={paymentMethods}
        />
      )}

      {/* ======================================================
          WITHDRAW TAB
      ====================================================== */}

      {activeTab === "withdraw" && (
        <WithdrawSettingsTab
          settings={withdrawSettings}
          setSettings={setWithdrawSettings}
          paymentMethods={paymentMethods}
        />
      )}

      {/* ======================================================
          MAINTENANCE TAB
      ====================================================== */}

      {activeTab === "maintenance" && (
        <MaintenanceSettingsTab
          settings={maintenanceSettings}
          setSettings={setMaintenanceSettings}
        />
      )}
    </div>
  );
}
