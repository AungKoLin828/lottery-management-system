import { useMemo, useState } from "react";
import { ArrowDownToLine, Check, Copy, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import {
  depositSettings,
  walletPaymentMethods,
} from "@/services/walletSettings";

import { createDepositRequest } from "@/services/walletService";

import { notifyAdminDepositRequest } from "@/services/notificationService";

export default function Deposit() {
  /* ============================================================
     AMOUNT
  ============================================================ */

  const presetAmounts = useMemo(() => {
    return [5000, 10000, 50000, 100000].filter(
      (value) =>
        value >= depositSettings.minimumDeposit &&
        value <= depositSettings.maximumDeposit,
    );
  }, []);

  const [amount, setAmount] = useState(() => {
    const firstPreset = [5000, 10000, 50000, 100000].find(
      (value) =>
        value >= depositSettings.minimumDeposit &&
        value <= depositSettings.maximumDeposit,
    );

    return firstPreset ? String(firstPreset) : "";
  });

  /* ============================================================
     PAYMENT METHOD
  ============================================================ */

  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const [transactionNumber, setTransactionNumber] = useState("");

  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  /* ============================================================
     COPY STATE
  ============================================================ */

  const [copied, setCopied] = useState(false);

  /* ============================================================
     PAYMENT METHODS
  ============================================================ */

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter(
        (method) =>
          method.enabled &&
          (method.type === "Deposit" || method.type === "Both") &&
          depositSettings.allowedPaymentMethods.some(
            (allowedId) => String(allowedId) === String(method.id),
          ),
      )
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  }, []);

  /* ============================================================
     SELECTED PAYMENT METHOD
  ============================================================ */

  const selectedMethod = paymentMethods.find(
    (method) => String(method.id) === String(paymentMethodId),
  );

  /* ============================================================
     PAYMENT NUMBER
     
     Supports:
     - accountNumber
     - phoneNumber
     - phone
     
     accountNumber is the primary field used by
     the current payment-method database.
  ============================================================ */

  const paymentNumber = useMemo(() => {
    if (!selectedMethod) {
      return "";
    }

    return selectedMethod.accountNumber?.trim() || "";
  }, [selectedMethod]);

  /* ============================================================
     COPY PAYMENT NUMBER
  ============================================================ */

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

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    /* ----------------------------------------------------------
       AMOUNT VALIDATION
    ---------------------------------------------------------- */

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

    /* ----------------------------------------------------------
       PAYMENT METHOD VALIDATION
    ---------------------------------------------------------- */

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select a payment method.");

      return;
    }

    /* ----------------------------------------------------------
       TRANSACTION NUMBER
    ---------------------------------------------------------- */

    const normalizedTransactionNumber = transactionNumber.trim();

    if (!normalizedTransactionNumber) {
      setError("Transaction number is required.");

      return;
    }

    if (!/^\d{6}$/.test(normalizedTransactionNumber)) {
      setError("Please enter the last 6 digits of your transaction number.");

      return;
    }

    /* ----------------------------------------------------------
       CREATE DEPOSIT
    ---------------------------------------------------------- */

    const depositId = `DEP-${Date.now()}`;

    const request = createDepositRequest({
      id: depositId,

      playerId: "PLAYER-001",

      playerName: "Player",

      amount: numericAmount,

      paymentMethodId: selectedMethod.id,

      paymentMethodName: selectedMethod.name,

      transactionNumber: normalizedTransactionNumber,

      note: note.trim() || undefined,

      status: "PENDING",

      createdAt: new Date().toISOString(),
    });

    /* ----------------------------------------------------------
       NOTIFY ADMIN
    ---------------------------------------------------------- */

    notifyAdminDepositRequest({
      depositId: request.id,

      playerId: request.playerId,

      playerName: request.playerName,

      amount: request.amount,
    });

    setSubmitted(true);
  };

  /* ============================================================
     SUCCESS PAGE
  ============================================================ */

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

  /* ============================================================
     MAIN PAGE
  ============================================================ */

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ========================================================
          HEADER
      ======================================================== */}

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

      {/* ========================================================
          FORM
      ======================================================== */}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* ======================================================
            PAYMENT METHOD
        ====================================================== */}

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
                    onClick={() => {
                      setPaymentMethodId(String(method.id));

                      setError("");

                      setCopied(false);
                    }}
                    className={`relative flex min-h-[92px] items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    {/* RADIO */}

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? "border-indigo-600" : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    {/* PAYMENT ICON */}

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                      <CreditCard className="h-7 w-7 text-indigo-500" />
                    </div>

                    {/* METHOD INFORMATION */}

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

                    {/* SELECTED CHECK */}

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

          {/* ====================================================
              SELECTED PAYMENT DETAILS
          ==================================================== */}

          {selectedMethod && (
            <div className="mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50">
              {/* HEADER */}

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

              {/* ==================================================
                  ACCOUNT NAME
              ================================================== */}

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

              {/* ==================================================
                  ACCOUNT NUMBER
              ================================================== */}

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

              {/* ==================================================
                  BANK INFORMATION
              ================================================== */}

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

              {/* PAYMENT INSTRUCTION */}

              <div className="px-4 py-3">
                <p className="text-xs leading-5 text-slate-500">
                  After completing your payment, enter the last 6 digits of your
                  transaction number below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            AMOUNT
        ======================================================== */}

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
                    }`}
                  >
                    <input
                      type="radio"
                      name="depositAmount"
                      value={value}
                      checked={selected}
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
            onChange={(event) => {
              setAmount(event.target.value);

              setError("");
            }}
            placeholder="Enter custom amount"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {depositSettings.minimumDeposit.toLocaleString()} MMK · Max:{" "}
            {depositSettings.maximumDeposit.toLocaleString()} MMK
          </p>
        </div>

        {/* ========================================================
            TRANSACTION NUMBER
        ======================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Transaction Number
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={transactionNumber}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 6);

              setTransactionNumber(value);

              setError("");
            }}
            placeholder="Enter last 6 digits"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

        {/* ========================================================
            NOTE
        ======================================================== */}

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
            <span className="ml-1 font-normal text-slate-400">(Optional)</span>
          </label>

          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Enter an optional note"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* ========================================================
            DEPOSIT INFORMATION
        ======================================================== */}

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

        {/* ========================================================
            ERROR
        ======================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* ========================================================
            SUBMIT
        ======================================================== */}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="success">
            Submit Deposit Request
          </Button>
        </div>
      </form>
    </div>
  );
}
