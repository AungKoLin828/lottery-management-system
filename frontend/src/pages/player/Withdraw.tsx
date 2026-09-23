import { useMemo, useState } from "react";
import {
  ArrowUpFromLine,
  CheckCircle2,
  CreditCard,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import {
  walletPaymentMethods,
  withdrawSettings,
} from "@/services/walletSettings";

/* ============================================================
   TYPES
============================================================ */

type PaymentMethod = (typeof walletPaymentMethods)[number];

type PaymentMethodWithLogo = PaymentMethod & {
  logo?: string | null;
  logoUrl?: string | null;
};

interface WithdrawApiResponse {
  success?: boolean;
  message?: string;
  withdrawal?: {
    id?: string;
    status?: string;
    amount?: number | string;
    requestedAmount?: number | string;
    approvedAmount?: number | string | null;
    fee?: number | string;
    paymentMethodId?: string;
    accountName?: string;
    accountNumber?: string;
    createdAt?: string;
  };
}

/* ============================================================
   CONSTANTS
============================================================ */

const FIRST_WITHDRAWAL_WAIT_HOURS = 24;

const FIRST_WITHDRAWAL_KEY =
  "lottery_first_withdrawal_completed";

/* ============================================================
   HELPERS
============================================================ */

/**
 * Safely get payment method logo.
 */
const getPaymentMethodLogo = (
  method: PaymentMethod,
): string => {
  const paymentMethod = method as PaymentMethodWithLogo;

  return (
    paymentMethod.logo?.trim() ||
    paymentMethod.logoUrl?.trim() ||
    ""
  );
};

/**
 * Normalize payment method name.
 */
const normalizePaymentMethodName = (
  name: unknown,
): string => {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
};

/**
 * Normalize payment method ID.
 *
 * The frontend settings may currently contain numeric IDs
 * while the real database may return UUID/string IDs.
 *
 * We therefore keep the value as a string.
 */
const normalizePaymentMethodId = (
  id: unknown,
): string => {
  if (id === null || id === undefined) {
    return "";
  }

  return String(id).trim();
};

/**
 * Normalize allowed payment method IDs.
 */
const normalizeAllowedPaymentMethodIds = (
  ids: unknown,
): Set<string> => {
  if (!Array.isArray(ids)) {
    return new Set<string>();
  }

  return new Set(
    ids
      .map((id) => normalizePaymentMethodId(id))
      .filter(Boolean),
  );
};

/**
 * Safely convert a value to number.
 */
const toNumber = (
  value: unknown,
  fallback = 0,
): number => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : fallback;
};

/**
 * Extract a useful error message from an API response.
 */
