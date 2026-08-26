import { useCallback, useEffect, useMemo, useState } from "react";

import { ArrowDownToLine, Check, Copy, CreditCard } from "lucide-react";

import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import { createDepositRequest } from "@/services/deposit-request";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethodType = "Deposit" | "Withdraw" | "Both";

interface PaymentMethod {
  id: string;

  name: string;

  type: PaymentMethodType;

  enabled: boolean;

  accountName: string;

  accountNumber: string;

  bankName?: string | null;

  branch?: string | null;

  displayOrder: number;
}

interface DepositSettings {
  minimumDeposit: number;

  maximumDeposit: number;

  processingTime: string;

  depositNote: string;

  allowedPaymentMethods: string[];
}

interface PaymentMethodsApiResponse {
  success: boolean;

  message?: string;

  data?: {
    paymentMethods?: PaymentMethod[];
    methods?: PaymentMethod[];
  };
}

interface DepositSettingsApiResponse {
  success: boolean;

  message?: string;

  data?: {
    settings?: Partial<DepositSettings>;
    depositSettings?: Partial<DepositSettings>;
  };
}

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  minimumDeposit: 1000,

  maximumDeposit: 1000000,

  processingTime: "Manual review",

  depositNote:
    "Please make the payment first, then submit your transaction number.",

  allowedPaymentMethods: [],
};

/* ============================================================
   API RESPONSE HELPER
============================================================ */

async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `API returned ${response.status} ${response.statusText} with an empty response.`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    console.error("Deposit page API returned non-JSON:", text.slice(0, 2000));

    throw new Error(
      `API returned ${response.status} ${response.statusText} instead of JSON.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(
      "Failed to parse deposit page API response:",
      error,
      text.slice(0, 2000),
    );

    throw new Error("The server returned invalid JSON.");
  }
}

/* ============================================================
   PAYMENT METHOD NORMALIZER
============================================================ */

function normalizePaymentMethod(method: PaymentMethod): PaymentMethod {
  const type =
    method.type === "Deposit" ||
    method.type === "Withdraw" ||
    method.type === "Both"
      ? method.type
      : "Both";

  return {
    ...method,

    id: String(method.id),

    name: method.name ?? "",

    type,

    enabled: method.enabled !== false,

    accountName: method.accountName ?? "",

    accountNumber: method.accountNumber ?? "",

    bankName: method.bankName ?? null,

    branch: method.branch ?? null,

    displayOrder: Number(method.displayOrder) || 1,
  };
}

/* ============================================================
   LOAD PAYMENT METHODS
============================================================ */

async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await fetch("/api/player/payment-methods", {
    method: "GET",

    credentials: "include",

    headers: {
      Accept: "application/json",
    },

    cache: "no-store",
  });

  const result = await parseApiResponse<PaymentMethodsApiResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Failed to load payment methods. (${response.status})`,
    );
  }

  const methods = result.data?.paymentMethods ?? result.data?.methods ?? [];

  if (!Array.isArray(methods)) {
    throw new Error("Invalid payment methods returned by the server.");
  }

  return methods.map(normalizePaymentMethod);
}

/* ============================================================
   LOAD DEPOSIT SETTINGS
============================================================ */

