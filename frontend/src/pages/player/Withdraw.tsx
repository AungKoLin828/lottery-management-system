import { useMemo, useState } from "react";
import { ArrowUpFromLine, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "@/components/common/Button";

import {
  walletPaymentMethods,
  withdrawSettings,
} from "@/services/walletSettings";

import { createWithdrawRequest } from "@/services/walletService";

import { notifyAdminWithdrawRequest } from "@/services/notificationService";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [note, setNote] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const balance = 125000;

  const paymentMethods = useMemo(() => {
    return walletPaymentMethods
      .filter(
        (method) =>
          method.enabled &&
          (method.type === "Withdraw" || method.type === "Both") &&
          withdrawSettings.allowedPaymentMethods.includes(method.id),
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, []);

  const selectedMethod = paymentMethods.find(
    (method) => method.id === paymentMethodId,
  );

  const numericAmount = Number(amount);

  const fee = withdrawSettings.withdrawFee;

  const totalDeduction = numericAmount + fee;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

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

    if (totalDeduction > balance) {
      setError("Insufficient wallet balance.");
      return;
    }

    if (!paymentMethodId || !selectedMethod) {
      setError("Please select a payment method.");
      return;
    }

    if (!accountName.trim()) {
      setError("Account name is required.");
      return;
    }

    if (!accountNumber.trim()) {
      setError("Account number is required.");
      return;
    }

    const withdrawId = `WDR-${Date.now()}`;

    const request = createWithdrawRequest({
      id: withdrawId,

      playerId: "PLAYER-001",

      playerName: "Player",

      amount: numericAmount,

      fee,

      netAmount: numericAmount - fee,

      paymentMethodId: selectedMethod.id,

      paymentMethodName: selectedMethod.name,

      accountName: accountName.trim(),

      accountNumber: accountNumber.trim(),

      note: note.trim() || undefined,

      status: "PENDING",

      createdAt: new Date().toISOString(),
    });

    /*
     * Notify admin
     */
    notifyAdminWithdrawRequest({
      withdrawId: request.id,
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
            Withdrawal Request Submitted
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your withdrawal request has been submitted successfully.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Processing time: {withdrawSettings.processingTime}
          </p>

          <div className="mt-6">
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

      {/* Balance */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-sm text-slate-500">Available Balance</p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {balance.toLocaleString()}{" "}
          <span className="text-sm font-medium text-slate-500">MMK</span>
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        {/* Amount */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Withdrawal Amount
          </label>

          <input
            type="number"
            min={withdrawSettings.minimumWithdraw}
            max={withdrawSettings.maximumWithdraw}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          <p className="mt-2 text-xs text-slate-400">
            Min: {withdrawSettings.minimumWithdraw.toLocaleString()} MMK · Max:{" "}
            {withdrawSettings.maximumWithdraw.toLocaleString()} MMK
          </p>
        </div>

        {/* Payment Methods */}
        <div className="mt-6">
          <label className="mb-3 block text-sm font-semibold text-slate-700">
            Withdrawal Method
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

        {/* Account Name */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account Name
          </label>

          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Enter account name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Account Number */}
        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Account Number
          </label>

          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter account number"
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

        {/* Summary */}
        {numericAmount > 0 && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Withdrawal</span>

              <span className="font-medium">
                {numericAmount.toLocaleString()} MMK
              </span>
            </div>

            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">Fee</span>

              <span className="font-medium">{fee.toLocaleString()} MMK</span>
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">
                  You receive
                </span>

                <span className="font-bold text-indigo-600">
                  {(numericAmount - fee).toLocaleString()} MMK
                </span>
              </div>
            </div>
          </div>
        )}

        {withdrawSettings.approvalRequired && (
          <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Your withdrawal request requires admin approval.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="success">
            Submit Withdrawal Request
          </Button>
        </div>
      </form>
    </div>
  );
}
