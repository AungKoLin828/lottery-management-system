// src/pages/admin/TransactionManagement.tsx

import { useState } from "react";

import type { Transaction } from "@/types/transaction";
import type { DepositRequest } from "@/types/deposit";
import type { WithdrawRequest } from "@/types/withdraw";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

import {
  notifyPlayerDepositApproved,
  notifyPlayerDepositRejected,
  notifyPlayerWithdrawApproved,
  notifyPlayerWithdrawRejected,
} from "@/services/notificationService";

export default function TransactionManagement() {
  /* ============================================================
     STATE
  ============================================================ */

  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(
    null,
  );

  const [approvedAmount, setApprovedAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");

  const [transactionNumber, setTransactionNumber] = useState("");

  const [note, setNote] = useState("");

  const [processing, setProcessing] = useState(false);

  /* ============================================================
     DEPOSIT REQUESTS
  ============================================================ */

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([
    {
      id: 1,
      playerId: "P001",
      playerName: "Maung Maung",
      phone: "09123456789",
      requestedAmount: 5000,
      paymentMethod: "KBZPay",
      transactionNumber: "KBZ998877",
      status: "Pending",
      createdAt: "2026-08-05",
    },
    {
      id: 2,
      playerId: "P002",
      playerName: "Aung Aung",
      phone: "09987654321",
      requestedAmount: 10000,
      paymentMethod: "WavePay",
      transactionNumber: "WV123456",
      status: "Pending",
      createdAt: "2026-08-05",
    },
  ]);

  /* ============================================================
     WITHDRAW REQUESTS
  ============================================================ */

  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([
    {
      id: 1,
      playerId: "P001",
      playerName: "Mg Mg",
      phone: "09123456789",
      requestedAmount: 3000,
      paymentMethod: "KBZPay",
      accountNumber: "09123456789",
      status: "Pending",
      createdAt: "2026-08-06",
    },
  ]);

  /* ============================================================
     TRANSACTIONS
  ============================================================ */

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /* ============================================================
     OPEN APPROVE DEPOSIT MODAL
  ============================================================ */

  const openApprove = (req: DepositRequest) => {
    setSelectedRequest(req);

    setApprovedAmount(String(req.requestedAmount));

    setPaymentMethod(req.paymentMethod);

    setTransactionNumber(req.transactionNumber);

    setNote("");

    setOpenApproveModal(true);
  };

  /* ============================================================
     APPROVE DEPOSIT
  ============================================================ */

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequest) {
      return;
    }

    const amount = Number(approvedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!paymentMethod.trim()) {
      alert("Please enter payment method.");
      return;
    }

    if (!transactionNumber.trim()) {
      alert("Please enter transaction number.");
      return;
    }

    try {
      setProcessing(true);

      const transactionId = Date.now();

      /* --------------------------------------------------------
         Add transaction

         The real backend should also update the player's wallet.
      -------------------------------------------------------- */

      const transaction: Transaction = {
        id: transactionId,

        playerId: selectedRequest.playerId,

        playerName: selectedRequest.playerName,

        type: "Deposit",

        amount,

        paymentMethod,

        transactionNumber,

        note:
          note ||
          `Deposit approved via ${paymentMethod} - ${transactionNumber}`,

        createdBy: "admin",

        createdAt: new Date().toISOString().split("T")[0],
      };

      setTransactions((prev) => [transaction, ...prev]);

      /* --------------------------------------------------------
         Update request
      -------------------------------------------------------- */

      setDepositRequests((prev) =>
        prev.map((req) =>
          req.id === selectedRequest.id
            ? {
                ...req,
                status: "Approved",
                requestedAmount: amount,
                paymentMethod,
                transactionNumber,
              }
            : req,
        ),
      );

      /* --------------------------------------------------------
         Notify player
      -------------------------------------------------------- */

      await notifyPlayerDepositApproved({
        playerId: selectedRequest.playerId,

        depositId: String(selectedRequest.id),

        amount,
      });

      /* --------------------------------------------------------
         Close modal
      -------------------------------------------------------- */

      setOpenApproveModal(false);

      setSelectedRequest(null);

      setApprovedAmount("");

      setPaymentMethod("");

      setTransactionNumber("");

      setNote("");
    } catch (error) {
      console.error("Approve deposit error:", error);

      alert("Deposit approval completed, but notification failed.");
    } finally {
      setProcessing(false);
    }
  };

  /* ============================================================
     REJECT DEPOSIT
  ============================================================ */

  const handleReject = async (req: DepositRequest) => {
    const confirmReject = window.confirm(
      `Reject deposit request from ${req.playerName}?`,
    );

    if (!confirmReject) {
      return;
    }

    try {
      setProcessing(true);

      /* --------------------------------------------------------
         Update request status
      -------------------------------------------------------- */

      setDepositRequests((prev) =>
        prev.map((item) =>
          item.id === req.id
            ? {
                ...item,
                status: "Rejected",
              }
            : item,
        ),
      );

      /* --------------------------------------------------------
         Add rejection transaction
      -------------------------------------------------------- */

      const transaction: Transaction = {
        id: Date.now(),

        playerId: req.playerId,

        playerName: req.playerName,

        type: "Adjustment",

        amount: 0,

        paymentMethod: req.paymentMethod,

        transactionNumber: req.transactionNumber,

        note: `Deposit request rejected. Requested amount: ${req.requestedAmount}`,

        createdBy: "admin",

        createdAt: new Date().toISOString().split("T")[0],
      };

      setTransactions((prev) => [transaction, ...prev]);

      /* --------------------------------------------------------
         Notify player
      -------------------------------------------------------- */

      await notifyPlayerDepositRejected({
        playerId: req.playerId,

        depositId: String(req.id),

        amount: req.requestedAmount,

        reason: "Payment request was rejected by admin.",
      });
    } catch (error) {
      console.error("Reject deposit error:", error);

      alert("Deposit rejection completed, but notification failed.");
    } finally {
      setProcessing(false);
    }
  };

  /* ============================================================
     APPROVE WITHDRAW

     IMPORTANT:
     Wallet balance is no longer maintained in this component.
     The backend should:
       1. Check player's real wallet balance.
       2. Deduct the withdrawal amount.
       3. Update the withdrawal request.
       4. Create the transaction.
  ============================================================ */

  const handleApproveWithdraw = async (req: WithdrawRequest) => {
    const amount = req.requestedAmount;

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Invalid withdrawal amount.");
      return;
    }

    const confirmApprove = window.confirm(
      `Approve withdrawal of ${amount.toLocaleString()} MMK for ${req.playerName}?`,
    );

    if (!confirmApprove) {
      return;
    }

    try {
      setProcessing(true);

      const transactionId = Date.now();

      /* --------------------------------------------------------
         Add transaction

         The real backend should validate and deduct the wallet.
      -------------------------------------------------------- */

      const transaction: Transaction = {
        id: transactionId,

        playerId: req.playerId,

        playerName: req.playerName,

        type: "Withdraw",

        amount,

        paymentMethod: req.paymentMethod,

        transactionNumber: req.accountNumber,

        note: "Withdraw approved",

        createdBy: "admin",

        createdAt: new Date().toISOString().split("T")[0],
      };

      setTransactions((prev) => [transaction, ...prev]);

      /* --------------------------------------------------------
         Update withdraw request
      -------------------------------------------------------- */

      setWithdrawRequests((prev) =>
        prev.map((item) =>
          item.id === req.id
            ? {
                ...item,
                status: "Approved",
              }
            : item,
        ),
      );

      /* --------------------------------------------------------
         Notify player
      -------------------------------------------------------- */

      await notifyPlayerWithdrawApproved({
        playerId: req.playerId,

        withdrawId: String(req.id),

        amount,
      });
    } catch (error) {
      console.error("Approve withdraw error:", error);

      alert("Withdrawal approval completed, but notification failed.");
    } finally {
      setProcessing(false);
    }
  };

  /* ============================================================
     REJECT WITHDRAW
  ============================================================ */

  const handleRejectWithdraw = async (req: WithdrawRequest) => {
    const confirmReject = window.confirm(
      `Reject withdraw request from ${req.playerName}?`,
    );

    if (!confirmReject) {
      return;
    }

    try {
      setProcessing(true);

      /* --------------------------------------------------------
         Update status
      -------------------------------------------------------- */

      setWithdrawRequests((prev) =>
        prev.map((item) =>
          item.id === req.id
            ? {
                ...item,
                status: "Rejected",
              }
            : item,
        ),
      );

      /* --------------------------------------------------------
         Add transaction
      -------------------------------------------------------- */

      const transaction: Transaction = {
        id: Date.now(),

        playerId: req.playerId,

        playerName: req.playerName,

        type: "Adjustment",

        amount: 0,

        paymentMethod: req.paymentMethod,

        transactionNumber: req.accountNumber,

        note: `Withdraw request rejected. Requested amount: ${req.requestedAmount}`,

        createdBy: "admin",

        createdAt: new Date().toISOString().split("T")[0],
      };

      setTransactions((prev) => [transaction, ...prev]);

      /* --------------------------------------------------------
         Notify player
      -------------------------------------------------------- */

      await notifyPlayerWithdrawRejected({
        playerId: req.playerId,

        withdrawId: String(req.id),

        amount: req.requestedAmount,

        reason: "Withdrawal request was rejected by admin.",
      });
    } catch (error) {
      console.error("Reject withdraw error:", error);

      alert("Withdrawal rejection completed, but notification failed.");
    } finally {
      setProcessing(false);
    }
  };

  /* ============================================================
     STATUS BADGE
  ============================================================ */

  const statusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-w-0 space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Transaction Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage player deposits, withdrawals and transactions.
        </p>
      </div>

      {/* ======================================================
          DEPOSIT REQUESTS
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Deposit Requests
            </h2>

            <p className="text-sm text-gray-500">
              Review pending player deposits.
            </p>
          </div>

          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            {depositRequests.filter((item) => item.status === "Pending").length}{" "}
            Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Player</th>

                <th className="px-6 py-3">Phone</th>

                <th className="px-6 py-3">Amount</th>

                <th className="px-6 py-3">Payment</th>

                <th className="px-6 py-3">Transaction No.</th>

                <th className="px-6 py-3">Status</th>

                <th className="px-6 py-3">Date</th>

                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {depositRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{req.playerName}</div>

                    <div className="text-xs text-gray-500">{req.playerId}</div>
                  </td>

                  <td className="px-6 py-4">{req.phone}</td>

                  <td className="px-6 py-4 font-semibold">
                    {req.requestedAmount.toLocaleString()} MMK
                  </td>

                  <td className="px-6 py-4">{req.paymentMethod}</td>

                  <td className="px-6 py-4">{req.transactionNumber}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        req.status,
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">{req.createdAt}</td>

                  <td className="px-6 py-4">
                    {req.status === "Pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          disabled={processing}
                          onClick={() => openApprove(req)}
                        >
                          Approve
                        </Button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void handleReject(req)}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {depositRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No deposit requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          WITHDRAW REQUESTS
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Withdraw Requests
            </h2>

            <p className="text-sm text-gray-500">
              Review player withdrawal requests.
            </p>
          </div>

          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
            {
              withdrawRequests.filter((item) => item.status === "Pending")
                .length
            }{" "}
            Pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Player</th>

                <th className="px-6 py-3">Phone</th>

                <th className="px-6 py-3">Amount</th>

                <th className="px-6 py-3">Payment</th>

                <th className="px-6 py-3">Account</th>

                <th className="px-6 py-3">Status</th>

                <th className="px-6 py-3">Date</th>

                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {withdrawRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{req.playerName}</div>

                    <div className="text-xs text-gray-500">{req.playerId}</div>
                  </td>

                  <td className="px-6 py-4">{req.phone}</td>

                  <td className="px-6 py-4 font-semibold">
                    {req.requestedAmount.toLocaleString()} MMK
                  </td>

                  <td className="px-6 py-4">{req.paymentMethod}</td>

                  <td className="px-6 py-4">{req.accountNumber}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                        req.status,
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">{req.createdAt}</td>

                  <td className="px-6 py-4">
                    {req.status === "Pending" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          disabled={processing}
                          onClick={() => void handleApproveWithdraw(req)}
                        >
                          Approve
                        </Button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => void handleRejectWithdraw(req)}
                          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No withdraw requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          TRANSACTION HISTORY
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Deposit and withdrawal transaction history.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">Player</th>

                <th className="px-6 py-3">Type</th>

                <th className="px-6 py-3">Amount</th>

                <th className="px-6 py-3">Payment</th>

                <th className="px-6 py-3">Transaction No.</th>

                <th className="px-6 py-3">Note</th>

                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{transaction.playerName}</div>

                    <div className="text-xs text-gray-500">
                      {transaction.playerId}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        transaction.type === "Deposit"
                          ? "bg-green-100 text-green-700"
                          : transaction.type === "Withdraw"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-semibold">
                    {transaction.amount.toLocaleString()} MMK
                  </td>

                  <td className="px-6 py-4">
                    {transaction.paymentMethod || "-"}
                  </td>

                  <td className="px-6 py-4">
                    {transaction.transactionNumber || "-"}
                  </td>

                  <td className="max-w-xs px-6 py-4 text-gray-600">
                    {transaction.note || "-"}
                  </td>

                  <td className="px-6 py-4">{transaction.createdAt}</td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          APPROVE DEPOSIT MODAL
      ====================================================== */}

      <Modal
        open={openApproveModal}
        onClose={() => {
          if (!processing) {
            setOpenApproveModal(false);
            setSelectedRequest(null);
          }
        }}
        title="Approve Deposit"
      >
        <form onSubmit={handleApprove} className="space-y-4">
          {selectedRequest && (
            <>
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Player</p>

                    <p className="font-semibold text-gray-900">
                      {selectedRequest.playerName}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Player ID</p>

                    <p className="font-semibold text-gray-900">
                      {selectedRequest.playerId}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Phone</p>

                    <p className="font-semibold text-gray-900">
                      {selectedRequest.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Requested Amount</p>

                    <p className="font-semibold text-green-600">
                      {selectedRequest.requestedAmount.toLocaleString()} MMK
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Requested Payment</p>

                    <p className="font-semibold text-gray-900">
                      {selectedRequest.paymentMethod}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Transaction Number</p>

                    <p className="font-semibold text-gray-900">
                      {selectedRequest.transactionNumber}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label="Approved Amount"
                type="number"
                min="1"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                disabled={processing}
                required
              />

              <Input
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="KBZPay / WavePay / Bank Transfer"
                disabled={processing}
                required
              />

              <Input
                label="Transaction Number"
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Enter transaction number"
                disabled={processing}
                required
              />

              <Input
                label="Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
                disabled={processing}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setOpenApproveModal(false)}
                  className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <Button type="submit" disabled={processing}>
                  {processing ? "Processing..." : "Approve Deposit"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
