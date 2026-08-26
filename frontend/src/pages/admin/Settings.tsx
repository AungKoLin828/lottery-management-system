import { useCallback, useEffect, useState } from "react";

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

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

interface PaymentMethodsResponse {
  paymentMethods?: PaymentMethod[];
}

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

  /*
   * Payment method IDs are loaded from the database.
   *
   * Do not use old numeric IDs such as [1, 2, 3]
   * because the payment_methods table uses UUID IDs.
   */
  allowedPaymentMethods: [],

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

  /*
   * Payment method IDs are loaded from the database.
   */
  allowedPaymentMethods: [],

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
   API HELPER
============================================================ */

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";

  /*
   * ----------------------------------------------------------
   * JSON RESPONSE
   * ----------------------------------------------------------
   */

  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error("The server returned invalid JSON.");
    }
  }

  /*
   * ----------------------------------------------------------
   * NON-JSON RESPONSE
   *
   * This normally means:
   *
   * 404 -> redirect/function problem
   * 401 -> authentication problem
   * 403 -> authorization problem
   * 500 -> Netlify function/server problem
   * ----------------------------------------------------------
   */

  const text = await response.text();

  console.error("Payment methods API returned non-JSON:", text.slice(0, 1000));

  if (response.status === 401) {
    throw new Error("Your session has expired. Please log in again.");
  }

  if (response.status === 403) {
    throw new Error("You do not have permission to manage payment methods.");
  }

  if (response.status === 404) {
    throw new Error(
      "Payment methods API was not found. Please check the Netlify function and redirect configuration.",
    );
  }

  if (response.status >= 500) {
    throw new Error(
      "Payment methods server error. Please check the Netlify function and database connection.",
    );
  }

  throw new Error(
    `API returned ${response.status} ${response.statusText} instead of JSON.`,
  );
}

/* ============================================================
   NORMALIZE PAYMENT METHOD
============================================================ */

const normalizePaymentMethod = (method: PaymentMethod): PaymentMethod => {
  return {
    ...method,

    /*
     * Database payment_method.id is UUID.
     *
     * Always keep it as string.
     */
    id: method.id,

    name: method.name ?? "",

    type: method.type ?? "Both",

    enabled: method.enabled !== false,

    accountName: method.accountName ?? "",

    accountNumber: method.accountNumber ?? "",

    bankName: method.bankName ?? "",

    branch: method.branch ?? "",

    displayOrder: Number(method.displayOrder) || 1,
  };
};

/* ============================================================
   SETTINGS PAGE
============================================================ */

