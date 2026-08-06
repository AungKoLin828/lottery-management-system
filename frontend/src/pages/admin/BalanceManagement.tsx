import { useState } from "react";

import type { Wallet } from "@/types/wallet";
import type { Transaction } from "@/types/transaction";
import type { DepositRequest } from "@/types/deposit";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

export default function BalanceManagement() {
  const [openModal, setOpenModal] = useState(false);

  const [selectedPlayer, setSelectedPlayer] = useState<Wallet | null>(null);

  const [depositAmount, setDepositAmount] = useState("");

  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(
    null,
  );

  const [approvedAmount, setApprovedAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("");

  const [transactionNumber, setTransactionNumber] = useState("");

  const [note, setNote] = useState("");
  // sample data
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: 1,
      playerId: "P001",
      playerName: "Mg Mg",
      phone: "09123456789",
      balance: 10000,
    },

    {
      id: 2,
      playerId: "P002",
      playerName: "Aung Aung",
      phone: "09987654321",
      balance: 5000,
    },
  ]);

  // sample data
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([
    {
      id: 1,

      playerId: "P001",

      playerName: "Mg Mg",

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

  const openApprove = (req: DepositRequest) => {
    setSelectedRequest(req);
    setApprovedAmount(String(req.requestedAmount));
    setPaymentMethod(req.paymentMethod);
    setTransactionNumber(req.transactionNumber);
    setOpenApproveModal(true);
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const openDeposit = (wallet: Wallet) => {
    setSelectedPlayer(wallet);

    setDepositAmount("");

    setNote("");

    setOpenModal(true);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayer) return;

    const amount = Number(depositAmount);

    if (amount <= 0) {
      alert("Invalid amount");
      return;
    }

    // update wallet balance
    setWallets((prev) =>
      prev.map((wallet) =>
        wallet.id === selectedPlayer.id
          ? {
              ...wallet,
              balance: wallet.balance + amount,
            }
          : wallet,
      ),
    );

    // add transaction history
    const transaction: Transaction = {
      id: Date.now(),

      playerId: selectedPlayer.playerId,

      playerName: selectedPlayer.playerName,

      type: "Deposit",

      amount,

      note,

      createdBy: "admin",

      createdAt: new Date().toISOString().split("T")[0],
    };

    setTransactions((prev) => [transaction, ...prev]);

    setOpenModal(false);
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRequest) return;

    const amount = Number(approvedAmount);

    if (amount <= 0) {
      alert("Invalid amount");
      return;
    }

    // Update player wallet balance
    setWallets((prev) =>
      prev.map((wallet) =>
        wallet.playerId === selectedRequest.playerId
          ? {
              ...wallet,
              balance: wallet.balance + amount,
            }
          : wallet,
      ),
    );

    // Add transaction history
    const transaction: Transaction = {
      id: Date.now(),

      playerId: selectedRequest.playerId,

      playerName: selectedRequest.playerName,

      type: "Deposit",

      amount,

      note: `Approved via ${paymentMethod} - ${transactionNumber}`,

      createdBy: "admin",

      createdAt: new Date().toISOString().split("T")[0],
    };

    setTransactions((prev) => [transaction, ...prev]);

    // Update request status
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

    // Close modal
    setOpenApproveModal(false);

    // Reset
    setSelectedRequest(null);
    setApprovedAmount("");
    setPaymentMethod("");
    setTransactionNumber("");
  };

  const handleReject = (req: DepositRequest) => {
    const confirmReject = window.confirm(
      `Reject deposit request from ${req.playerName}?`,
    );

    if (!confirmReject) return;

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

    const transaction: Transaction = {
      id: Date.now(),

      playerId: req.playerId,

      playerName: req.playerName,

      type: "Reject Deposit",

      amount: req.requestedAmount,

      note: "Deposit request rejected",

      createdBy: "admin",

      createdAt: new Date().toISOString().split("T")[0],
    };

    setTransactions((prev) => [transaction, ...prev]);
  };

  return (
    <div>
      {/* Header */}

      <div
        className="
        flex
        justify-between
        mb-6
      "
      >
        <h1
          className="
          text-2xl
          font-bold
        "
        >
          Balance Management
        </h1>
      </div>

      {/* Wallet List */}

      <div
        className="
        bg-white
        rounded-xl
        shadow
        p-5
        overflow-x-auto
      "
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Player</th>

              <th className="p-3 text-left">Phone</th>

              <th className="p-3 text-left">Balance</th>

              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {wallets.map((wallet) => (
              <tr key={wallet.id} className="border-b">
                <td className="p-3">{wallet.playerName}</td>

                <td className="p-3">{wallet.phone}</td>

                <td className="p-3 font-bold">
                  {wallet.balance.toLocaleString()} MMK
                </td>

                <td className="p-3">
                  <Button variant="success" onClick={() => openDeposit(wallet)}>
                    Deposit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Deposit Requests</h2>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3">Player</th>

            <th>Amount</th>

            <th>Method</th>

            <th>Transaction No</th>

            <th>Status</th>

            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {depositRequests.map((req) => (
            <tr key={req.id} className="border-b">
              <td className="p-3">{req.playerName}</td>

              <td>
                {req.requestedAmount}
                MMK
              </td>

              <td>{req.paymentMethod}</td>

              <td>{req.transactionNumber}</td>

              <td>{req.status}</td>

              <td className="flex gap-2 p-3">
                {req.status === "Pending" && (
                  <>
                    <Button variant="success" onClick={() => openApprove(req)}>
                      Approve
                    </Button>

                    <Button variant="danger" onClick={() => handleReject(req)}>
                      Reject
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Transaction History */}

      <div
        className="
        mt-8
        bg-white
        rounded-xl
        shadow
        p-5
      "
      >
        <h2
          className="
          text-xl
          font-bold
          mb-4
        "
        >
          Transaction History
        </h2>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Player</th>

              <th className="p-3">Type</th>

              <th className="p-3">Amount</th>

              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b">
                <td className="p-3">{tx.playerName}</td>

                <td className="p-3">{tx.type}</td>

                <td className="p-3">{tx.amount.toLocaleString()} MMK</td>

                <td className="p-3">{tx.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deposit Modal */}

      <Modal
        open={openModal}
        title="Deposit Balance"
        onClose={() => setOpenModal(false)}
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <Input
            label="Player"
            value={selectedPlayer?.playerName ?? ""}
            disabled
          />

          <Input
            label="Deposit Amount"
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="5000"
          />

          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Cash deposit"
          />

          <div
            className="
            flex
            justify-end
            gap-3
          "
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              Deposit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Modal */}
      <Modal
        open={openApproveModal}
        title="Approve Deposit"
        onClose={() => {
          setOpenApproveModal(false);
          setSelectedRequest(null);
        }}
      >
        <form onSubmit={handleApprove} className="space-y-4">
          <Input
            label="Player"
            value={selectedRequest?.playerName ?? ""}
            disabled
          />

          <Input
            label="Approved Amount"
            type="number"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
          />

          <select
            className="border p-2 w-full"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option>KBZPay</option>

            <option>WavePay</option>

            <option>AYA Pay</option>

            <option>Bank Transfer</option>
          </select>

          <Input
            label="Transaction Number"
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenApproveModal(false)}
            >
              Cancel
            </Button>

            <Button type="submit" variant="success">
              Approve
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
