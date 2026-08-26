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

/*
 * walletPaymentMethods may not currently define a `logo`
 * property in its TypeScript type.
 *
 * This extended type allows the UI to safely support:
 *
 *   logo
 *   logoUrl
 *
 * without requiring changes to the backend.
 */
type PaymentMethod = (typeof walletPaymentMethods)[number];

type PaymentMethodWithLogo = PaymentMethod & {
  logo?: string | null;
  logoUrl?: string | null;
};

/* ============================================================
   CONSTANTS
============================================================ */

const FIRST_WITHDRAWAL_WAIT_HOURS = 24;

const FIRST_WITHDRAWAL_KEY = "lottery_first_withdrawal_completed";

/* ============================================================
   HELPERS
============================================================ */

/**
 * Safely get payment method logo.
 *
 * Supports:
 * - logo
 * - logoUrl
 *
 * If neither exists, returns an empty string.
 */
const getPaymentMethodLogo = (method: PaymentMethod): string => {
  const paymentMethod = method as PaymentMethodWithLogo;

  return paymentMethod.logo?.trim() || paymentMethod.logoUrl?.trim() || "";
};

/**
 * Normalize payment method name.
 */
const normalizePaymentMethodName = (name: unknown): string => {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
};

/**
 * Convert payment method ID to a number.
 *
 * This prevents problems when the API/database returns:
 *
 *   1
 *
 * or:
 *
 *   "1"
 */