export default function Settings() {
  /* ==========================================================
     ACTIVE TAB
  ========================================================== */

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  /* ==========================================================
     GENERAL
  ========================================================== */

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(
    defaultGeneralSettings,
  );

  /* ==========================================================
     PAYMENT METHODS
     
     IMPORTANT:
     These are loaded from the real database.
  ========================================================== */

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

  const [paymentMethodsError, setPaymentMethodsError] = useState("");

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
     LOAD PAYMENT METHODS FROM DATABASE
  ========================================================== */

  const loadPaymentMethods = useCallback(async () => {
    setPaymentMethodsLoading(true);

    setPaymentMethodsError("");

    try {
      const response = await fetch("/api/admin/payment-methods", {
        method: "GET",

        credentials: "include",

        headers: {
          Accept: "application/json",
        },
      });

      const result = await parseApiResponse<PaymentMethodsResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load payment methods.");
      }

      const methods = result.data?.paymentMethods;

      if (!Array.isArray(methods)) {
        setPaymentMethods([]);

        return;
      }

      /*
       * Normalize UUID IDs to strings.
       */

      const normalizedMethods = methods.map(normalizePaymentMethod);

      /*
       * Sort by display order.
       */

      normalizedMethods.sort((a, b) => a.displayOrder - b.displayOrder);

      setPaymentMethods(normalizedMethods);
    } catch (loadError) {
      console.error("Load payment methods error:", loadError);

      setPaymentMethodsError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load payment methods.",
      );

      /*
       * Do not use fake/default payment methods.
       */
      setPaymentMethods([]);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, []);

  /* ==========================================================
     LOAD PAYMENT METHODS ON SETTINGS PAGE LOAD
     
     This is important because Deposit and Withdraw tabs
     also use the same paymentMethods state.
  ========================================================== */

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  /* ==========================================================
     PAYMENT METHOD DELETE
  ========================================================== */

  const handleDeletePaymentMethod = (id: string) => {
    /*
     * --------------------------------------------------------
     * Remove from shared payment-method state
     * --------------------------------------------------------
     */

    setPaymentMethods((previous) =>
      previous.filter((method) => String(method.id) !== String(id)),
    );

    /*
     * --------------------------------------------------------
     * Remove deleted UUID from Deposit settings
     *
     * String comparison is intentional because existing
     * DepositSettings types may currently use number|string.
     * --------------------------------------------------------
     */

    setDepositSettings((previous) => ({
      ...previous,

      allowedPaymentMethods: previous.allowedPaymentMethods.filter(
        (methodId) => String(methodId) !== String(id),
      ),
    }));

    /*
     * --------------------------------------------------------
     * Remove deleted UUID from Withdraw settings
     * --------------------------------------------------------
     */

    setWithdrawSettings((previous) => ({
      ...previous,

      allowedPaymentMethods: previous.allowedPaymentMethods.filter(
        (methodId) => String(methodId) !== String(id),
      ),
    }));
  };

  /* ==========================================================
     PAYMENT METHODS UPDATED
     
     This helper is useful if another child component changes
     the shared payment method list.
  ========================================================== */

  const handlePaymentMethodsChange = (methods: PaymentMethod[]) => {
    const normalizedMethods = methods.map(normalizePaymentMethod);

    normalizedMethods.sort((a, b) => a.displayOrder - b.displayOrder);

    setPaymentMethods(normalizedMethods);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

        <p className="mt-1 text-gray-500">
          Manage your lottery system settings.
        </p>
      </div>

      {/* ======================================================
          PAYMENT METHODS API ERROR
      ======================================================= */}

      {paymentMethodsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="font-semibold">Payment Methods Error</div>

          <div className="mt-1">{paymentMethodsError}</div>

          <button
            type="button"
            onClick={() => void loadPaymentMethods()}
            disabled={paymentMethodsLoading}
            className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentMethodsLoading ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {/* ======================================================
          TABS
      ======================================================= */}

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* ======================================================
          GENERAL TAB
      ======================================================= */}

      {activeTab === "general" && (
        <GeneralSettingsTab
          settings={generalSettings}
          setSettings={setGeneralSettings}
        />
      )}

      {/* ======================================================
          PAYMENT TAB
      ======================================================= */}

      {activeTab === "payment" && (
        <PaymentMethodsTab
          paymentMethods={paymentMethods}
          setPaymentMethods={(updater) => {
            /*
             * Support both:
             *
             * setPaymentMethods(array)
             *
             * setPaymentMethods(prev => ...)
             *
             * while normalizing UUID IDs.
             */

            setPaymentMethods((previous) => {
              const next =
                typeof updater === "function" ? updater(previous) : updater;

              return next.map(normalizePaymentMethod);
            });
          }}
          onDelete={handleDeletePaymentMethod}
        />
      )}

      {/* ======================================================
          LOTTERY TAB
      ======================================================= */}

      {activeTab === "lottery" && <LotterySettingsTab />}

      {/* ======================================================
          DEPOSIT TAB
      ======================================================= */}

      {activeTab === "deposit" && (
        <DepositSettingsTab
          settings={depositSettings}
          setSettings={setDepositSettings}
          paymentMethods={paymentMethods}
        />
      )}

      {/* ======================================================
          WITHDRAW TAB
      ======================================================= */}

      {activeTab === "withdraw" && (
        <WithdrawSettingsTab
          settings={withdrawSettings}
          setSettings={setWithdrawSettings}
          paymentMethods={paymentMethods}
        />
      )}

      {/* ======================================================
          MAINTENANCE TAB
      ======================================================= */}

      {activeTab === "maintenance" && (
        <MaintenanceSettingsTab
          settings={maintenanceSettings}
          setSettings={setMaintenanceSettings}
        />
      )}
    </div>
  );
}