const getApiErrorMessage = (
  responseBody: WithdrawApiResponse | null,
  fallback: string,
): string => {
  const message = responseBody?.message?.trim();

  return message || fallback;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Withdraw() {
  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [amount, setAmount] = useState("");

  const [paymentMethodId, setPaymentMethodId] =
    useState<string | null>(null);

  const [accountName, setAccountName] = useState("");

  const [accountNumber, setAccountNumber] =
    useState("");

  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /* ==========================================================
     DEMO WALLET BALANCE

     IMPORTANT:
     Replace this with your existing realtime wallet
     balance state/hook when the wallet API is connected.

     The backend remains the final authority when the
     withdrawal is approved.
  ========================================================== */

  const balance = 125000;

  /* ==========================================================
     FIRST WITHDRAWAL STATUS

     This is currently UI persistence only.

     The backend should remain the source of truth for
     whether this is actually the player's first withdrawal.
  ========================================================== */

  const [isFirstWithdrawal, setIsFirstWithdrawal] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            FIRST_WITHDRAWAL_KEY,
          ) !== "true"
        );
      } catch {
        return true;
      }
    });

  /* ==========================================================
     PAYMENT METHODS
  ========================================================== */

  const normalizedAllowedMethodIds =
    useMemo(
      () =>
        normalizeAllowedPaymentMethodIds(
          withdrawSettings.allowedPaymentMethods,
        ),
      [],
    );

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter((method) => {
        const methodName =
          normalizePaymentMethodName(method.name);

        const isKPay =
          methodName === "kpay" ||
          methodName === "kbzpay" ||
          methodName === "kbz pay";

        const isWavePay =
          methodName === "wavepay" ||
          methodName === "wave pay";

        return isKPay || isWavePay;
      })
      .filter((method) => {
        const supportedType =
          method.type === "Withdraw" ||
          method.type === "Both";

        return supportedType;
      })
      .filter((method) => {
        const methodId =
          normalizePaymentMethodId(method.id);

        /*
         * If allowedPaymentMethods is configured,
         * respect it.
         *
         * If it is empty, allow all enabled withdrawal
         * methods.
         */
        if (
          normalizedAllowedMethodIds.size === 0
        ) {
          return true;
        }

        return normalizedAllowedMethodIds.has(
          methodId,
        );
      })
      .filter((method) => Boolean(method.enabled))
      .sort((a, b) => {
        const getPriority = (
          name: string,
        ): number => {
          const normalized =
            normalizePaymentMethodName(name);

          if (
            normalized === "kpay" ||
            normalized === "kbzpay" ||
            normalized === "kbz pay"
          ) {
            return 1;
          }

          if (
            normalized === "wavepay" ||
            normalized === "wave pay"
          ) {
            return 2;
          }

          return 99;
        };

        const priorityDifference =
          getPriority(a.name) -
          getPriority(b.name);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return (
          Number(a.displayOrder ?? 0) -
          Number(b.displayOrder ?? 0)
        );
      });
  }, [normalizedAllowedMethodIds]);

  /* ==========================================================
     GET DISPLAY NAME
  ========================================================== */

  const getPaymentMethodDisplayName = (
    method: PaymentMethod,
  ): string => {
    const normalizedName =
      normalizePaymentMethodName(method.name);

    if (
      normalizedName === "kpay" ||
      normalizedName === "kbzpay" ||
      normalizedName === "kbz pay"
    ) {
      return "KPay";
    }

    if (
      normalizedName === "wavepay" ||
      normalizedName === "wave pay"
    ) {
      return "WavePay";
    }

    return String(method.name ?? "");
  };

  /* ==========================================================
     SELECTED METHOD
  ========================================================== */

  const selectedMethod = paymentMethods.find(
    (method) =>
      normalizePaymentMethodId(method.id) ===
      paymentMethodId,
  );

  const selectedPaymentMethodName =
    selectedMethod
      ? getPaymentMethodDisplayName(selectedMethod)
      : "";

  /* ==========================================================
     AMOUNT / FEE
  ========================================================== */

  const numericAmount = toNumber(amount);

  const fee = Math.max(
    0,
    toNumber(withdrawSettings.withdrawFee),
  );

  /*
   * Requested withdrawal amount must be covered by
   * the wallet balance plus any applicable fee.
   *
   * Your current setting has fee = 0.
   */
  const totalDeduction =
    numericAmount > 0
      ? numericAmount + fee
      : 0;

  const netAmount =
    numericAmount > 0
      ? Math.max(numericAmount - fee, 0)
      : 0;

  /* ==========================================================
     SELECT PAYMENT METHOD
  ========================================================== */

  const handleSelectPaymentMethod = (
    methodId: unknown,
  ) => {
    const normalizedId =
      normalizePaymentMethodId(methodId);

    setPaymentMethodId(
      normalizedId || null,
    );

    /*
     * Do not automatically copy the admin payment
     * account.
     *
     * Player enters their own account.
     */
    setAccountNumber("");

    setError("");
    setSuccessMessage("");
  };

  /* ==========================================================
     SUBMIT WITHDRAWAL REQUEST
  ========================================================== */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    /*
     * Prevent double-click / duplicate requests.
     */
    if (isSubmitting) {
      return;
    }

    setError("");
    setSuccessMessage("");

    /* --------------------------------------------------------
       AMOUNT
    -------------------------------------------------------- */

    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid withdrawal amount.",
      );
      return;
    }

    const minimumWithdraw = toNumber(
      withdrawSettings.minimumWithdraw,
    );

    const maximumWithdraw = toNumber(
      withdrawSettings.maximumWithdraw,
    );

    if (
      numericAmount < minimumWithdraw
    ) {
      setError(
        `Minimum withdrawal is ${minimumWithdraw.toLocaleString()} MMK.`,
      );
      return;
    }

    if (
      numericAmount > maximumWithdraw
    ) {
      setError(
        `Maximum withdrawal is ${maximumWithdraw.toLocaleString()} MMK.`,
      );
      return;
    }

    /* --------------------------------------------------------
       BALANCE
    -------------------------------------------------------- */

    if (totalDeduction > balance) {
      setError(
        `Insufficient wallet balance. Available balance is ${balance.toLocaleString()} MMK.`,
      );
      return;
    }

    /* --------------------------------------------------------
       PAYMENT METHOD
    -------------------------------------------------------- */

    if (
      !paymentMethodId ||
      !selectedMethod
    ) {
      setError(
        "Please select KPay or WavePay.",
      );
      return;
    }

    const normalizedSelectedMethodId =
      normalizePaymentMethodId(
        selectedMethod.id,
      );

    if (!normalizedSelectedMethodId) {
      setError(
        "Invalid payment method. Please select another payment method.",
      );
      return;
    }

    if (!selectedMethod.enabled) {
      setError(
        "The selected payment method is currently unavailable.",
      );
      return;
    }

    const selectedMethodType =
      String(
        selectedMethod.type ?? "",
      ).toLowerCase();

    if (
      selectedMethodType !== "withdraw" &&
      selectedMethodType !== "both"
    ) {
      setError(
        "The selected payment method cannot be used for withdrawal.",
      );
      return;
    }

    /* --------------------------------------------------------
       ACCOUNT NAME
    -------------------------------------------------------- */

    const trimmedAccountName =
      accountName.trim();

    if (!trimmedAccountName) {
      setError(
        "Account name is required.",
      );
      return;
    }

    /* --------------------------------------------------------
       ACCOUNT NUMBER
    -------------------------------------------------------- */

    const trimmedAccountNumber =
      accountNumber.trim();

    if (!trimmedAccountNumber) {
      setError(
        `Please enter your ${selectedPaymentMethodName} account number.`,
      );
      return;
    }

    /* --------------------------------------------------------
       ACCOUNT NUMBER BASIC VALIDATION
    -------------------------------------------------------- */

    if (
      trimmedAccountNumber.length < 5
    ) {
      setError(
        `Please enter a valid ${selectedPaymentMethodName} account number.`,
      );
      return;
    }

    /* --------------------------------------------------------
       NOTE
    -------------------------------------------------------- */

    const trimmedNote =
      note.trim();

    if (trimmedNote.length > 500) {
      setError(
        "Note cannot be longer than 500 characters.",
      );
      return;
    }

    /* --------------------------------------------------------
       FIRST WITHDRAWAL

       This value is used only for UI messaging.
       Backend must remain the source of truth.
    -------------------------------------------------------- */

    const firstWithdrawal =
      isFirstWithdrawal;

    /* --------------------------------------------------------
       REQUEST PAYLOAD

       IMPORTANT:

       Do NOT send:
       - playerId
       - playerName
       - status
       - createdAt
       - approvedBy
       - approvedAmount

       The backend gets the authenticated player from
       the JWT cookie and creates the request as PENDING.
    -------------------------------------------------------- */

    const requestBody = {
      amount: numericAmount,
      paymentMethodId:
        normalizedSelectedMethodId,
      accountName: trimmedAccountName,
      accountNumber: trimmedAccountNumber,
      note:
        trimmedNote || undefined,
    };

    try {
      setIsSubmitting(true);

      /* ------------------------------------------------------
         REAL BACKEND REQUEST

         Browser automatically sends the authentication
         cookie because credentials are included.
      ------------------------------------------------------ */

      const response = await fetch(
        "/api/player/withdraw-request",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(
            requestBody,
          ),
        },
      );

      let responseBody:
        | WithdrawApiResponse
        | null = null;

      try {
        responseBody =
          (await response.json()) as WithdrawApiResponse;
      } catch {
        responseBody = null;
      }

      /* ------------------------------------------------------
         API ERROR
      ------------------------------------------------------ */

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            `Unable to submit withdrawal request. Server returned ${response.status}.`,
          ),
        );
      }

      if (
        responseBody?.success !== true
      ) {
        throw new Error(
          getApiErrorMessage(
            responseBody,
            "Unable to submit withdrawal request.",
          ),
        );
      }

      /* ------------------------------------------------------
         SUCCESS
      ------------------------------------------------------ */

      /*
       * Keep the method name before resetting the form.
       */
      const submittedMethodName =
        selectedPaymentMethodName;

      /*
       * Backend has successfully created the
       * withdrawal request.
       *
       * It should now be PENDING.
       */
      const backendStatus =
        responseBody.withdrawal?.status;

      if (
        backendStatus &&
        backendStatus !== "PENDING"
      ) {
        console.warn(
          "Unexpected withdrawal status:",
          backendStatus,
        );
      }

      /* ------------------------------------------------------
         FIRST WITHDRAWAL UI STATE
         
         This is only local UI persistence.
         Backend remains the source of truth.
      ------------------------------------------------------ */

      if (firstWithdrawal) {
        try {
          localStorage.setItem(
            FIRST_WITHDRAWAL_KEY,
            "true",
          );
        } catch {
          // Ignore localStorage failures.
        }

        setIsFirstWithdrawal(false);
      }

      /* ------------------------------------------------------
         SUCCESS MESSAGE
      ------------------------------------------------------ */

      setSuccessMessage(
        firstWithdrawal
          ? "Your first withdrawal request has been submitted successfully and is waiting for admin approval."
          : "Your withdrawal request has been submitted successfully and is waiting for admin approval.",
      );

      /*
       * IMPORTANT:
       *
       * Do not reduce the wallet balance here.
       *
       * The request is only PENDING.
       *
       * Wallet deduction must happen atomically when
       * admin approves the withdrawal.
       */

      console.info(
        "Withdrawal request submitted successfully",
        {
          method: submittedMethodName,
          amount: numericAmount,
          fee,
          netAmount,
          status:
            responseBody.withdrawal?.status ??
            "PENDING",
        },
      );

      /* ------------------------------------------------------
         RESET FORM
      ------------------------------------------------------ */

      setAmount("");
      setPaymentMethodId(null);
      setAccountName("");
      setAccountNumber("");
      setNote("");

      setSubmitted(true);
    } catch (submitError) {
      console.error(
        "Withdrawal request failed:",
        submitError,
      );

      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit withdrawal request.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==========================================================
     SUCCESS PAGE
  ========================================================== */

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Withdrawal Request Submitted
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {successMessage ||
              "Your withdrawal request has been submitted successfully and is waiting for admin approval."}
          </p>

          {selectedPaymentMethodName && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left">
              <p className="text-xs font-medium text-indigo-500">
                Withdrawal Method
              </p>

              <p className="mt-1 text-sm font-bold text-indigo-800">
                {selectedPaymentMethodName}
              </p>
            </div>
          )}

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {isFirstWithdrawal
                    ? "First Withdrawal Review"
                    : "Withdrawal Under Review"}
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Your withdrawal request is waiting for
                  admin approval. Please allow up to{" "}
                  <strong>
                    {isFirstWithdrawal
                      ? FIRST_WITHDRAWAL_WAIT_HOURS
                      : withdrawSettings.processingTime}
                  </strong>{" "}
                  for processing.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Normal processing time:{" "}
            {withdrawSettings.processingTime}
          </p>

          <div className="mt-6">
            <Link
              to="/player/wallet"
              className="inline-flex rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
      ====================================================== */}

      <div>
        <Link
          to="/player/wallet"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Wallet
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <ArrowUpFromLine size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Withdraw
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Withdraw money from your wallet.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          FIRST WITHDRAWAL NOTICE
      ====================================================== */}

      {isFirstWithdrawal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-bold text-amber-800">
                First Withdrawal Requires Admin Approval
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Your first withdrawal request will be
                manually reviewed by admin. Please allow
                up to{" "}
                <strong>
                  {FIRST_WITHDRAWAL_WAIT_HOURS} hours
                </strong>{" "}
                for approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BALANCE
      ====================================================== */}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-sm text-slate-500">
          Available Balance
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {balance.toLocaleString()}{" "}
          <span className="text-sm font-medium text-slate-500">
            MMK
          </span>
        </p>
      </div>

      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >

        {/* ====================================================
            AMOUNT
        ==================================================== */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Withdrawal Amount
          </label>

          <input
            type="number"
            min={withdrawSettings.minimumWithdraw}
            max={withdrawSettings.maximumWithdraw}
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError("");
            }}
            placeholder="Enter amount"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min:{" "}
            {withdrawSettings.minimumWithdraw.toLocaleString()}{" "}
            MMK
            {" · "}
            Max:{" "}
            {withdrawSettings.maximumWithdraw.toLocaleString()}{" "}
            MMK
          </p>
        </div>

        {/* ====================================================
            PAYMENT METHODS
        ==================================================== */}

        <div className="mt-6">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Withdrawal Method
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => {
              const methodId =
                normalizePaymentMethodId(
                  method.id,
                );

              const selected =
                paymentMethodId === methodId;

              const displayName =
                getPaymentMethodDisplayName(
                  method,
                );

              const logo =
                getPaymentMethodLogo(method);

              return (
                <button
                  key={methodId}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    handleSelectPaymentMethod(
                      methodId,
                    )
                  }
                  className={`relative rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >

                  {selected && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${displayName} logo`}
                          className="h-full w-full object-contain p-1.5"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <CreditCard className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                      <p
                        className={`text-base font-bold ${
                          selected
                            ? "text-indigo-700"
                            : "text-slate-800"
                        }`}
                      >
                        {displayName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Mobile Payment
                      </p>
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-lg border px-3 py-2.5 ${
                      selected
                        ? "border-indigo-200 bg-white"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Withdrawal Account
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Enter your own {displayName} account
                      number below.
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {paymentMethods.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                No KPay or WavePay withdrawal methods
                available
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                KPay and WavePay are currently unavailable
                for withdrawal. Please contact support or
                try again later.
              </p>
            </div>
          )}
        </div>

        {/* ====================================================
            SELECTED PAYMENT METHOD
        ==================================================== */}

        {selectedMethod && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />

              <p className="text-sm font-bold text-indigo-800">
                {selectedPaymentMethodName} Account
              </p>
            </div>

            <p className="mt-1 text-xs leading-5 text-indigo-600">
              Enter the {selectedPaymentMethodName} account
              where you want to receive your withdrawal.
            </p>
          </div>
        )}

        {/* ====================================================
            ACCOUNT NAME
        ==================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account Name
          </label>

          <input
            type="text"
            value={accountName}
            maxLength={150}
            onChange={(event) => {
              setAccountName(event.target.value);
              setError("");
            }}
            placeholder="Enter account holder name"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />

          <p className="mt-2 text-xs text-slate-400">
            Enter the name registered with your KPay or
            WavePay account.
          </p>
        </div>

        {/* ====================================================
            ACCOUNT NUMBER
        ==================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account Number / Phone Number
          </label>

          <input
            type="text"
            inputMode="tel"
            value={accountNumber}
            maxLength={50}
            onChange={(event) => {
              setAccountNumber(event.target.value);
              setError("");
            }}
            placeholder={
              selectedMethod
                ? `Enter ${selectedPaymentMethodName} account number`
                : "Select KPay or WavePay first"
            }
            disabled={
              !selectedMethod ||
              isSubmitting
            }
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
              !selectedMethod ||
              isSubmitting
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : "border-slate-200 bg-white"
            }`}
          />

          <p className="mt-2 text-xs text-slate-400">
            Make sure the account number is correct before
            submitting.
          </p>
        </div>

        {/* ====================================================
            NOTE
        ==================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
            <span className="ml-1 font-normal text-slate-400">
              (Optional)
            </span>
          </label>

          <textarea
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            placeholder="Optional note"
            disabled={isSubmitting}
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        {numericAmount > 0 && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">

            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Withdrawal
              </span>

              <span className="font-medium text-slate-800">
                {numericAmount.toLocaleString()} MMK
              </span>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">
                Withdrawal Fee
              </span>

              <span className="font-medium text-slate-800">
                {fee.toLocaleString()} MMK
              </span>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">
                  You Receive
                </span>

                <span className="font-bold text-indigo-600">
                  {netAmount.toLocaleString()} MMK
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-400">
                Total wallet deduction
              </span>

              <span className="font-medium text-slate-500">
                {totalDeduction.toLocaleString()} MMK
              </span>
            </div>
          </div>
        )}

        {/* ====================================================
            FIRST WITHDRAWAL APPROVAL
        ==================================================== */}

        {isFirstWithdrawal && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  24-Hour First Withdrawal Review
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Your first withdrawal requires manual
                  admin approval. Processing may take up to{" "}
                  <strong>
                    {FIRST_WITHDRAWAL_WAIT_HOURS} hours
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            NORMAL APPROVAL
        ==================================================== */}

        {!isFirstWithdrawal &&
          withdrawSettings.approvalRequired && (
            <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

                <div>
                  <p className="text-sm font-semibold text-indigo-800">
                    Admin Approval Required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-indigo-700">
                    Your withdrawal request will be reviewed
                    by admin before the payment is processed.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ====================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {successMessage && !submitted && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant="success"
            disabled={
              isSubmitting ||
              paymentMethods.length === 0
            }
          >
            {isSubmitting
              ? "Submitting..."
              : isFirstWithdrawal
                ? "Submit for Admin Approval"
                : "Submit Withdrawal Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}