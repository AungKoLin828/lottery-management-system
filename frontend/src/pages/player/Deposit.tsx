import { useMemo, useState } from "react";
import { ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Button from "@/components/common/Button";

import {
  depositSettings,
  walletPaymentMethods,
} from "@/services/walletSettings";

import { createDepositRequest } from "@/services/walletService";

import { notifyAdminDepositRequest } from "@/services/notificationService";

export default function Deposit() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter(
        (method) =>
          method.enabled &&
          (method.type === "Deposit" || method.type === "Both") &&
          depositSettings.allowedPaymentMethods.includes(method.id),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, []);

  const selectedMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
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

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select a payment method.");
      return;
    }

    if (!transactionNumber.trim()) {
      setError("Transaction number is required.");
      return;
    }

    const depositId = `DEP-${Date.now()}`;

    const request = createDepositRequest({
      id: depositId,
      playerId: "PLAYER-001",
      playerName: "Player",
      amount: numericAmount,
      paymentMethodId: selectedMethod.id,
      paymentMethodName: selectedMethod.name,
      transactionNumber: transactionNumber.trim(),
      note: note.trim() || undefined,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });

    /*
     * Create admin notification
     */
    notifyAdminDepositRequest({
      depositId: request.id,
      playerId: request.playerId,
      playerName: request.playerName,
      amount: request.amount,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
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
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Amount */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Deposit Amount
          </label>

          <input
            type="number"
            min={depositSettings.minimumDeposit}
            max={depositSettings.maximumDeposit}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {depositSettings.minimumDeposit.toLocaleString()} MMK · Max:{" "}
            {depositSettings.maximumDeposit.toLocaleString()} MMK
          </p>
        </div>

        {/* Payment Methods */}
        <div className="mt-6">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Payment Method
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => {
              const selected = paymentMethodId === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethodId(method.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100"
                      : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-800">{method.name}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {method.accountName}
                  </p>

                  <p className="text-sm font-medium text-slate-700">
                    {method.accountNumber}
                  </p>

                  {method.bankName && (
                    <p className="mt-1 text-xs text-slate-400">
                      {method.bankName}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transaction Number */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Transaction Number
          </label>

          <input
            type="text"
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            placeholder="Enter transaction/reference number"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Note */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Note
          </label>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Admin Note */}
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">
            Deposit Information
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {depositSettings.depositNote}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Processing time: {depositSettings.processingTime}
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="success">
            Submit Deposit Request
          </Button>
        </div>
      </form>
    </div>
  );
}