const normalizePaymentMethodId = (id: unknown): number => {
  const numericId = Number(id);

  return Number.isFinite(numericId) ? numericId : 0;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function Withdraw() {
  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [amount, setAmount] = useState("");

  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);

  const [accountName, setAccountName] = useState("");

  const [accountNumber, setAccountNumber] = useState("");

  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  /* ==========================================================
     DEMO WALLET BALANCE

     Replace this with the logged-in player's wallet balance
     API when the wallet balance API is connected.
  ========================================================== */

  const balance = 125000;

  /* ==========================================================
     FIRST WITHDRAWAL STATUS

     Frontend-only persistence for now.

     Backend should eventually store whether the player has
     already completed a first withdrawal.
  ========================================================== */

  const [isFirstWithdrawal, setIsFirstWithdrawal] = useState(() => {
    try {
      return localStorage.getItem(FIRST_WITHDRAWAL_KEY) !== "true";
    } catch {
      return true;
    }
  });

  /* ==========================================================
     PAYMENT METHODS

     Only KPay and WavePay are displayed.

     Supported names:
       KPay
       KBZPay
       KBZ Pay
       WavePay
       Wave Pay
  ========================================================== */

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter((method) => {
        const methodName = normalizePaymentMethodName(method.name);

        const isKPay =
          methodName === "kpay" ||
          methodName === "kbzpay" ||
          methodName === "kbz pay";

        const isWavePay = methodName === "wavepay" || methodName === "wave pay";

        const supportedMethod = isKPay || isWavePay;

        const supportedType =
          method.type === "Withdraw" || method.type === "Both";

        /*
         * Normalize both sides of the ID comparison.
         *
         * This avoids:
         *
         * number 1 !== string "1"
         */
        const methodId = normalizePaymentMethodId(method.id);

        const allowed = withdrawSettings.allowedPaymentMethods.some(
          (allowedId) => normalizePaymentMethodId(allowedId) === methodId,
        );

        return method.enabled && supportedMethod && supportedType && allowed;
      })
      .sort((a, b) => {
        const getPriority = (name: string) => {
          const normalized = normalizePaymentMethodName(name);

          if (
            normalized === "kpay" ||
            normalized === "kbzpay" ||
            normalized === "kbz pay"
          ) {
            return 1;
          }

          if (normalized === "wavepay" || normalized === "wave pay") {
            return 2;
          }

          return 99;
        };

        const priorityDifference = getPriority(a.name) - getPriority(b.name);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0);
      });
  }, []);

  /* ==========================================================
     GET DISPLAY NAME
  ========================================================== */

  const getPaymentMethodDisplayName = (method: PaymentMethod) => {
    const normalizedName = normalizePaymentMethodName(method.name);

    if (
      normalizedName === "kpay" ||
      normalizedName === "kbzpay" ||
      normalizedName === "kbz pay"
    ) {
      return "KPay";
    }

    if (normalizedName === "wavepay" || normalizedName === "wave pay") {
      return "WavePay";
    }

    return String(method.name ?? "");
  };

  /* ==========================================================
     SELECTED METHOD
  ========================================================== */

  const selectedMethod = paymentMethods.find(
    (method) => normalizePaymentMethodId(method.id) === paymentMethodId,
  );

  const selectedPaymentMethodName = selectedMethod
    ? getPaymentMethodDisplayName(selectedMethod)
    : "";

  /* ==========================================================
     AMOUNT / FEE
  ========================================================== */

  const numericAmount = Number(amount);

  const fee = Number(withdrawSettings.withdrawFee) || 0;

  const totalDeduction = numericAmount > 0 ? numericAmount + fee : 0;

  const netAmount = numericAmount > 0 ? numericAmount - fee : 0;

  /* ==========================================================
     SELECT PAYMENT METHOD
  ========================================================== */

  const handleSelectPaymentMethod = (methodId: unknown) => {
    const normalizedId = normalizePaymentMethodId(methodId);

    setPaymentMethodId(normalizedId || null);

    /*
     * Do not automatically copy the admin's configured
     * payment account.
     *
     * Player enters their own account.
     */
    setAccountNumber("");

    setError("");
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    /* --------------------------------------------------------
       AMOUNT
    -------------------------------------------------------- */

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid withdrawal amount.");

      return;
    }

    if (numericAmount < withdrawSettings.minimumWithdraw) {
      setError(
        `Minimum withdrawal is ${withdrawSettings.minimumWithdraw.toLocaleString()} MMK.`,
      );

      return;
    }

    if (numericAmount > withdrawSettings.maximumWithdraw) {
      setError(
        `Maximum withdrawal is ${withdrawSettings.maximumWithdraw.toLocaleString()} MMK.`,
      );

      return;
    }

    /* --------------------------------------------------------
       FEE / BALANCE
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

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select KPay or WavePay.");

      return;
    }

    /* --------------------------------------------------------
       ACCOUNT NAME
    -------------------------------------------------------- */

    if (!accountName.trim()) {
      setError("Account name is required.");

      return;
    }

    /* --------------------------------------------------------
       ACCOUNT NUMBER
    -------------------------------------------------------- */

    if (!accountNumber.trim()) {
      setError(
        `Please enter your ${selectedPaymentMethodName} account number.`,
      );

      return;
    }

    /* --------------------------------------------------------
       FIRST WITHDRAWAL
    -------------------------------------------------------- */

    const firstWithdrawal = isFirstWithdrawal;

    /* --------------------------------------------------------
       CREATE REQUEST
    -------------------------------------------------------- */

    // const withdrawId = `WDR-${Date.now()}`;

    // const request = createWithdrawRequest({
    //   id: withdrawId,

    //   playerId: "PLAYER-001",

    //   playerName: "Player",

    //   amount: numericAmount,

    //   fee,

    //   netAmount,

    //   paymentMethodId: normalizePaymentMethodId(selectedMethod.id),

    //   paymentMethodName: selectedPaymentMethodName,

    //   accountName: accountName.trim(),

    //   accountNumber: accountNumber.trim(),

    //   note: note.trim() || undefined,

    //   /*
    //    * Withdrawal must remain pending until admin approval.
    //    */
    //   status: "PENDING",

    //   createdAt: new Date().toISOString(),
    // });

    /* --------------------------------------------------------
       NOTIFY ADMIN
    -------------------------------------------------------- */

    // notifyAdminWithdrawRequest({
    //   withdrawId: request.id,

    //   playerId: request.playerId,

    //   playerName: request.playerName,

    //   amount: request.amount,
    // });

    /* --------------------------------------------------------
       MARK FIRST WITHDRAWAL AS COMPLETED

       Frontend persistence only.
       Backend should eventually control this.
    -------------------------------------------------------- */

    if (firstWithdrawal) {
      try {
        localStorage.setItem(FIRST_WITHDRAWAL_KEY, "true");
      } catch {
        // Ignore localStorage errors.
      }

      setIsFirstWithdrawal(false);
    }

    /* --------------------------------------------------------
       SUCCESS
    -------------------------------------------------------- */

    setSubmitted(true);
  };

  /* ==========================================================
     SUCCESS PAGE
  ========================================================== */

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          {/* SUCCESS ICON */}

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>

          {/* TITLE */}

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Withdrawal Request Submitted
          </h1>

          {/* MESSAGE */}

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your withdrawal request has been submitted successfully and is
            waiting for admin approval.
          </p>

          {/* PAYMENT METHOD */}

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

          {/* FIRST WITHDRAWAL MESSAGE */}

          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  First Withdrawal Review
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Because this is your first withdrawal, admin verification is
                  required. Please allow up to{" "}
                  <strong>{FIRST_WITHDRAWAL_WAIT_HOURS} hours</strong> for the
                  first withdrawal to be reviewed and approved.
                </p>
              </div>
            </div>
          </div>

          {/* PROCESSING TIME */}

          <p className="mt-4 text-sm text-slate-500">
            Normal processing time: {withdrawSettings.processingTime}
          </p>

          {/* BUTTON */}

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
            <h1 className="text-2xl font-bold text-slate-900">Withdraw</h1>

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
                Your first withdrawal request will be manually reviewed by
                admin. Please allow up to{" "}
                <strong>{FIRST_WITHDRAWAL_WAIT_HOURS} hours</strong> for
                approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BALANCE
      ====================================================== */}

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-sm text-slate-500">Available Balance</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {balance.toLocaleString()}{" "}
          <span className="text-sm font-medium text-slate-500">MMK</span>
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
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {withdrawSettings.minimumWithdraw.toLocaleString()} MMK
            {" · "}
            Max: {withdrawSettings.maximumWithdraw.toLocaleString()} MMK
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
              const methodId = normalizePaymentMethodId(method.id);

              const selected = paymentMethodId === methodId;

              const displayName = getPaymentMethodDisplayName(method);

              /*
               * IMPORTANT:
               *
               * Do not access method.logo directly.
               *
               * The current PaymentMethod type may not contain
               * a logo property.
               */
              const logo = getPaymentMethodLogo(method);

              return (
                <button
                  key={methodId}
                  type="button"
                  onClick={() => handleSelectPaymentMethod(methodId)}
                  className={`relative rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  {/* SELECTED CHECK */}

                  {selected && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}

                  {/* METHOD HEADER */}

                  <div className="flex items-center gap-3">
                    {/* LOGO */}

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {logo ? (
                        <img
                          src={logo}
                          alt={`${displayName} logo`}
                          className="h-full w-full object-contain p-1.5"
                          onError={(event) => {
                            /*
                             * Hide broken image and show the
                             * fallback icon.
                             */
                            event.currentTarget.style.display = "none";

                            const parent = event.currentTarget.parentElement;

                            if (parent) {
                              parent.classList.add(
                                "flex",
                                "items-center",
                                "justify-center",
                              );
                            }
                          }}
                        />
                      ) : (
                        <CreditCard className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    {/* NAME */}

                    <div className="min-w-0 flex-1 pr-6">
                      <p
                        className={`text-base font-bold ${
                          selected ? "text-indigo-700" : "text-slate-800"
                        }`}
                      >
                        {displayName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Mobile Payment
                      </p>
                    </div>
                  </div>

                  {/* ACCOUNT INFORMATION */}

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
                      Enter your own {displayName} account number below.
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* NO METHODS */}

          {paymentMethods.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                No KPay or WavePay withdrawal methods available
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                KPay and WavePay are currently unavailable for withdrawal.
                Please contact support or try again later.
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
              Enter the {selectedPaymentMethodName} account where you want to
              receive your withdrawal.
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
            onChange={(event) => {
              setAccountName(event.target.value);

              setError("");
            }}
            placeholder="Enter account holder name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Enter the name registered with your KPay or WavePay account.
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
            onChange={(event) => {
              setAccountNumber(event.target.value);

              setError("");
            }}
            placeholder={
              selectedMethod
                ? `Enter ${selectedPaymentMethodName} account number`
                : "Select KPay or WavePay first"
            }
            disabled={!selectedMethod}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
              !selectedMethod
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : "border-slate-200 bg-white"
            }`}
          />

          <p className="mt-2 text-xs text-slate-400">
            Make sure the account number is correct before submitting.
          </p>
        </div>

        {/* ====================================================
            NOTE
        ==================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
            <span className="ml-1 font-normal text-slate-400">(Optional)</span>
          </label>

          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        {numericAmount > 0 && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Withdrawal</span>

              <span className="font-medium text-slate-800">
                {numericAmount.toLocaleString()} MMK
              </span>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">Withdrawal Fee</span>

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
                  {Math.max(netAmount, 0).toLocaleString()} MMK
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-400">Total wallet deduction</span>

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
                  Your first withdrawal requires manual admin approval.
                  Processing may take up to{" "}
                  <strong>{FIRST_WITHDRAWAL_WAIT_HOURS} hours</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            NORMAL APPROVAL
        ==================================================== */}

        {!isFirstWithdrawal && withdrawSettings.approvalRequired && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

              <div>
                <p className="text-sm font-semibold text-indigo-800">
                  Admin Approval Required
                </p>

                <p className="mt-1 text-xs leading-5 text-indigo-700">
                  Your withdrawal request will be reviewed by admin before the
                  payment is processed.
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
            SUBMIT
        ==================================================== */}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="success">
            {isFirstWithdrawal
              ? "Submit for Admin Approval"
              : "Submit Withdrawal Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