async function fetchDepositSettings(): Promise<DepositSettings> {
  try {
    const response = await fetch("/api/player/deposit-settings", {
      method: "GET",

      credentials: "include",

      headers: {
        Accept: "application/json",
      },

      cache: "no-store",
    });

    const result = await parseApiResponse<DepositSettingsApiResponse>(response);

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
          `Failed to load deposit settings. (${response.status})`,
      );
    }

    const settings =
      result.data?.settings ?? result.data?.depositSettings ?? {};

    return {
      minimumDeposit:
        Number(settings.minimumDeposit) ||
        DEFAULT_DEPOSIT_SETTINGS.minimumDeposit,

      maximumDeposit:
        Number(settings.maximumDeposit) ||
        DEFAULT_DEPOSIT_SETTINGS.maximumDeposit,

      processingTime:
        settings.processingTime ?? DEFAULT_DEPOSIT_SETTINGS.processingTime,

      depositNote: settings.depositNote ?? DEFAULT_DEPOSIT_SETTINGS.depositNote,

      allowedPaymentMethods: Array.isArray(settings.allowedPaymentMethods)
        ? settings.allowedPaymentMethods.map(String)
        : DEFAULT_DEPOSIT_SETTINGS.allowedPaymentMethods,
    };
  } catch (error) {
    /*
     * Deposit settings endpoint may not exist in older
     * deployments. Keep the existing safe defaults instead
     * of preventing the whole deposit page from loading.
     */
    console.warn(
      "Unable to load deposit settings from API. Using defaults.",
      error,
    );

    return DEFAULT_DEPOSIT_SETTINGS;
  }
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Deposit() {
  /* ==========================================================
     PAYMENT METHODS
  ========================================================== */

  const [allPaymentMethods, setAllPaymentMethods] = useState<PaymentMethod[]>(
    [],
  );

  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);

  /* ==========================================================
     DEPOSIT SETTINGS
  ========================================================== */

  const [depositSettings, setDepositSettings] = useState<DepositSettings>(
    DEFAULT_DEPOSIT_SETTINGS,
  );

  const [settingsLoading, setSettingsLoading] = useState(true);

  /* ==========================================================
     FORM
  ========================================================== */

  const [amount, setAmount] = useState("");

  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const [transactionNumber, setTransactionNumber] = useState("");

  const [note, setNote] = useState("");

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [submitted, setSubmitted] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadData = useCallback(async () => {
    setPaymentMethodsLoading(true);

    setSettingsLoading(true);

    setError("");

    try {
      const [methodsResult, settingsResult] = await Promise.all([
        fetchPaymentMethods(),
        fetchDepositSettings(),
      ]);

      setAllPaymentMethods(methodsResult);

      setDepositSettings(settingsResult);

      /*
       * Automatically select the first available
       * payment method.
       */
      const availableMethods = methodsResult
        .filter(
          (method) =>
            method.enabled &&
            (method.type === "Deposit" || method.type === "Both"),
        )
        .filter((method) => {
          /*
           * If allowedPaymentMethods is empty,
           * do not hide all payment methods.
           */
          if (settingsResult.allowedPaymentMethods.length === 0) {
            return true;
          }

          return settingsResult.allowedPaymentMethods.some(
            (allowedId) => String(allowedId) === String(method.id),
          );
        })
        .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));

      if (availableMethods.length > 0) {
        setPaymentMethodId(String(availableMethods[0].id));
      }

      /*
       * Select first preset amount.
       */
      const firstPreset = [5000, 10000, 50000, 100000].find(
        (value) =>
          value >= settingsResult.minimumDeposit &&
          value <= settingsResult.maximumDeposit,
      );

      if (firstPreset) {
        setAmount(String(firstPreset));
      } else {
        setAmount("");
      }
    } catch (loadError) {
      console.error("Deposit page loading error:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load deposit information.",
      );
    } finally {
      setPaymentMethodsLoading(false);

      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* ==========================================================
     PRESET AMOUNTS
  ========================================================== */

  const presetAmounts = useMemo(() => {
    return [5000, 10000, 50000, 100000].filter(
      (value) =>
        value >= depositSettings.minimumDeposit &&
        value <= depositSettings.maximumDeposit,
    );
  }, [depositSettings.minimumDeposit, depositSettings.maximumDeposit]);

  /* ==========================================================
     AVAILABLE PAYMENT METHODS
  ========================================================== */

  const paymentMethods = useMemo(() => {
    return allPaymentMethods
      .filter(
        (method) =>
          method.enabled &&
          (method.type === "Deposit" || method.type === "Both"),
      )
      .filter((method) => {
        if (depositSettings.allowedPaymentMethods.length === 0) {
          return true;
        }

        return depositSettings.allowedPaymentMethods.some(
          (allowedId) => String(allowedId) === String(method.id),
        );
      })
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  }, [allPaymentMethods, depositSettings.allowedPaymentMethods]);

  /* ==========================================================
     SELECTED METHOD
  ========================================================== */

  const selectedMethod = paymentMethods.find(
    (method) => String(method.id) === String(paymentMethodId),
  );

  /* ==========================================================
     PAYMENT NUMBER
  ========================================================== */

  const paymentNumber = useMemo(() => {
    if (!selectedMethod) {
      return "";
    }

    return selectedMethod.accountNumber?.trim() || "";
  }, [selectedMethod]);

  /* ==========================================================
     COPY PAYMENT NUMBER
  ========================================================== */

  const handleCopyPaymentNumber = async () => {
    if (!paymentNumber) {
      return;
    }

    setError("");

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(paymentNumber);
      } else {
        const textArea = document.createElement("textarea");

        textArea.value = paymentNumber;

        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");

        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Copy failed.");
        }
      }

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error("Copy payment number error:", copyError);

      setError("Unable to copy the payment number.");
    }
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    /* --------------------------------------------------------
       AMOUNT
    -------------------------------------------------------- */

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid deposit amount.");

      return;
    }

    if (numericAmount < depositSettings.minimumDeposit) {
      setError(
        `Minimum deposit is ${depositSettings.minimumDeposit.toLocaleString()} MMK.`,
      );

      return;
    }

    if (numericAmount > depositSettings.maximumDeposit) {
      setError(
        `Maximum deposit is ${depositSettings.maximumDeposit.toLocaleString()} MMK.`,
      );

      return;
    }

    /* --------------------------------------------------------
       PAYMENT METHOD
    -------------------------------------------------------- */

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select a payment method.");

      return;
    }

    /* --------------------------------------------------------
       TRANSACTION NUMBER
    -------------------------------------------------------- */

    const normalizedTransactionNumber = transactionNumber.trim();

    if (!normalizedTransactionNumber) {
      setError("Transaction number is required.");

      return;
    }

    if (!/^\d{6}$/.test(normalizedTransactionNumber)) {
      setError("Please enter the last 6 digits of your transaction number.");

      return;
    }

    /* --------------------------------------------------------
       CREATE REAL DATABASE REQUEST
    -------------------------------------------------------- */

    setSubmitting(true);

    try {
      const deposit = await createDepositRequest({
        amount: numericAmount,

        paymentMethodId: String(selectedMethod.id),

        transactionNumber: normalizedTransactionNumber,

        note: note.trim() || undefined,
      });

      console.log("Deposit request created successfully:", deposit);

      /*
       * Only show success after the database API
       * confirms that the record was created.
       */
      setSubmitted(true);
    } catch (submitError) {
      console.error("Create deposit request error:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit deposit request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     INITIAL LOADING
  ========================================================== */

  if (paymentMethodsLoading || settingsLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading deposit information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     SUCCESS PAGE
  ========================================================== */

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Deposit Request Submitted
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your deposit request has been submitted successfully.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Processing time: {depositSettings.processingTime}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/player/wallet"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     MAIN PAGE
  ========================================================== */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div>
        <Link
          to="/player/wallet"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Wallet
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ArrowDownToLine size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deposit</h1>

            <p className="mt-1 text-sm text-slate-500">
              Add money to your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* ======================================================
          FORM
      ======================================================= */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* ====================================================
            PAYMENT METHOD
        ===================================================== */}

        <div>
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Select Deposit Method
          </label>

          {paymentMethods.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((method) => {
                const selected = String(paymentMethodId) === String(method.id);

                return (
                  <button
                    key={String(method.id)}
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setPaymentMethodId(String(method.id));

                      setError("");

                      setCopied(false);
                    }}
                    className={`relative flex min-h-[92px] items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                    } ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-indigo-600" : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                      <CreditCard className="h-7 w-7 text-indigo-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          selected ? "text-indigo-700" : "text-slate-800"
                        }`}
                      >
                        {method.name}
                      </p>

                      {method.bankName && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {method.bankName}
                        </p>
                      )}

                      {method.accountName && (
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {method.accountName}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-400">
                        Deposit payment method
                      </p>
                    </div>

                    {selected && (
                      <div className="absolute right-3 top-3">
                        <Check className="h-5 w-5 text-indigo-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-700">
                No deposit payment methods are currently available.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Please try again later.
              </p>
            </div>
          )}

          {/* ==================================================
              SELECTED PAYMENT DETAILS
          ================================================== */}

          {selectedMethod && (
            <div className="mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50">
              <div className="flex items-center gap-3 border-b border-indigo-100 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-indigo-800">
                    {selectedMethod.name}
                  </p>

                  <p className="text-xs text-indigo-600">
                    Send your payment using this method
                  </p>
                </div>
              </div>

              {/* ACCOUNT NAME */}

              {selectedMethod.accountName && (
                <div className="border-b border-indigo-100 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Account Name
                  </p>

                  <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-base font-bold tracking-wide text-slate-800">
                      {selectedMethod.accountName}
                    </p>
                  </div>
                </div>
              )}

              {/* ACCOUNT NUMBER */}

              {paymentNumber && (
                <div className="border-b border-indigo-100 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Payment Number
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white p-2 shadow-sm">
                    <div className="min-w-0 flex-1 px-2">
                      <p className="truncate text-base font-bold tracking-wide text-slate-800">
                        {paymentNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleCopyPaymentNumber}
                      className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        copied
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Send your payment to this number.
                  </p>
                </div>
              )}

              {/* BANK INFORMATION */}

              {(selectedMethod.bankName || selectedMethod.branch) && (
                <div className="border-b border-indigo-100 px-4 py-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Bank Information
                  </p>

                  <div className="space-y-2 rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
                    {selectedMethod.bankName && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500">Bank</span>

                        <span className="text-sm font-semibold text-slate-800">
                          {selectedMethod.bankName}
                        </span>
                      </div>
                    )}

                    {selectedMethod.branch && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-slate-500">Branch</span>

                        <span className="text-right text-sm font-semibold text-slate-800">
                          {selectedMethod.branch}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  After completing your payment, enter the last 6 digits of your
                  transaction number below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ====================================================
            AMOUNT
        ===================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Deposit Amount
          </label>

          {presetAmounts.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presetAmounts.map((value) => {
                const selected = amount === String(value);

                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 transition ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                    } ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="depositAmount"
                      value={value}
                      checked={selected}
                      disabled={submitting}
                      onChange={() => {
                        setAmount(String(value));

                        setError("");
                      }}
                      className="h-4 w-4 accent-indigo-600"
                    />

                    <span className="text-sm font-semibold">
                      {value.toLocaleString()}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <input
            type="number"
            min={depositSettings.minimumDeposit}
            max={depositSettings.maximumDeposit}
            value={amount}
            disabled={submitting}
            onChange={(event) => {
              setAmount(event.target.value);

              setError("");
            }}
            placeholder="Enter custom amount"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {depositSettings.minimumDeposit.toLocaleString()} MMK · Max:{" "}
            {depositSettings.maximumDeposit.toLocaleString()} MMK
          </p>
        </div>

        {/* ====================================================
            TRANSACTION NUMBER
        ===================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Transaction Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={transactionNumber}
            disabled={submitting}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);

              setTransactionNumber(value);

              setError("");
            }}
            placeholder="Enter last 6 digits"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          />

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Enter the last 6 digits of your transaction number.
            </p>

            <p className="text-xs font-medium text-slate-400">
              {transactionNumber.length}/6
            </p>
          </div>
        </div>

        {/* ====================================================
            NOTE
        ===================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
            <span className="ml-1 font-normal text-slate-400">(Optional)</span>
          </label>

          <textarea
            rows={3}
            value={note}
            disabled={submitting}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Enter an optional note"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          />
        </div>

        {/* ====================================================
            DEPOSIT INFORMATION
        ===================================================== */}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            Deposit Information
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {depositSettings.depositNote}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Processing time: {depositSettings.processingTime}
          </p>
        </div>

        {/* ====================================================
            SUBMIT
        ===================================================== */}

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant="success"
            disabled={submitting || paymentMethods.length === 0}
          >
            {submitting ? "Submitting..." : "Submit Deposit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
